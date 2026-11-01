#!/usr/bin/env python3
"""Inspect the fixed 20261101_v1 handoff DOCUMENTATION inventory only.

Exit 0 means the supported draft's documentation is internally consistent. It
does NOT validate SAS, results, statistical methods, privacy, author decisions,
sample completion, full-run readiness, or permission to publish. No listed code,
CSV, result, evidence, pending deliverable or private input is ever opened.

This deliberately supports one draft, not a future acceptance/release format.
Run against an immutable copy: link checks and handle checks are safeguards, not
a sandbox against a process concurrently replacing ancestor directories.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import re
import stat
import sys
from typing import Any


CHECKER_PROTOCOL = "LAPTOP_DRAFT_INVENTORY_INSPECTION_V1"
CHECKPOINT_VERSION = "20261101_v1"
MANIFEST_NAME = "checkpoint_manifest.json"
MANIFEST_PROTOCOL = "LAPTOP_HANDOFF_CHECKPOINT_MANIFEST_V1"
MAX_DOCUMENT_BYTES = 2 * 1024 * 1024
MAX_MANIFEST_BYTES = 256 * 1024
DOCUMENT_PROTOCOLS = {
    "checkpoint_acceptance.json": "LAPTOP_SAMPLE_CHECKPOINT_ACCEPTANCE_V1",
    "coauthor_request_trace.json": "COAUTHOR_REQUEST_TRACE_PROVISIONAL_V1",
    "consumer_rules.provisional.json": "LAPTOP_CONSUMER_RULES_PROVISIONAL_V1",
    "DRAFT_REVIEW.json": "LAPTOP_HANDOFF_DRAFT_REVIEW_V1",
    "GENERIC_AUDIT_DISPOSITION.json": "SOURCE_FREE_GENERIC_HANDOFF_AUDIT_DISPOSITION_V1",
    "HANDOFF.txt": None,
    "integration_fixture_plan.json": "LAPTOP_INTEGRATION_FIXTURE_PLAN_V1",
    "legacy_artifact_mapping.json": "LEGACY_TO_REVISED_ARTIFACT_MAP_V1",
    "output_schemas.provisional.json": "LAPTOP_OUTPUT_SCHEMAS_PROVISIONAL_V1",
    "scientific_decisions.json": "LAPTOP_SCIENTIFIC_DECISIONS_V1",
}
PENDING_TARGETS = {
    "CURATED_VALIDATED_CODE": "code/",
    "CODE_FILE_MANIFEST_AND_SEMANTIC_DIFF": "code_manifest.json",
    "SANITIZED_CONFIGURATION_EXAMPLE": "examples/config.sanitized.json",
    "SYNTHETIC_INTEGRATION_FIXTURES": "examples/synthetic/",
    "FINAL_DATA_FREE_VALIDATION_SUMMARY": "validation/sample_acceptance.json",
    "FINAL_LEGACY_COMPARISON_SUMMARY": "validation/legacy_comparison.json",
    "REVIEWED_MODEL_AGGREGATE_EXPORT_ALLOWLIST": "exports/allowlist.json",
}
DRAFT_STATES = {
    "coauthor_request_trace.json": ("Status", "KNOWN_REPOSITORY_AUDIT_TRACE_NOT_ALL_COMMENTS_CLOSED"),
    "consumer_rules.provisional.json": ("Status", "DRAFT_CURRENT_SAMPLE_INCOMPLETE"),
    "integration_fixture_plan.json": ("Status", "PLAN_ONLY_FIXTURES_NOT_GENERATED_OR_APPROVED"),
    "legacy_artifact_mapping.json": ("Status", "DESIGN_MAP_NOT_COMPARISON_VERDICT"),
    "output_schemas.provisional.json": ("Status", "SOURCE_DERIVED_NOT_FINAL_COLLECTION_ACCEPTANCE"),
    "scientific_decisions.json": ("Status", "RECORDED_SCIENCE_WITH_IMPLEMENTATION_ACCEPTANCE_SEPARATE"),
}
HEX64 = re.compile(r"[0-9a-f]{64}\Z")
REPARSE_ATTRIBUTE = getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400)


class InventoryError(Exception):
    """A safe error code; never attach paths or document contents."""

    def __init__(self, code: str):
        super().__init__(code)
        self.code = code


def require(condition: bool, code: str) -> None:
    if not condition:
        raise InventoryError(code)


def is_link_or_reparse(info: os.stat_result) -> bool:
    return stat.S_ISLNK(info.st_mode) or bool(
        getattr(info, "st_file_attributes", 0) & REPARSE_ATTRIBUTE
    )


def check_path_components(path: Path, *, directory: bool = False) -> os.stat_result:
    # Do not use resolve(): it follows the very links this checker must refuse.
    parts = list(reversed(path.parents)) + [path]
    final_info = None
    for component in parts:
        try:
            info = component.lstat()
        except FileNotFoundError as exc:
            raise InventoryError("MISSING_DOCUMENT_OR_DIRECTORY") from exc
        require(not is_link_or_reparse(info), "LINK_OR_REPARSE_REFUSED")
        if component != path or directory:
            require(stat.S_ISDIR(info.st_mode), "EXPECTED_DIRECTORY")
        else:
            require(stat.S_ISREG(info.st_mode), "EXPECTED_REGULAR_DOCUMENT")
        final_info = info
    assert final_info is not None
    return final_info


def open_no_follow(path: Path) -> int:
    if os.name != "nt":
        # macOS/Linux expose O_NOFOLLOW. Refuse rather than silently weakening it.
        require(hasattr(os, "O_NOFOLLOW"), "NO_FOLLOW_UNSUPPORTED")
        return os.open(path, os.O_RDONLY | os.O_NOFOLLOW)

    # OPEN_REPARSE_POINT opens the link itself, allowing fstat to reject it before
    # reading. Intermediate directory components are checked separately.
    import ctypes
    from ctypes import wintypes
    import msvcrt

    kernel = ctypes.WinDLL("kernel32", use_last_error=True)
    create = kernel.CreateFileW
    create.argtypes = [wintypes.LPCWSTR, wintypes.DWORD, wintypes.DWORD,
                       ctypes.c_void_p, wintypes.DWORD, wintypes.DWORD,
                       wintypes.HANDLE]
    create.restype = wintypes.HANDLE
    close = kernel.CloseHandle
    close.argtypes = [wintypes.HANDLE]
    close.restype = wintypes.BOOL
    handle = create(str(path), 0x80000000, 0x1, None, 3, 0x00200000, None)
    if handle == ctypes.c_void_p(-1).value:
        raise OSError("DOCUMENT_OPEN_FAILED")
    try:
        return msvcrt.open_osfhandle(handle, os.O_RDONLY | os.O_BINARY)
    except BaseException:
        close(handle)
        raise


def file_identity(info: os.stat_result) -> tuple[int, int, int, int]:
    return info.st_dev, info.st_ino, info.st_size, info.st_mtime_ns


def read_document(root: Path, name: str, limit: int) -> bytes:
    require(name == MANIFEST_NAME or name in DOCUMENT_PROTOCOLS, "DOCUMENT_NAME_NOT_ALLOWED")
    path = root / name
    before = check_path_components(path)
    require(before.st_size <= limit, "DOCUMENT_TOO_LARGE")
    descriptor = open_no_follow(path)
    with os.fdopen(descriptor, "rb") as stream:
        opened = os.fstat(stream.fileno())
        require(not is_link_or_reparse(opened), "LINK_OR_REPARSE_REFUSED")
        require(stat.S_ISREG(opened.st_mode), "EXPECTED_REGULAR_DOCUMENT")
        require(file_identity(opened) == file_identity(before), "DOCUMENT_CHANGED_DURING_READ")
        content = stream.read(limit + 1)
        require(len(content) <= limit, "DOCUMENT_TOO_LARGE")
        require(file_identity(os.fstat(stream.fileno())) == file_identity(before),
                "DOCUMENT_CHANGED_DURING_READ")
    after = check_path_components(path)
    require(file_identity(after) == file_identity(before), "DOCUMENT_CHANGED_DURING_READ")
    return content


def reject_duplicate_keys(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result = {}
    for key, value in pairs:
        require(key not in result, "DUPLICATE_JSON_KEY")
        result[key] = value
    return result


def finite_float(token: str) -> float:
    value = float(token)
    require(math.isfinite(value), "NONFINITE_JSON_NUMBER")
    return value


def reject_constant(_token: str) -> None:
    raise InventoryError("NONFINITE_JSON_NUMBER")


def strict_text(content: bytes) -> str:
    try:
        return content.decode("utf-8", errors="strict")
    except UnicodeDecodeError as exc:
        raise InventoryError("INVALID_UTF8") from exc


def strict_json(content: bytes) -> dict[str, Any]:
    try:
        obj = json.loads(strict_text(content), object_pairs_hook=reject_duplicate_keys,
                         parse_constant=reject_constant, parse_float=finite_float)
    except (ValueError, RecursionError) as exc:
        raise InventoryError("INVALID_JSON") from exc
    require(type(obj) is dict, "JSON_OBJECT_REQUIRED")
    return obj


def require_digest(value: Any) -> None:
    require(type(value) is str and HEX64.fullmatch(value) is not None, "INVALID_SHA256")


def require_false(obj: dict[str, Any], fields: tuple[str, ...]) -> None:
    for field in fields:
        require(obj.get(field) is False, "UNSUPPORTED_READINESS_OR_APPROVAL_CLAIM")


def validate_manifest(manifest: dict[str, Any]) -> list[dict[str, Any]]:
    require(manifest.get("Protocol") == MANIFEST_PROTOCOL, "UNSUPPORTED_MANIFEST_PROTOCOL")
    require(manifest.get("CheckpointVersion") == CHECKPOINT_VERSION, "UNSUPPORTED_CHECKPOINT_VERSION")
    require(manifest.get("State") == "DRAFT_CURRENT_SAMPLE_INCOMPLETE", "UNSUPPORTED_CHECKPOINT_STATE")
    require_false(manifest, ("RootAccepted", "FinalSampleCheckpointAccepted", "FullRunReady",
                             "FullExecutionAuthorized", "PublicationAuthorized"))
    require(manifest.get("RootDraftScopeAccepted") is True, "DRAFT_SCOPE_METADATA_MISMATCH")
    entries = manifest.get("Files")
    require(type(entries) is list and len(entries) == len(DOCUMENT_PROTOCOLS), "DOCUMENT_COUNT_MISMATCH")
    seen = set()
    for entry in entries:
        require(type(entry) is dict, "INVALID_DOCUMENT_ENTRY")
        require(set(entry) == {"Path", "SHA256", "Bytes", "Role"}, "UNSUPPORTED_DOCUMENT_ENTRY_SCHEMA")
        name = entry["Path"]
        require(type(name) is str and name in DOCUMENT_PROTOCOLS, "DOCUMENT_NAME_NOT_ALLOWED")
        require(name not in seen, "DUPLICATE_DOCUMENT_ENTRY")
        seen.add(name)
        require_digest(entry["SHA256"])
        require(type(entry["Bytes"]) is int and 0 <= entry["Bytes"] <= MAX_DOCUMENT_BYTES,
                "INVALID_DOCUMENT_BYTE_COUNT")
        require(entry["Role"] == "DATA_FREE_DRAFT", "UNSUPPORTED_DOCUMENT_ROLE")
    require(seen == set(DOCUMENT_PROTOCOLS), "DOCUMENT_SET_MISMATCH")
    order = manifest.get("ReadOrder")
    require(type(order) is list and all(type(n) is str and n in DOCUMENT_PROTOCOLS for n in order),
            "INVALID_READ_ORDER")
    require(len(order) == len(set(order)), "DUPLICATE_READ_ORDER_ENTRY")

    pending = manifest.get("PendingPortableDeliverables")
    require(type(pending) is list and len(pending) == len(PENDING_TARGETS), "PENDING_PREREQUISITES_MISMATCH")
    roles = set()
    for item in pending:
        require(type(item) is dict and set(item) == {"Role", "Target", "Present"},
                "UNSUPPORTED_PENDING_ENTRY_SCHEMA")
        role = item["Role"]
        require(type(role) is str and role in PENDING_TARGETS and role not in roles,
                "PENDING_PREREQUISITES_MISMATCH")
        require(item["Target"] == PENDING_TARGETS[role] and item["Present"] is False,
                "PENDING_PREREQUISITES_MISMATCH")
        roles.add(role)
    # These targets are metadata only. Never stat, enumerate, or open them.
    binding = manifest.get("CurrentSampleBinding")
    require(type(binding) is dict, "INVALID_SAMPLE_BINDING")
    require(binding.get("CohortMode") == "development_sample" and binding.get("CountsAreFinal") is False,
            "UNSUPPORTED_SAMPLE_BINDING")
    require(binding.get("State") == "INCOMPLETE_AT_SCAFFOLD", "UNSUPPORTED_SAMPLE_BINDING")
    for key in ("CodeHash", "ConfigHash", "InputSnapshotId", "BindingDigest"):
        require_digest(binding.get(key))
    return entries


def validate_cross_document_metadata(manifest: dict[str, Any], docs: dict[str, Any]) -> None:
    for name, doc in docs.items():
        if name == "HANDOFF.txt":
            continue
        require(doc.get("Protocol") == DOCUMENT_PROTOCOLS[name], "UNSUPPORTED_DOCUMENT_PROTOCOL")
        if "CheckpointVersion" in doc:
            require(doc["CheckpointVersion"] == CHECKPOINT_VERSION, "CHECKPOINT_VERSION_MISMATCH")
        if name in DRAFT_STATES:
            field, value = DRAFT_STATES[name]
            require(doc.get(field) == value, "UNSUPPORTED_DOCUMENT_STATE")

    acceptance = docs["checkpoint_acceptance.json"]
    require(acceptance.get("CheckpointVersion") == CHECKPOINT_VERSION, "CHECKPOINT_VERSION_MISMATCH")
    require(acceptance.get("State") == "SCAFFOLD_CURRENT_SAMPLE_INCOMPLETE", "UNSUPPORTED_DOCUMENT_STATE")
    require_false(acceptance, ("RootAccepted", "FullRunReady", "FullExecutionAuthorized",
                              "ScientificPublicationAuthorized", "AutomaticallyPublish", "AutomaticallyPush"))
    counts = acceptance.get("FinalCounts")
    required = {"RequiredModels": 252, "RequiredReports": 4}
    pending_counts = {"ValidatedModels", "PreFitUnavailableModels", "WholeFamilyInferenceUnavailableModels",
                      "FailedModels", "UnselectedModels", "ValidatedReports"}
    require(type(counts) is dict and set(counts) == set(required) | pending_counts, "UNSUPPORTED_COUNT_SCHEMA")
    for key, value in required.items():
        require(type(counts[key]) is int and counts[key] == value, "INVALID_REQUIRED_COUNT")
    require(all(counts[key] is None for key in pending_counts), "FINAL_COUNTS_NOT_SUPPORTED_IN_DRAFT")
    for key in ("FinalCollectionManifestSHA256", "FinalLegacyComparisonSHA256",
                "FinalPortableCodeManifestSHA256", "FinalSchemaFreezeSHA256"):
        require(key in acceptance and acceptance[key] is None, "FINAL_ACCEPTANCE_NOT_SUPPORTED")

    schema = docs["output_schemas.provisional.json"]
    coverage = schema.get("SchemaCoverage")
    require(type(coverage) is dict and coverage.get("FinalSchemaFrozen") is False, "FINAL_SCHEMA_NOT_SUPPORTED")
    for name in ("output_schemas.provisional.json", "consumer_rules.provisional.json"):
        require(docs[name].get("SourceCodeHash") == manifest["CurrentSampleBinding"]["CodeHash"],
                "SOURCE_CODE_BINDING_MISMATCH")
    consumer = docs["consumer_rules.provisional.json"]
    require_false(consumer, ("FullRunReady", "FullExecutionAuthorized"))
    require(consumer.get("ScientificApproval") == "NOT_GRANTED_BY_THIS_HANDOFF",
            "UNSUPPORTED_READINESS_OR_APPROVAL_CLAIM")
    review = docs["DRAFT_REVIEW.json"]
    require_false(review, ("CurrentSampleComplete", "FinalSchemaFrozen", "FullRunReady",
                           "RootAccepted", "CodeExportComplete", "FinalSampleCheckpointAccepted"))


def inspect_directory(directory: str | os.PathLike[str]) -> dict[str, Any]:
    root = Path(os.path.abspath(directory))
    check_path_components(root, directory=True)
    expected = set(DOCUMENT_PROTOCOLS) | {MANIFEST_NAME}
    # Names only: reject unexpected entries without reading their contents.
    require(set(os.listdir(root)) == expected, "UNEXPECTED_OR_MISSING_DIRECTORY_ENTRY")
    manifest_bytes = read_document(root, MANIFEST_NAME, MAX_MANIFEST_BYTES)
    manifest = strict_json(manifest_bytes)
    entries = validate_manifest(manifest)
    docs = {}
    for entry in entries:
        raw = read_document(root, entry["Path"], MAX_DOCUMENT_BYTES)
        require(len(raw) == entry["Bytes"], "DOCUMENT_SIZE_MISMATCH")
        require(hashlib.sha256(raw).hexdigest() == entry["SHA256"], "DOCUMENT_HASH_MISMATCH")
        docs[entry["Path"]] = strict_text(raw) if entry["Path"] == "HANDOFF.txt" else strict_json(raw)
    validate_cross_document_metadata(manifest, docs)
    # Detect a normal concurrent replacement of the entry manifest as well.
    require(read_document(root, MANIFEST_NAME, MAX_MANIFEST_BYTES) == manifest_bytes,
            "MANIFEST_CHANGED_DURING_INSPECTION")
    return {
        "CheckerProtocol": CHECKER_PROTOCOL,
        "Scope": "DOCUMENTATION_INVENTORY_ONLY",
        "InventoryStatus": "INTERNALLY_CONSISTENT",
        "CheckpointVersion": CHECKPOINT_VERSION,
        "DeclaredDocumentsVerified": len(entries),
        "RootManifestSHA256": hashlib.sha256(manifest_bytes).hexdigest(),
        "ProducerClaims": {key: manifest[key] for key in (
            "State", "RootDraftScopeAccepted", "RootAccepted", "FinalSampleCheckpointAccepted",
            "FullRunReady", "FullExecutionAuthorized", "PublicationAuthorized")},
        "RequiredJobsFromDraft": {"Models": 252, "Reports": 4},
        "PendingPrerequisites": list(PENDING_TARGETS),
        "InspectorConclusions": {
            "AnalysisValidated": False,
            "ClinicalValidityValidated": False,
            "SourceOrOutputPrivacyCertified": False,
            "FullRunAuthorized": False,
            "ScientificOrDataPublicationApproved": False,
        },
        "ExitZeroMeaning": "Supported draft documentation is internally consistent only; no analysis, data or publication approval.",
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", help="Immutable 20261101_v1 documentation directory; no result bundle")
    args = parser.parse_args(argv)
    try:
        report = inspect_directory(args.directory)
    except InventoryError as exc:
        report = {"CheckerProtocol": CHECKER_PROTOCOL, "Scope": "DOCUMENTATION_INVENTORY_ONLY",
                  "InventoryStatus": "REJECTED", "ErrorCode": exc.code,
                  "ScientificOrDataPublicationApproved": False}
    except (OSError, ValueError) as exc:
        # OS messages may contain private absolute paths; intentionally omit them.
        report = {"CheckerProtocol": CHECKER_PROTOCOL, "Scope": "DOCUMENTATION_INVENTORY_ONLY",
                  "InventoryStatus": "REJECTED", "ErrorCode": "FILESYSTEM_OR_INPUT_ERROR",
                  "ScientificOrDataPublicationApproved": False}
    print(json.dumps(report, ensure_ascii=True, allow_nan=False, separators=(",", ":")))
    return 0 if report["InventoryStatus"] == "INTERNALLY_CONSISTENT" else 2


if __name__ == "__main__":
    sys.exit(main())
