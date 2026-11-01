"""Synthetic-only tests; never opens the project's actual handoff or results."""

from __future__ import annotations

from contextlib import redirect_stdout
import hashlib
import io
import json
import os
from pathlib import Path
from types import SimpleNamespace
import tempfile
import unittest
from unittest.mock import patch

import inspect_analysis_handoff as inspector


def encoded(obj: dict) -> bytes:
    return json.dumps(obj, ensure_ascii=False, allow_nan=False, indent=2).encode("utf-8")


class HandoffInspectionTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory(prefix="synthetic-handoff-test-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.manifest = {
            "Protocol": inspector.MANIFEST_PROTOCOL,
            "CheckpointVersion": inspector.CHECKPOINT_VERSION,
            "State": "DRAFT_CURRENT_SAMPLE_INCOMPLETE",
            "RootDraftScopeAccepted": True,
            "RootAccepted": False,
            "FinalSampleCheckpointAccepted": False,
            "FullRunReady": False,
            "FullExecutionAuthorized": False,
            "PublicationAuthorized": False,
            "CurrentSampleBinding": {
                "CohortMode": "development_sample", "State": "INCOMPLETE_AT_SCAFFOLD",
                "CountsAreFinal": False, "CodeHash": "a" * 64, "ConfigHash": "b" * 64,
                "InputSnapshotId": "c" * 64, "BindingDigest": "d" * 64,
            },
            "Files": [],
            "ReadOrder": list(inspector.DOCUMENT_PROTOCOLS),
            "PendingPortableDeliverables": [
                {"Role": role, "Target": target, "Present": False}
                for role, target in inspector.PENDING_TARGETS.items()
            ],
        }
        self.docs = {}
        for name, protocol in inspector.DOCUMENT_PROTOCOLS.items():
            doc = {"Protocol": protocol, "Synthetic": True}
            if name in inspector.DRAFT_STATES:
                key, value = inspector.DRAFT_STATES[name]
                doc[key] = value
            self.docs[name] = doc
        self.docs["checkpoint_acceptance.json"].update({
            "CheckpointVersion": inspector.CHECKPOINT_VERSION,
            "State": "SCAFFOLD_CURRENT_SAMPLE_INCOMPLETE",
            "RootAccepted": False, "FullRunReady": False, "FullExecutionAuthorized": False,
            "ScientificPublicationAuthorized": False, "AutomaticallyPublish": False,
            "AutomaticallyPush": False,
            "FinalCounts": {
                "RequiredModels": 252, "RequiredReports": 4,
                "ValidatedModels": None, "PreFitUnavailableModels": None,
                "WholeFamilyInferenceUnavailableModels": None, "FailedModels": None,
                "UnselectedModels": None, "ValidatedReports": None,
            },
            "FinalCollectionManifestSHA256": None, "FinalLegacyComparisonSHA256": None,
            "FinalPortableCodeManifestSHA256": None, "FinalSchemaFreezeSHA256": None,
        })
        self.docs["output_schemas.provisional.json"].update({
            "SourceCodeHash": "a" * 64, "SchemaCoverage": {"FinalSchemaFrozen": False},
        })
        self.docs["consumer_rules.provisional.json"].update({
            "SourceCodeHash": "a" * 64, "FullRunReady": False,
            "FullExecutionAuthorized": False, "ScientificApproval": "NOT_GRANTED_BY_THIS_HANDOFF",
        })
        self.docs["DRAFT_REVIEW.json"].update({
            "CurrentSampleComplete": False, "FinalSchemaFrozen": False,
            "FullRunReady": False, "RootAccepted": False, "CodeExportComplete": False,
            "FinalSampleCheckpointAccepted": False,
        })
        for name in inspector.DOCUMENT_PROTOCOLS:
            raw = "SYNTHETIC DOCUMENTATION ONLY — Lucas D. Ekström\n".encode("utf-8") if name == "HANDOFF.txt" else encoded(self.docs[name])
            (self.root / name).write_bytes(raw)
            self.manifest["Files"].append({
                "Path": name, "SHA256": hashlib.sha256(raw).hexdigest(),
                "Bytes": len(raw), "Role": "DATA_FREE_DRAFT",
            })
        self.write_manifest()

    def write_manifest(self) -> None:
        (self.root / inspector.MANIFEST_NAME).write_bytes(encoded(self.manifest))

    def replace_document(self, name: str, raw: bytes | None = None) -> None:
        raw = encoded(self.docs[name]) if raw is None else raw
        (self.root / name).write_bytes(raw)
        entry = next(item for item in self.manifest["Files"] if item["Path"] == name)
        entry.update(SHA256=hashlib.sha256(raw).hexdigest(), Bytes=len(raw))
        self.write_manifest()

    def assert_rejected(self, code: str) -> None:
        with self.assertRaises(inspector.InventoryError) as caught:
            inspector.inspect_directory(self.root)
        self.assertEqual(caught.exception.code, code)

    def test_consistent_draft_is_only_inventory_success(self) -> None:
        report = inspector.inspect_directory(self.root)
        self.assertEqual(report["InventoryStatus"], "INTERNALLY_CONSISTENT")
        self.assertEqual(report["DeclaredDocumentsVerified"], 10)
        self.assertEqual(report["ProducerClaims"]["RootDraftScopeAccepted"], True)
        self.assertFalse(report["ProducerClaims"]["RootAccepted"])
        self.assertTrue(all(value is False for value in report["InspectorConclusions"].values()))
        self.assertEqual(len(report["PendingPrerequisites"]), 7)
        self.assertNotIn(str(self.root), json.dumps(report))

    def test_reads_only_allowed_documents_and_never_pending_targets(self) -> None:
        with patch.object(inspector, "read_document", wraps=inspector.read_document) as reader:
            inspector.inspect_directory(self.root)
        opened_names = [call.args[1] for call in reader.call_args_list]
        self.assertEqual(set(opened_names), set(inspector.DOCUMENT_PROTOCOLS) | {inspector.MANIFEST_NAME})
        self.assertEqual(opened_names.count(inspector.MANIFEST_NAME), 2)
        self.assertTrue(all(not (self.root / target).exists() for target in inspector.PENDING_TARGETS.values()))

    def test_tampered_content_same_length_rejected(self) -> None:
        path = self.root / "HANDOFF.txt"
        raw = path.read_bytes()
        path.write_bytes(b"X" + raw[1:])
        self.assert_rejected("DOCUMENT_HASH_MISMATCH")

    def test_tampered_size_rejected(self) -> None:
        path = self.root / "HANDOFF.txt"
        path.write_bytes(path.read_bytes() + b"extra")
        self.assert_rejected("DOCUMENT_SIZE_MISMATCH")

    def test_unsafe_manifest_names_rejected_before_document_reads(self) -> None:
        original = self.manifest["Files"][0]["Path"]
        for unsafe in ("../source.sas7bdat", "source.sas7bdat", "results.csv", "folder/HANDOFF.txt",
                       "folder\\HANDOFF.txt", "C:\\private\\source.sas7bdat", "HANDOFF.txt:stream"):
            with self.subTest(name=unsafe):
                self.manifest["Files"][0]["Path"] = unsafe
                self.write_manifest()
                with patch.object(inspector, "read_document", wraps=inspector.read_document) as reader:
                    self.assert_rejected("DOCUMENT_NAME_NOT_ALLOWED")
                self.assertEqual([call.args[1] for call in reader.call_args_list], [inspector.MANIFEST_NAME])
        self.manifest["Files"][0]["Path"] = original

    def test_extra_data_named_entry_rejected_without_opening_any_file(self) -> None:
        (self.root / "invented_source.sas7bdat").write_bytes(b"synthetic sentinel, not a SAS file")
        with patch.object(inspector, "read_document", wraps=inspector.read_document) as reader:
            self.assert_rejected("UNEXPECTED_OR_MISSING_DIRECTORY_ENTRY")
        reader.assert_not_called()

    def test_missing_document_rejected(self) -> None:
        (self.root / "HANDOFF.txt").unlink()
        self.assert_rejected("UNEXPECTED_OR_MISSING_DIRECTORY_ENTRY")

    def test_duplicate_file_entry_rejected(self) -> None:
        self.manifest["Files"][1] = self.manifest["Files"][0].copy()
        self.write_manifest()
        self.assert_rejected("DUPLICATE_DOCUMENT_ENTRY")

    def test_duplicate_json_keys_in_root_rejected(self) -> None:
        raw = encoded(self.manifest)
        (self.root / inspector.MANIFEST_NAME).write_bytes(raw[:-1] + b',"Protocol":"duplicate"}')
        self.assert_rejected("DUPLICATE_JSON_KEY")

    def test_nested_duplicate_json_keys_rejected(self) -> None:
        name = "coauthor_request_trace.json"
        raw = ('{"Protocol":"' + inspector.DOCUMENT_PROTOCOLS[name] + '","nested":{"x":1,"x":2}}').encode()
        self.replace_document(name, raw)
        self.assert_rejected("DUPLICATE_JSON_KEY")

    def test_nonfinite_json_values_rejected(self) -> None:
        name = "coauthor_request_trace.json"
        for value in ("NaN", "Infinity", "-Infinity", "1e999"):
            with self.subTest(value=value):
                self.replace_document(name, ('{"nested":' + value + '}').encode())
                self.assert_rejected("NONFINITE_JSON_NUMBER")

    def test_invalid_utf8_text_and_json_rejected(self) -> None:
        for name in ("HANDOFF.txt", "coauthor_request_trace.json"):
            with self.subTest(name=name):
                original = (self.root / name).read_bytes()
                self.replace_document(name, b"\xff")
                self.assert_rejected("INVALID_UTF8")
                self.replace_document(name, original)

    def test_malformed_and_nonobject_json_rejected(self) -> None:
        name = "coauthor_request_trace.json"
        for raw, error in ((b"{} trailing", "INVALID_JSON"), (b"[]", "JSON_OBJECT_REQUIRED")):
            with self.subTest(raw=raw):
                self.replace_document(name, raw)
                self.assert_rejected(error)

    def test_boolean_is_not_a_byte_count(self) -> None:
        self.manifest["Files"][0]["Bytes"] = True
        self.write_manifest()
        self.assert_rejected("INVALID_DOCUMENT_BYTE_COUNT")

    def test_boolean_is_not_a_required_job_count(self) -> None:
        self.docs["checkpoint_acceptance.json"]["FinalCounts"]["RequiredReports"] = True
        self.replace_document("checkpoint_acceptance.json")
        self.assert_rejected("INVALID_REQUIRED_COUNT")

    def test_future_manifest_protocol_rejected(self) -> None:
        self.manifest["Protocol"] = "LAPTOP_HANDOFF_CHECKPOINT_MANIFEST_V2"
        self.write_manifest()
        self.assert_rejected("UNSUPPORTED_MANIFEST_PROTOCOL")

    def test_future_checkpoint_version_rejected(self) -> None:
        self.manifest["CheckpointVersion"] = "20990101_v1"
        self.write_manifest()
        self.assert_rejected("UNSUPPORTED_CHECKPOINT_VERSION")

    def test_future_typed_schema_protocol_rejected(self) -> None:
        self.docs["output_schemas.provisional.json"]["Protocol"] = "LAPTOP_OUTPUT_SCHEMAS_PROVISIONAL_V2"
        self.replace_document("output_schemas.provisional.json")
        self.assert_rejected("UNSUPPORTED_DOCUMENT_PROTOCOL")

    def test_checkpoint_version_mismatch_rejected(self) -> None:
        self.docs["checkpoint_acceptance.json"]["CheckpointVersion"] = "another_version"
        self.replace_document("checkpoint_acceptance.json")
        self.assert_rejected("CHECKPOINT_VERSION_MISMATCH")

    def test_code_hash_binding_mismatch_rejected(self) -> None:
        self.docs["consumer_rules.provisional.json"]["SourceCodeHash"] = "e" * 64
        self.replace_document("consumer_rules.provisional.json")
        self.assert_rejected("SOURCE_CODE_BINDING_MISMATCH")

    def test_accepted_or_final_claim_not_silently_approved(self) -> None:
        self.manifest["RootAccepted"] = True
        self.write_manifest()
        self.assert_rejected("UNSUPPORTED_READINESS_OR_APPROVAL_CLAIM")

    def test_frozen_schema_is_outside_draft_checker_scope(self) -> None:
        self.docs["output_schemas.provisional.json"]["SchemaCoverage"]["FinalSchemaFrozen"] = True
        self.replace_document("output_schemas.provisional.json")
        self.assert_rejected("FINAL_SCHEMA_NOT_SUPPORTED")

    def test_nonboolean_readiness_rejected(self) -> None:
        self.manifest["FullRunReady"] = 0
        self.write_manifest()
        self.assert_rejected("UNSUPPORTED_READINESS_OR_APPROVAL_CLAIM")

    def test_pending_target_traversal_rejected_without_following(self) -> None:
        self.manifest["PendingPortableDeliverables"][0]["Target"] = "../../not-opened"
        self.write_manifest()
        self.assert_rejected("PENDING_PREREQUISITES_MISMATCH")

    def test_simulated_reparse_document_refused_before_open(self) -> None:
        original = Path.lstat

        def lstat_with_reparse(path):
            info = original(path)
            if path.name == "HANDOFF.txt":
                return SimpleNamespace(st_mode=info.st_mode, st_file_attributes=inspector.REPARSE_ATTRIBUTE)
            return info

        with patch.object(Path, "lstat", lstat_with_reparse), patch.object(inspector, "open_no_follow", wraps=inspector.open_no_follow) as opener:
            self.assert_rejected("LINK_OR_REPARSE_REFUSED")
        self.assertNotIn("HANDOFF.txt", [call.args[0].name for call in opener.call_args_list])

    def test_simulated_reparse_directory_refused(self) -> None:
        original = Path.lstat

        def lstat_with_reparse(path):
            info = original(path)
            if path == self.root:
                return SimpleNamespace(st_mode=info.st_mode, st_file_attributes=inspector.REPARSE_ATTRIBUTE)
            return info

        with patch.object(Path, "lstat", lstat_with_reparse), patch.object(inspector, "read_document") as reader:
            self.assert_rejected("LINK_OR_REPARSE_REFUSED")
        reader.assert_not_called()

    def test_actual_symlink_refused_when_supported(self) -> None:
        # Target is also entirely invented. Some Windows hosts disallow symlinks;
        # the simulated reparse tests above still run on those hosts.
        target = self.root / "HANDOFF.txt"
        original = target.read_bytes()
        target.unlink()
        try:
            os.symlink(self.root / "coauthor_request_trace.json", target)
        except (OSError, NotImplementedError):
            target.write_bytes(original)
            self.skipTest("Host cannot create a test symlink; simulated reparse refusals are mandatory")
        self.assert_rejected("LINK_OR_REPARSE_REFUSED")

    def test_cli_success_has_no_private_path_or_approval(self) -> None:
        output = io.StringIO()
        with redirect_stdout(output):
            code = inspector.main([str(self.root)])
        self.assertEqual(code, 0)
        report = json.loads(output.getvalue())
        self.assertFalse(report["InspectorConclusions"]["ScientificOrDataPublicationApproved"])
        self.assertNotIn(str(self.root), output.getvalue())

    def test_cli_failure_redacts_os_error_details(self) -> None:
        output = io.StringIO()
        with patch.object(inspector, "inspect_directory", side_effect=OSError("private path and content sentinel")), redirect_stdout(output):
            code = inspector.main([str(self.root)])
        self.assertEqual(code, 2)
        self.assertEqual(json.loads(output.getvalue())["ErrorCode"], "FILESYSTEM_OR_INPUT_ERROR")
        self.assertNotIn("sentinel", output.getvalue())
        self.assertNotIn(str(self.root), output.getvalue())


if __name__ == "__main__":
    unittest.main()
