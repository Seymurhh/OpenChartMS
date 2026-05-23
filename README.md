# OpenChartMS

> Open-source, browser-based Ashby material-selection charts for teaching.
> A free alternative to Ansys Granta EduPack, built for Harvard's ES 192 and any course that teaches Mike Ashby's material-selection method.

> **Attribution.** OpenChartMS uses the methodology, indices catalogue, and reference property ranges from M.F. Ashby, *Materials Selection in Mechanical Design* (6th ed., Butterworth-Heinemann / Elsevier, 2025). The textbook's preface explicitly authorizes reproduction of charts for teaching with attribution; see [docs/DATA_SOURCES.md](./docs/DATA_SOURCES.md) for full provenance. **If you use this in a class or paper, please cite both OpenChartMS and the Ashby textbook** — see [CITATION.cff](./CITATION.cff).

## Capabilities

| Tab | Book chapter | Method |
|---|---|---|
| **Material charts** | Ch. 3–5 | Single-objective screen + index ranking. 10 canonical Ashby charts, property limit sliders, draggable index cutoff, custom-index editor (`M = y^a / x^b`), lasso/box selection. |
| **Trade-off** | Ch. 9.3 | Pareto front + penalty function `Z = X + α·Y` for **conflicting objectives**. Exchange-constant slider, iso-Z contours, optimum identification, baseline-material quadrants (Fig 9.9). |
| **Multi-constraint** | Ch. 9.2 | Coupling chart `I₁` vs `I₂` + slope-1 coupling line at Cc for **multiple constraints, one objective**. Min-max metric `m̃ = max(I₁, I₂/Cc)`, active-constraint indicator per material. |
| **Hybrid synth** | Ch. 13 | Voigt/Reuss composite bounds, Gibson-Ashby foam scaling, sandwich-panel locus on E vs ρ. |
| **Process** | Ch. 7 | Process attribute matrix screening + per-part cost-vs-batch curves (`C = m·Cm + C_tool/n + C_capital·t_cycle/(n·η)`). |
| **Eco-Audit** | Ch. 15 | Bill-of-materials lifecycle (materials + use + EoL credit). Energy/CO₂ metric toggle, recycle-credit calculation. |

## Data

**159 materials × up to 22 properties**, built in three phases:

| Phase | Materials | Source |
|---|---|---|
| 0 — original corpus | 56 | Ashby App A, Tables A.1–A.12 (6th ed., 2025) |
| 1 — specific alloy grades | +35 | ASM Handbooks Vol. 1 &amp; 2, manufacturer datasheets |
| 2 — gap-filling materials | +39 | ASM EH Vol. 4, CRC Handbook, Bath ICE v3.0, Cambridge Materials Data Book |
| 3 — Materials Project API | +29 | DFT density &amp; elasticity via Materials Project (CC BY 4.0) |

Every property value carries a per-cell `source` citation in the JSON.
Applications descriptions are paraphrased (not quoted) from Ashby Table A.1.
See [data/README.md](./data/README.md) for the schema and
[docs/DATA_SOURCES.md](./docs/DATA_SOURCES.md) for full provenance and
licensing rationale.

## Run locally

```bash
git clone https://github.com/Seymurhh/OpenChartMS
cd OpenChartMS

# data pipeline (Python)
python3 scripts/build_materials.py   # emits data/materials/*.json
python3 scripts/validate.py          # validates against schema (requires jsonschema)

# web app (Node)
npm install
npm run dev                          # http://localhost:5173
npm run build                        # production bundle in dist/
```

## Deploy to GitHub Pages

This repo ships with two GitHub Actions workflows:

- [`.github/workflows/ci.yml`](.github/workflows/ci.yml) — on every PR + push to main: rebuilds the corpus from `build_materials.py`, runs the schema validator, and runs `npm run build`.
- [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) — on every push to `main`: builds and publishes `dist/` to GitHub Pages.

**One-time setup after first push:**

1. Push the repo to GitHub.
2. In repo Settings → **Pages** → set Source to **"GitHub Actions"**.
3. Next push to `main` triggers deploy; the URL appears as the workflow's deployment output (typically `https://<your-user>.github.io/OpenChartMS/`).

`vite.config.ts` uses `base: './'`, so the build is path-agnostic.

## Tech stack

Vite + React 18 + TypeScript + Plotly.js. Data is a static JSON corpus alias-imported via `@data/*`. No backend.

## Citation and licensing

- **Software code:** MIT — see [LICENSE](./LICENSE).
- **Bundled material corpus:** reproducible under the Ashby textbook's express teaching-use permission (book preface, p. xiv). Cite Ashby (6e, 2025) when using the data. See [docs/DATA_SOURCES.md](./docs/DATA_SOURCES.md).
- **Citation file:** [CITATION.cff](./CITATION.cff).

## Disclaimers

**Educational use only — non-commercial.** OpenChartMS is developed for
Harvard ES 192 (Materials Selection and Failure Analysis) and is intended
solely for teaching and non-commercial academic use.

Property values are for instructional purposes only and are **not** suitable
for safety-critical engineering decisions. For production work use MMPDS,
ASM Handbook, NIST WebBook, or manufacturer data sheets.

This is an independent academic project. "Granta", "EduPack", and Ansys logos
are trademarks of Ansys, Inc. and are not used by this project. OpenChartMS
is not affiliated with or endorsed by Ansys, Elsevier, Cambridge University,
or the Materials Project.
