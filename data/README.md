# OpenChartMS data pipeline

This directory holds the material property corpus and supporting metadata.

## Files

| Path | Purpose |
|---|---|
| `schema.json` | JSON Schema (Draft 2020-12) for material records |
| `families.json` | Family list + color palette for chart layers |
| `indices.json` | Catalog of standard material indices (Ashby Appendix C) |
| `materials/*.json` | One JSON record per material (56 in Phase 1) |
| `materials.json` | Combined index of all materials, read by the web app |
| `SCHEMA.md` | Human-readable property dictionary + units |

## Pipeline

The seed corpus is generated from inline Python data in `scripts/build_materials.py`.
That script is the historical source-of-truth for Phase 1; after Phase 1 the canonical
data lives in `data/materials/*.json` and can be edited directly via PR.

```bash
# regenerate the corpus
python3 scripts/build_materials.py

# validate every material against schema.json + families.json
python3 scripts/validate.py     # requires: pip install jsonschema
```

The validator enforces:
- Every record matches `schema.json` (Draft 2020-12)
- `id` matches the filename stem
- `family` is one of the values in `families.json`
- For every property range, `min <= max`, both finite

## Coverage (Phase 1: 56 materials)

| Family | Count |
|---|---|
| Metals (ferrous + nonferrous) | 15 |
| Polymers (thermoplastics + thermosets) | 15 |
| Elastomers | 5 |
| Technical ceramics | 5 |
| Foams | 4 |
| Natural materials | 4 |
| Glasses | 3 |
| Non-technical ceramics | 3 |
| Composites | 2 |
| **Total** | **56** |

## Data source

All Phase 1 values come from:

> Ashby, M.F. (2025). *Materials Selection in Mechanical Design*, 6th edition.
> Butterworth-Heinemann / Elsevier. Appendix A, Tables A.1 – A.12.

Each property entry carries the citation in its `source` field. Tables A.11 (embodied
energy / carbon / water) and A.12 (recycle fraction / energy / carbon) report single
representative values rather than ranges; for those properties `min == max`.

## Adding a new material

1. Create `data/materials/<kebab-case-id>.json` matching `schema.json`.
2. Run `python3 scripts/validate.py`.
3. Run the build script to refresh `data/materials.json`.
4. Open a PR; CI runs the validator on every push.

## Property coverage notes

- **Loss coefficient (η)** is not yet populated. Source values must be read off
  Fig 3.9 in the textbook since they are not tabulated in Appendix A. Deferred.
- **Electrical resistivity** for insulators (ceramics, polymers) is omitted in
  Phase 1 because Table A.7 reports them in scientific notation across many
  orders of magnitude that is awkward to range-encode cleanly. Metals only.
- **Tm vs Tg.** The book's Table A.5 conflates melting temperature and glass
  temperature under one column. We split them: `melting_point_C` for materials
  with a true melting transition (metals, ceramics, semicrystalline polymers
  with Tm in the table) and `glass_temperature_C` for elastomers and
  amorphous polymers/thermosets. Pick by physics, not by sign.
