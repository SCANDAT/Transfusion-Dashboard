#!/usr/bin/env python3
"""Assemble an explicit, reviewed publication tree without importing Git history.

Default mode is a PRIVATE, DATA-FREE preview. Release mode refuses pending gates,
undecided CSVs, changed approved CSV bytes, unexpected source files and local paths.
No original files are modified, Git operations performed, or directories deleted.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path, PurePosixPath

MANIFEST = "publication-manifest.json"
FORMAT = "transfusion-publication-package-v1"
DEFAULT_DEST = "manuscript/review_audit/publication_stage/Transfusion-Dashboard-publication"
FORBIDDEN_PARTS = {".git", ".claude", ".codex", ".agents", "memory", "manuscript", "analysis", "sas_code", "node_modules", "dist"}
FORBIDDEN_SUFFIXES = {".sas7bdat", ".sas7bndx", ".sas7bcat", ".sas7bvew", ".sas7bitm", ".xpt", ".sashdat", ".log", ".lst", ".docx", ".doc", ".pdf", ".zip"}
LOCAL_PATH = re.compile(r"(?i)(?:\b[A-Z]:[\\/]|\\\\[A-Za-z0-9_.-]+[\\/]|/(?:home|Users|mnt|Volumes)/)")
SECRET = re.compile(r"(?:-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9]{20,}|\bgithub_pat_[A-Za-z0-9_]{30,})")
GATES = {"producing_code_alignment", "full_cohort_provenance", "model_and_uncertainty_consistency", "export_disclosure_review", "scientific_text_review", "browser_and_performance_validation", "data_license_and_release_review"}


class PackageError(ValueError):
    pass


def encoded_json(value: object) -> bytes:
    return (json.dumps(value, indent=2, ensure_ascii=False, sort_keys=True) + "\n").encode("utf-8")


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def safe_relative(value: str, *, allow_data: bool = False) -> str:
    if not isinstance(value, str) or not value or "\\" in value or ":" in value:
        raise PackageError("Invalid relative allowlist path")
    path = PurePosixPath(value)
    if path.is_absolute() or value != path.as_posix() or any(part in (".", "..") for part in value.split("/")):
        raise PackageError("Path traversal is forbidden")
    if any(part.endswith((".", " ")) for part in path.parts):
        raise PackageError("Windows path aliases with trailing dots or spaces are forbidden")
    if any(re.fullmatch(r"(?i)(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\..*)?", part) for part in path.parts):
        raise PackageError("Windows device names are forbidden")
    if any(part.lower() in FORBIDDEN_PARTS for part in path.parts):
        raise PackageError("A private/development directory was added to the allowlist")
    if path.suffix.lower() in FORBIDDEN_SUFFIXES or path.name.lower().startswith(".env"):
        raise PackageError("A prohibited file type was added to the allowlist")
    if (path.suffix.lower() == ".csv" or value.lower().startswith("public/data/")) and not allow_data:
        raise PackageError("Data must pass the separate data approval path")
    if allow_data and (path.parent.as_posix() != "public/data" or path.suffix != ".csv"):
        raise PackageError("Data approval entries must be direct public/data/*.csv files")
    return path.as_posix()


def checked_source(root: Path, relative: str, *, allow_data: bool = False) -> Path:
    path = root / relative
    resolved = path.resolve()
    if not resolved.is_relative_to(root.resolve()) or not path.is_file():
        raise PackageError(f"Allowlisted file missing or outside project: {relative}")
    safe_relative(resolved.relative_to(root.resolve()).as_posix(), allow_data=allow_data)
    for part in [path, *path.parents]:
        if part == root:
            break
        if part.is_symlink() or getattr(part, "is_junction", lambda: False)():
            raise PackageError(f"Links are forbidden in publication input: {relative}")
    return path


def screen_text(relative: str, data: bytes) -> None:
    try:
        content = data.decode("utf-8-sig")
    except UnicodeDecodeError:
        # Historical SAS exports/code can use Windows-1252. Never rewrite CSV bytes.
        content = data.decode("cp1252")
    if LOCAL_PATH.search(content):
        raise PackageError(f"Local path detected in {relative}; replace it explicitly with a placeholder")
    if SECRET.search(content):
        raise PackageError(f"Possible credential detected in {relative}")
    if b"\x00" in data:
        raise PackageError(f"Unexpected binary content in {relative}")


def approval_reference(value: object) -> bool:
    return isinstance(value, str) and bool(value.strip())


def validate_configuration(config: dict) -> None:
    if config.get("schema_version") != 1:
        raise PackageError("Unsupported allowlist schema")
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]*", config.get("repository_name", "")):
        raise PackageError("Invalid repository name")
    if set(config.get("release_gates", {})) != GATES:
        raise PackageError("All named release gates must be retained")
    files = config.get("source_files", [])
    if not files or len(set(p.lower() for p in files)) != len(files):
        raise PackageError("Source allowlist must be nonempty with no duplicate destinations")
    for relative in files:
        safe_relative(relative)
    candidates = config.get("data_candidates", [])
    names = [entry.get("source", "") for entry in candidates]
    if len(set(n.lower() for n in names)) != len(names):
        raise PackageError("Duplicate data candidates")
    for entry in candidates:
        safe_relative(entry["source"], allow_data=True)
        if entry.get("action") not in ("pending", "include", "exclude"):
            raise PackageError("Data action must be pending, include or exclude")
    for change in config.get("replacements", []):
        if change.get("source") not in files or not change.get("old"):
            raise PackageError("Explicit replacements require a listed source and nonempty original")
        if change["source"].startswith("public/data/"):
            raise PackageError("CSV values cannot be transformed by the package builder")
        if not re.fullmatch(r"<[A-Z][A-Z0-9_]*>", change.get("placeholder", "")):
            raise PackageError("Internal paths may only be replaced with named placeholders")


def source_drift(root: Path, config: dict) -> list[str]:
    intended = set(config["source_files"])
    return sorted(p.relative_to(root).as_posix() for p in (root / "src").rglob("*")
                  if p.is_file() and p.suffix in (".ts", ".tsx", ".css")
                  and p.relative_to(root).as_posix() not in intended)


def reviewed_input_digest(config: dict, source_hashes: dict[str, str]) -> str:
    # Approval text can be completed after reviewing this fingerprint; all effective
    # inclusion choices, transformations, input bytes and builder code remain bound.
    material_config = {key: value for key, value in config.items()
                       if key not in ("release_gates", "reviewed_inputs_sha256")}
    return digest(encoded_json({"configuration": material_config, "input_hashes": source_hashes,
                                "builder_sha256": digest(Path(__file__).read_bytes())}))


def release_blockers(config: dict, inventory: list[dict], drift: list[str]) -> list[str]:
    failures = []
    for name, gate in sorted(config["release_gates"].items()):
        if gate.get("status") != "approved" or not approval_reference(gate.get("review_reference")):
            failures.append(f"Release gate awaiting documented review: {name}")
    included = 0
    for entry in inventory:
        if entry["action"] == "pending" or not approval_reference(entry.get("review_reference")):
            failures.append(f"CSV disposition awaiting documented review: {entry['source']}")
        if entry["action"] == "include":
            included += 1
            if entry.get("approved_sha256") != entry["sha256"]:
                failures.append(f"Approved CSV hash missing or changed: {entry['source']}")
    if not included:
        failures.append("No reviewed CSV result release has been selected")
    if drift:
        failures.append("Application source files exist outside the explicit allowlist")
    return failures


VERIFY_JS = r"""// Generated package-integrity check. Review records are attestations, not proof of scientific validity.
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, lstatSync } from 'node:fs'
import { dirname, resolve, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const fail = message => { console.error(message); process.exit(1) }
const manifest = JSON.parse(readFileSync(resolve(root, 'publication-manifest.json'), 'utf8'))
if (manifest.format !== 'transfusion-publication-package-v1' || manifest.status !== 'reviewed_release') {
  fail('Publication blocked: this is a private data-free preview. Complete release review and rebuild the package.')
}
const gates = ['producing_code_alignment', 'full_cohort_provenance', 'model_and_uncertainty_consistency', 'export_disclosure_review', 'scientific_text_review', 'browser_and_performance_validation', 'data_license_and_release_review']
if (!gates.every(name => manifest.release_gates[name]?.status === 'approved' && manifest.release_gates[name]?.review_reference?.trim())) fail('Publication blocked: release review is incomplete.')
if (!/^[a-f0-9]{64}$/.test(manifest.reviewed_inputs_sha256 || '')) fail('Publication blocked: no reviewed package-input fingerprint.')
const expected = new Map(manifest.files.map(entry => [entry.path, entry.sha256]))
if (![...expected.keys()].some(name => name.startsWith('public/data/') && name.endsWith('.csv'))) fail('Publication blocked: no approved result data.')
const ignoreRoot = new Set(['.git', 'node_modules', 'dist', 'coverage'])
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = resolve(directory, entry.name)
    const name = relative(root, full).split(sep).join('/')
    if (directory === root && ignoreRoot.has(entry.name)) continue
    if (lstatSync(full).isSymbolicLink()) fail('Publication blocked: linked file or directory detected.')
    if (entry.isDirectory()) { walk(full); continue }
    if (name === 'publication-manifest.json') continue
    if (!expected.has(name)) fail(`Publication blocked: unexpected file ${name}`)
    const hash = createHash('sha256').update(readFileSync(full)).digest('hex')
    if (hash !== expected.get(name)) fail(`Publication blocked: changed file ${name}`)
    expected.delete(name)
  }
}
walk(root)
if (expected.size) fail('Publication blocked: approved files are missing.')
console.log('Reviewed release bytes match the publication manifest.')
"""


def generated_files(config: dict, *, release: bool) -> dict[str, bytes]:
    name = config["repository_name"]
    state = ("Reviewed result release. See publication-manifest.json for file hashes and review records."
             if release else "PRIVATE PREVIEW - NOT A PUBLICATION RELEASE. Result CSVs are intentionally absent. Publication builds and deployment are blocked.")
    readme = f"""# ICU transfusion dashboard

{state}

## Build and test

Install the Node version used in `.github/workflows/ci.yml`, then run `npm ci`.
`npm run ci` validates a reviewed release, runs checks and builds `dist/`.
For source-only development before results are approved, use `npm run ci:preview`
and `npm run dev`. A preview does not contain result data and cannot demonstrate
that the clinical displays work. `npm run build:preview` is for local review only.

## Result files and analysis code

Approved SAS result CSVs belong in `public/data/`. No participant-level SAS input
datasets are distributed. The site displays precomputed results; it does not fit
statistical models. Result files must retain the reviewed release's exact bytes.

SAS scripts are in `sas_code_public/`. Replace `<SOURCE_DATA_PATH>` and
`<PROJECT_ROOT>` in a private working copy with your authorised local directories.
Never commit those paths or the input datasets. A SAS licence and access to the
underlying data are separate requirements; the data are not obtained from this repository.
The default input selection in the candidate scripts is a development sample;
full-cohort provenance must be verified explicitly before approving a release.

Current candidate scripts and legacy result files have not yet been established
as a complete reproduction pair. A data-free preview must not be described as
reproducing the published analyses. Release approval requires this issue to be resolved.

## Deployment and maintenance

The target repository is `{name}`. GitHub Pages uses `/{name}/`.
Deployment is manual and requires the publication-manifest checks and full CI.
This package contains no imported Git history. The previous public repository,
its deployments and copies require a separate retirement or cleanup decision.

Software licence: see `LICENSE`. Result-data licensing must be recorded in the
release review before data are included. Keep source data and local environment
files outside the repository. Changes to an approved file invalidate its recorded
hash and require a newly reviewed manifest before deployment.
"""
    if release:
        readme = readme.replace("Current candidate scripts and legacy result files have not yet been established\nas a complete reproduction pair. A data-free preview must not be described as\nreproducing the published analyses. Release approval requires this issue to be resolved.", "Producing-code alignment and full-cohort provenance were reviewed for this release;\nsee the release records in `publication-manifest.json`.")
    ignore = """node_modules/
dist/
coverage/
.env
.env.*
!.env.example
*.tsbuildinfo
*.log
*.lst
*.sas7bdat
*.sas7bndx
*.sas7bcat
*.sas7bvew
*.sas7bitm
*.sashdat
*.xpt
__pycache__/
*.py[cod]
"""
    ci = """name: Source validation
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: npm
      - run: npm ci
      - run: npm run ci:preview
"""
    deploy = """name: Publish reviewed release
on:
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: npm
      - run: node scripts/verify-publication-release.mjs
      - run: npm ci
      - run: npm run ci
        env:
          VITE_BASE_PATH: /REPOSITORY_NAME/
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
""".replace("REPOSITORY_NAME", name)
    return {"README.md": readme.encode(), ".gitignore": ignore.encode(),
            ".env.example": f"VITE_BASE_PATH=/{name}/\n".encode(),
            ".github/workflows/ci.yml": ci.encode(), ".github/workflows/deploy.yml": deploy.encode(),
            "scripts/verify-publication-release.mjs": VERIFY_JS.encode()}


def check_destination(root: Path, destination: Path, expected: set[str]) -> None:
    resolved = destination.resolve()
    stage_root = (root / "manuscript/review_audit/publication_stage").resolve()
    if not resolved.is_relative_to(stage_root) or resolved == stage_root:
        raise PackageError("Staging must stay inside the private publication_stage directory")
    # Reject symlinks/junctions even if their resolved target currently lies inside stage_root.
    for part in [destination, *destination.parents]:
        if part == root:
            break
        if part.is_symlink() or getattr(part, "is_junction", lambda: False)():
            raise PackageError("Linked staging paths are forbidden")
    if destination.exists():
        current = destination / MANIFEST
        if not current.is_file() or json.loads(current.read_text(encoding="utf-8")).get("format") != FORMAT:
            raise PackageError("Refusing to overwrite a directory not created by this builder")
        old_manifest = json.loads(current.read_text(encoding="utf-8"))
        old_hashes = {entry["path"]: entry["sha256"] for entry in old_manifest["files"]}
        for path in destination.rglob("*"):
            if path.is_symlink() or getattr(path, "is_junction", lambda: False)():
                raise PackageError("Linked staging content is forbidden")
            if path.is_file():
                relative = path.relative_to(destination).as_posix()
                if relative not in expected:
                    raise PackageError("Unexpected staging file; use a new empty staging destination")
                if relative != MANIFEST and digest(path.read_bytes()) != old_hashes.get(relative):
                    raise PackageError("Staged file changed since assembly; preserve it and use a new destination")


def build_package(root: Path, config: dict, destination: Path, *, release: bool = False) -> dict:
    root = root.resolve()
    validate_configuration(config)
    files: dict[str, bytes] = {}
    source_hashes: dict[str, str] = {}
    transformations = []
    for relative in sorted(config["source_files"]):
        content = checked_source(root, relative).read_bytes()
        source_hashes[relative] = digest(content)
        for change in config.get("replacements", []):
            if change["source"] == relative:
                original = change["old"].encode("utf-8")
                count = content.count(original)
                if count != change.get("expected_occurrences"):
                    raise PackageError(f"Explicit replacement count changed: {relative}")
                content = content.replace(original, change["placeholder"].encode())
                transformations.append({"path": relative, "kind": "local_path_placeholder", "placeholder": change["placeholder"], "occurrences": count})
        if relative == ".gitattributes":
            # Preserve reviewed bytes through Git on Windows and Linux, including
            # legacy CSV encodings and line endings. No scientific data are rewritten.
            content = b"# Preserve release bytes across operating systems.\n* -text\n"
            transformations.append({"path": relative, "kind": "preserve_exact_release_bytes"})
        if relative == "package.json":
            package = json.loads(content)
            retained = set(config["staged_npm_scripts"])
            removed = sorted(set(package["scripts"]) - retained)
            package["scripts"] = {k: v for k, v in package["scripts"].items() if k in retained}
            package["scripts"]["build:preview"] = package["scripts"]["build"]
            package["scripts"]["build"] = "node scripts/verify-publication-release.mjs && " + package["scripts"]["build"]
            package["scripts"]["ci:preview"] = "npm run lint && npm run typecheck && npm run test:run && npm run build:preview"
            content = encoded_json(package)
            transformations.append({"path": relative, "kind": "publication_commands", "removed_scripts": removed})
        screen_text(relative, content)
        files[relative] = content
    inventory = []
    for entry in sorted(config["data_candidates"], key=lambda item: item["source"]):
        relative = entry["source"]
        content = checked_source(root, relative, allow_data=True).read_bytes()
        actual_hash = digest(content)
        source_hashes[relative] = actual_hash
        inventory.append({"source": relative, "bytes": len(content), "sha256": actual_hash,
                          "approved_sha256": entry.get("sha256"), "action": entry["action"],
                          "role": entry.get("role"), "review_reference": entry.get("review_reference")})
        if release and entry["action"] == "include":
            screen_text(relative, content)
            files[relative] = content
    inventoried = {entry["source"] for entry in inventory}
    unlisted_csv = sorted(p.relative_to(root).as_posix() for p in (root / "public/data").glob("*.csv") if p.relative_to(root).as_posix() not in inventoried)
    drift = source_drift(root, config)
    blockers = release_blockers(config, inventory, drift)
    review_digest = reviewed_input_digest(config, source_hashes)
    if config.get("reviewed_inputs_sha256") != review_digest:
        blockers.append("Input fingerprint missing or changed since package review")
    if unlisted_csv:
        blockers.append("Uninventoried CSV files exist; record their disposition explicitly")
    if release and blockers:
        raise PackageError("Release refused: " + "; ".join(blockers))
    for relative, content in generated_files(config, release=release).items():
        if relative in files:
            raise PackageError(f"Generated destination collision: {relative}")
        # The verifier itself contains example syntax for path checks; all generated files
        # are controlled literals, while interpolated review fields are screened below.
        files[relative] = content
    manifest = {"format": FORMAT, "repository_name": config["repository_name"],
                "status": "reviewed_release" if release else "private_preview_no_data",
                "release_gates": config["release_gates"],
                "reviewed_inputs_sha256": review_digest if release else None,
                "result_files": [{"path": item["source"], "sha256": item["sha256"], "role": item["role"], "review_reference": item["review_reference"]} for item in inventory if release and item["action"] == "include"],
                "scientific_provenance": "reviewed" if release else "Current SAS candidates are not a verified reproduction pair for legacy CSVs.",
                "files": [{"path": path, "bytes": len(content), "sha256": digest(content)} for path, content in sorted(files.items())],
                "transformations": transformations}
    files[MANIFEST] = encoded_json(manifest)
    screen_text(MANIFEST, files[MANIFEST])
    check_destination(root, destination, set(files))
    # A concurrent edit must not silently produce a mixed source snapshot.
    for relative, expected in source_hashes.items():
        if digest(checked_source(root, relative, allow_data=relative in inventoried).read_bytes()) != expected:
            raise PackageError(f"Input changed during assembly; retry after edits finish: {relative}")
    destination.mkdir(parents=True, exist_ok=True)
    for relative, content in sorted(files.items()):
        target = destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)
    return {"format": FORMAT, "mode": manifest["status"], "destination": destination.relative_to(root).as_posix(),
            "staged_file_count": len(files), "staged_csv_count": sum(p.startswith("public/data/") and p.endswith(".csv") for p in files),
            "staged_files": manifest["files"], "manifest_sha256": digest(files[MANIFEST]),
            "source_hashes": source_hashes, "data_candidates": inventory,
            "candidate_reviewed_inputs_sha256": review_digest,
            "release_blockers": blockers, "unlisted_application_sources": drift, "uninventoried_csvs": unlisted_csv,
            "transformations": transformations,
            "exclusions": ["Git history and repository internals", "source/sample SAS datasets and logs", "private environment files and runners", "manuscript files, review comments and figure tools", "agent memory and historical documentation", "all unapproved CSV exports", "node_modules and prebuilt dist", "alternative-host configs and unused legacy material"],
            "limits": ["Text/path and file-type screens cannot certify disclosure safety or statistical correctness.", "Review gates require an actual documented scientific decision; setting a status is not evidence.", "This creates no Git repository or remote and does not remove the old public history or deployments.", "Preview source builds do not validate result displays because no result CSVs are staged."]}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--allowlist", default="scripts/publication_allowlist.json")
    parser.add_argument("--destination", default=DEFAULT_DEST)
    parser.add_argument("--release", action="store_true", help="Require every scientific/export gate and exact reviewed CSV hashes")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    try:
        config = json.loads((root / args.allowlist).read_text(encoding="utf-8"))
        report = build_package(root, config, root / args.destination, release=args.release)
        report_path = root / "manuscript/review_audit/publication_package_report.json"
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_bytes(encoded_json(report))
    except (PackageError, OSError, UnicodeError, json.JSONDecodeError) as error:
        print(str(error), file=sys.stderr)
        return 2
    print(json.dumps({"mode": report["mode"], "files": report["staged_file_count"], "csv_files": report["staged_csv_count"], "release_blockers": len(report["release_blockers"]), "report": "manuscript/review_audit/publication_package_report.json"}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
