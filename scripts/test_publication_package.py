"""Safety/integrity tests use synthetic files only, never research input data."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location("packager", Path(__file__).with_name("build_publication_package.py"))
packager = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(packager)


class PublicationPackageTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="publication-package-test-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.destination = self.root / packager.DEFAULT_DEST
        package = {"name": "synthetic-app", "private": True, "scripts": {
            "dev": "vite", "build": "tsc && vite build", "lint": "eslint .", "typecheck": "tsc --noEmit", "test:run": "vitest run", "ci": "npm run build", "analysis:sample": "private-runner", "validate:memory": "private-notes"}}
        self.write("package.json", json.dumps(package).encode())
        self.write(".gitattributes", b"* text=auto\r\n")
        self.write("src/App.tsx", b"export default function App() { return null }\n")
        self.write("sas_code_public/analysis.sas", b'libname source "<SOURCE_DATA_PATH>";\n')
        self.data = b"Parameter,Estimate\nExample,0.125000\n"
        self.write("public/data/results.csv", self.data)
        self.config = {"schema_version": 1, "repository_name": "Transfusion-Dashboard-publication",
            "source_files": [".gitattributes", "package.json", "src/App.tsx", "sas_code_public/analysis.sas"],
            "staged_npm_scripts": ["dev", "build", "lint", "typecheck", "test:run", "ci"], "replacements": [],
            "release_gates": {name: {"status": "pending", "review_reference": None} for name in packager.GATES},
            "data_candidates": [{"source": "public/data/results.csv", "action": "pending", "sha256": None, "role": "synthetic", "review_reference": None}]}

    def write(self, relative, data):
        path = self.root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)

    def approve_synthetic(self):
        for gate in self.config["release_gates"].values():
            gate.update(status="approved", review_reference="synthetic-test-only")
        self.config["data_candidates"][0].update(action="include", sha256=hashlib.sha256(self.data).hexdigest(), review_reference="synthetic-test-only")
        sources = self.config["source_files"] + [entry["source"] for entry in self.config["data_candidates"]]
        hashes = {name: hashlib.sha256((self.root / name).read_bytes()).hexdigest() for name in sources}
        self.config["reviewed_inputs_sha256"] = packager.reviewed_input_digest(self.config, hashes)

    def build(self, release=False):
        return packager.build_package(self.root, self.config, self.destination, release=release)

    def test_preview_excludes_data_and_private_files_and_prunes_commands(self):
        self.write("manuscript/private.docx", b"private")
        self.write("memory/private.md", b"private")
        self.write(".git/config", b"private")
        self.approve_synthetic()  # Preview mode never copies CSVs, even if approved.
        report = self.build()
        self.assertEqual(report["staged_csv_count"], 0)
        self.assertFalse((self.destination / "public/data").exists())
        for part in ("manuscript", "memory", ".git"):
            self.assertFalse((self.destination / part).exists())
        package = json.loads((self.destination / "package.json").read_text())
        self.assertNotIn("analysis:sample", package["scripts"])
        self.assertNotIn("validate:memory", package["scripts"])
        self.assertIn("verify-publication-release.mjs", package["scripts"]["build"])

    def test_repeated_assembly_is_byte_identical(self):
        first = self.build()
        second = self.build()
        self.assertEqual(first, second)
        self.assertEqual(first["manifest_sha256"], hashlib.sha256((self.destination / packager.MANIFEST).read_bytes()).hexdigest())

    def test_pending_release_creates_nothing(self):
        with self.assertRaisesRegex(packager.PackageError, "Release refused"):
            self.build(release=True)
        self.assertFalse(self.destination.exists())

    def test_approved_release_preserves_exact_csv_bytes(self):
        self.approve_synthetic()
        report = self.build(release=True)
        self.assertEqual(report["release_blockers"], [])
        self.assertEqual((self.destination / "public/data/results.csv").read_bytes(), self.data)
        self.assertEqual(report["staged_csv_count"], 1)

    def test_changed_reviewed_csv_refuses_release(self):
        self.approve_synthetic()
        self.write("public/data/results.csv", b"Parameter,Estimate\nExample,0.126\n")
        with self.assertRaisesRegex(packager.PackageError, "CSV hash missing or changed"):
            self.build(release=True)

    def test_uninventoried_csv_refuses_release(self):
        self.approve_synthetic()
        self.write("public/data/new.csv", self.data)
        with self.assertRaisesRegex(packager.PackageError, "Uninventoried CSV"):
            self.build(release=True)

    def test_new_application_file_refuses_release(self):
        self.approve_synthetic()
        self.write("src/Important.ts", b"export const important = true")
        with self.assertRaisesRegex(packager.PackageError, "outside the explicit allowlist"):
            self.build(release=True)

    def test_source_data_cannot_bypass_separate_approval(self):
        for path in ("public/data/results.csv", "Public/Data/results.csv", "public/DATA/results.csv", "src/results.csv", "results.CSV"):
            with self.subTest(path=path), self.assertRaisesRegex(packager.PackageError, "separate data approval"):
                packager.safe_relative(path)

    def test_changed_source_invalidates_release_review(self):
        self.approve_synthetic()
        self.write("sas_code_public/analysis.sas", b"/* different analysis */\n")
        with self.assertRaisesRegex(packager.PackageError, "Input fingerprint missing or changed"):
            self.build(release=True)

    def test_changed_package_configuration_invalidates_release_review(self):
        self.approve_synthetic()
        self.config["repository_name"] = "Changed-Repository"
        with self.assertRaisesRegex(packager.PackageError, "Input fingerprint missing or changed"):
            self.build(release=True)

    def test_staged_git_attributes_preserve_reviewed_bytes(self):
        self.build()
        self.assertIn(b"* -text\n", (self.destination / ".gitattributes").read_bytes())
        self.assertEqual((self.root / ".gitattributes").read_bytes(), b"* text=auto\r\n")

    def test_forbidden_paths_and_extensions_rejected(self):
        for relative in ("../secret", "/secret", "memory/secret.md", ".git/config", "source.sas7bdat", "report.docx", ".env.local", "C:/private", "memory./data-integrity.md", "memory /data-integrity.md", "src/CON.txt", "src/NUL", "src/App.tsx ", "src//App.tsx"):
            with self.subTest(relative=relative), self.assertRaises(packager.PackageError):
                packager.safe_relative(relative)

    def test_internal_path_and_secret_fail_without_echoing_content(self):
        for value in (b'C:\\private-location\\study', b'ghp_' + b'x' * 30):
            self.write("src/App.tsx", value)
            with self.assertRaises(packager.PackageError) as error:
                self.build()
            self.assertNotIn(value.decode(), str(error.exception))

    def test_explicit_placeholder_substitution_only_changes_stage(self):
        original = b'libname source "C:\\private-location\\study";\n'
        self.write("sas_code_public/analysis.sas", original)
        self.config["replacements"] = [{"source": "sas_code_public/analysis.sas", "old": "C:\\private-location\\study", "placeholder": "<SOURCE_DATA_PATH>", "expected_occurrences": 1}]
        report = self.build()
        self.assertEqual((self.root / "sas_code_public/analysis.sas").read_bytes(), original)
        self.assertIn(b"<SOURCE_DATA_PATH>", (self.destination / "sas_code_public/analysis.sas").read_bytes())
        self.assertTrue(any(change["kind"] == "local_path_placeholder" for change in report["transformations"]))

    def test_destination_must_stay_in_private_stage(self):
        self.destination = self.root / "public/new-repo"
        with self.assertRaisesRegex(packager.PackageError, "private publication_stage"):
            self.build()
        self.assertFalse(self.destination.exists())

    def test_unmanaged_destination_is_preserved(self):
        self.destination.mkdir(parents=True)
        original = self.destination / "keep.txt"
        original.write_text("keep")
        with self.assertRaisesRegex(packager.PackageError, "not created by this builder"):
            self.build()
        self.assertEqual(original.read_text(), "keep")

    def test_manual_staging_edits_are_preserved(self):
        self.build()
        target = self.destination / "src/App.tsx"
        target.write_text("manually reviewed")
        with self.assertRaisesRegex(packager.PackageError, "Staged file changed"):
            self.build()
        self.assertEqual(target.read_text(), "manually reviewed")

    def test_review_reference_cannot_expose_a_local_path(self):
        self.config["release_gates"]["producing_code_alignment"]["review_reference"] = "C:\\private-location\\approval"
        with self.assertRaisesRegex(packager.PackageError, "Local path detected in publication-manifest"):
            self.build()


if __name__ == "__main__":
    unittest.main()
