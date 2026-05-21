#!/usr/bin/env python3
"""Validate every data/materials/*.json file against data/schema.json.

Performs both JSON Schema validation and a semantic pass: each property range
must satisfy min <= max, both finite. Exits 0 on success, 1 on any failure.

Usage: python3 scripts/validate.py
"""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCHEMA_PATH = ROOT / "data" / "schema.json"
MATERIALS_DIR = ROOT / "data" / "materials"
FAMILIES_PATH = ROOT / "data" / "families.json"

try:
    import jsonschema
except ImportError:
    print("ERROR: jsonschema not installed. Run: pip install jsonschema", file=sys.stderr)
    sys.exit(2)


def load_json(path: Path) -> dict:
    with path.open() as f:
        return json.load(f)


def semantic_check(record: dict, path: Path) -> list[str]:
    errors: list[str] = []
    mid = record.get("id", "<no-id>")

    if path.stem != mid:
        errors.append(f"{path.name}: filename stem does not match id {mid!r}")

    for key, rng in record.get("properties", {}).items():
        lo, hi = rng["min"], rng["max"]
        if not (math.isfinite(lo) and math.isfinite(hi)):
            errors.append(f"{mid}.{key}: non-finite range {lo}..{hi}")
        if lo > hi:
            errors.append(f"{mid}.{key}: min ({lo}) > max ({hi})")
    return errors


def main() -> int:
    schema = load_json(SCHEMA_PATH)
    families_doc = load_json(FAMILIES_PATH)
    allowed_families = {f["id"] for f in families_doc["families"]}

    validator = jsonschema.Draft202012Validator(schema)

    files = sorted(MATERIALS_DIR.glob("*.json"))
    if not files:
        print(f"ERROR: no JSON files in {MATERIALS_DIR}", file=sys.stderr)
        return 1

    errors: list[str] = []
    ids: set[str] = set()

    for path in files:
        record = load_json(path)

        for err in validator.iter_errors(record):
            errors.append(f"{path.name}: schema: {err.message} at {list(err.absolute_path)}")

        errors.extend(semantic_check(record, path))

        fam = record.get("family")
        if fam not in allowed_families:
            errors.append(f"{path.name}: family {fam!r} not in families.json")

        rid = record.get("id")
        if rid in ids:
            errors.append(f"{path.name}: duplicate id {rid!r}")
        ids.add(rid)

    if errors:
        print(f"FAIL: {len(errors)} validation error(s) across {len(files)} files:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        return 1

    print(f"OK: validated {len(files)} materials against schema and family palette.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
