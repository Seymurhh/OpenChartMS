# OpenChartMS — Build Plan

**Goal:** an open-source, browser-based Ashby chart tool that replaces Ansys Granta EduPack for undergraduate teaching of material selection (ES 192 and beyond).

**Scope confirmed with user 2026-05-20:**
- Deployment: static web app (Vite + React + TypeScript) → GitHub Pages
- Database: ~150 materials × ~25 properties, sourced from Ashby Appendix A + Cambridge Materials Data Book
- MVP includes: charts + selection + material indices + Eco-Audit module
- Hybrid Synthesizer deferred to Phase 4

---

## 1. What we are replicating

### Canonical Ashby charts (from textbook Ch. 3, "must-ship" set)
1. Modulus E vs Density ρ (Fig 3.3)
2. Strength σf vs Density ρ (Fig 3.4)
3. Modulus E vs Strength σf (Fig 3.5)
4. Specific modulus E/ρ vs specific strength σf/ρ (Fig 3.6)
5. Fracture toughness K_IC vs Modulus E (Fig 3.7)
6. Fracture toughness K_IC vs Strength σf (Fig 3.8)
7. Loss coefficient η vs Modulus E (Fig 3.9)
8. Thermal conductivity λ vs Thermal expansion α
9. Thermal conductivity λ vs Electrical resistivity ρₑ
10. Embodied energy / CO₂ footprint vs Strength or Modulus

Plus bar charts (Fig 3.1 style) and property-correlation charts (Fig 17.12 style).

### What makes an Ashby chart pedagogically correct
- **Log-log axes** with decade gridlines
- **Material ellipses** showing property *range* (min/max for both axes), not points
- **Family envelopes**: large colored regions enclosing all metals / polymers / ceramics / composites / foams / natural / elastomers
- **Draggable material-index guidelines** (slope 1, 1/2, 1/3, 2 for E/ρ, E^(1/2)/ρ, E^(1/3)/ρ, etc.)
- **Three-stage selection**: limit filter (sliders) + graphical box/line cut + tree filter (by family)
- **Hover-for-property-card**, click-to-highlight across all open charts
- **Custom index editor** (free-form `E^(1/2)/rho` etc.)

### Material families (from Table 3.1)
Metals (ferrous + nonferrous), Technical ceramics, Non-technical ceramics, Glasses, Polymers (thermoplastics + thermosets), Elastomers, Composites (CFRP, GFRP), Foams (flexible + rigid), Natural materials (wood, bamboo, cork, leather).

---

## 2. Tech stack

| Layer | Choice | Rationale |
|---|---|---|
| Data | JSON files + JSON Schema, git-versioned | Students can read & PR new entries; provenance per cell |
| Plotting | **Plotly.js** (React wrapper) | Interactive log-log out of the box; hover/select/lasso; SVG shapes for ellipses + index lines |
| App shell | **Vite + React + TypeScript** | Fast dev loop; type-safe across schema; no SSR needed |
| Routing | React Router (chart presets as routes) | Shareable URLs for ES 192 problem sets |
| State | Zustand or React Context | Three-stage selection state across charts |
| Hosting | **GitHub Pages** (static) | Free, forever, fork-friendly, no Ansys-server problem |
| Optional companion | Python package reading same JSON | Lets advanced students script custom indices in Jupyter |

**Why static-first:** no backend means no auth, no DB hosting, no cost. Students get post-graduation access. Instructors at other schools can fork and re-deploy in 5 minutes.

---

## 3. Data schema (proposed)

Each material is one JSON record with property ranges:

```json
{
  "id": "low-carbon-steel",
  "name": "Low carbon steel",
  "family": "metals",
  "subfamily": "ferrous-metals",
  "short_name": "Steel (low C)",
  "applications": ["Bridges", "Car body panels", "Pressure vessels"],
  "properties": {
    "density_kg_m3":          {"min": 7800, "max": 7900, "source": "Ashby App A.2"},
    "youngs_modulus_GPa":     {"min": 200,  "max": 215},
    "yield_strength_MPa":     {"min": 250,  "max": 395},
    "ultimate_strength_MPa":  {"min": 345,  "max": 580},
    "fracture_toughness_MPa_sqrt_m": {"min": 41, "max": 82},
    "thermal_conductivity_W_mK":     {"min": 49, "max": 54},
    "thermal_expansion_uK":   {"min": 11.5, "max": 13},
    "specific_heat_J_kgK":    {"min": 460, "max": 505},
    "melting_point_C":        {"min": 1480, "max": 1526},
    "electrical_resistivity_ohm_m":  {"min": 1.5e-7, "max": 2.0e-7},
    "loss_coefficient":       {"min": 1e-4, "max": 4e-4},
    "price_USD_kg":           {"min": 0.5, "max": 0.8},
    "embodied_energy_MJ_kg":  {"min": 30, "max": 35},
    "co2_footprint_kg_kg":    {"min": 2.2, "max": 2.5},
    "recycle_fraction":       {"min": 0.42, "max": 0.45}
  },
  "notes": "Workhorse structural steel; data from Ashby App A and Cambridge MDB 2011."
}
```

JSON Schema lives in `data/schema.json`. Validation runs in CI.

---

## 4. MVP phases

### Phase 1 — "It plots" (week 1–2)
- Repo scaffolding (Vite + React + TS + ESLint + Vitest)
- Data schema + JSON Schema validator in CI
- Seed dataset: 50 materials × 15 core properties (extracted from Ashby Appendix A)
- One interactive E-vs-ρ chart: log axes, family-colored ellipses, hover tooltips
- MIT license, README, GitHub Pages CI

### Phase 2 — "It selects" (week 3–4)
- All 10 canonical charts pickable from dropdown
- Bar charts (Fig 3.1)
- Three-stage selection UI: property sliders + family tree + graphical lasso
- Draggable material-index line with slope picker; auto-computes index value at intercept
- "Selected materials" panel surviving across chart switches

### Phase 3 — "It teaches" (week 5–6)
- Custom index editor (math expression parser, e.g., `E^(1/2)/rho`)
- Worked-example walkthroughs from Ch. 5 (oars, flywheels, springs, table legs)
- PNG/PDF export of annotated chart for homework submissions
- Deep-link URLs for ES 192 problem-set bindings

### Phase 4 — "Eco" (week 7–8, in MVP per user decision)
- Eco-Audit module: bill of materials → embodied energy + CO₂ across material / manufacture / transport / use / end-of-life phases
- Sustainability charts (Ch. 15 axes)

### Phase 5 — "If it catches on" (post-MVP)
- Hybrid synthesizer (sandwich/foam/composite rule-of-mixtures previews)
- Process selection chart (Ch. 6–7)
- User account / saved sessions (needs minimal backend)
- Crowdsourced material PRs with review workflow

---

## 5. Data curation pipeline

The data is the slow, valuable part. Workflow:

1. **Extract** Appendix A tables A.1–A.12 from the textbook PDF. Each table covers ~100 materials × 2–4 properties.
2. **Normalize** units to SI consistently (already mostly SI in the book).
3. **Cross-check** with Cambridge Materials Data Book 2011 (free PDF) for ranges.
4. **Validate**: each material record must pass the JSON Schema; ranges must be `min ≤ max`; outliers flagged for review.
5. **Cite**: every property entry carries a `source` field pointing to the table it came from.
6. **CI**: PRs that modify `data/` must pass schema + range sanity checks.

Optional later: scrape MechaniCalc Materials DB (engineering-grade, openly accessible), Figshare steel-strength dataset, FreeCAD material XML cards.

---

## 6. Repository layout (target)

```
OpenChartMS/
├── PLAN.md                  (this file)
├── README.md                (public-facing intro + screenshots)
├── LICENSE                  (MIT)
├── package.json             (Vite + React + TS)
├── vite.config.ts
├── tsconfig.json
├── .github/workflows/
│   ├── ci.yml               (lint + test + schema validate)
│   └── deploy.yml           (GitHub Pages)
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── AshbyChart.tsx       (Plotly wrapper, log-log + ellipses + index lines)
│   │   ├── FilterPanel.tsx      (3-stage selection UI)
│   │   ├── MaterialCard.tsx     (hover/click detail card)
│   │   ├── IndexLine.tsx        (draggable guideline)
│   │   └── EcoAudit/...
│   ├── data/
│   │   ├── loadMaterials.ts     (JSON loader + validator)
│   │   └── indices.ts           (catalog of standard material indices)
│   ├── lib/
│   │   ├── ellipse.ts           (min/max → ellipse SVG)
│   │   ├── envelope.ts          (family envelope via convex hull or alpha shape)
│   │   └── expr.ts              (custom-index math parser)
│   └── routes/
│       ├── ChartView.tsx
│       ├── EcoAudit.tsx
│       └── Examples.tsx
├── data/
│   ├── schema.json              (JSON Schema for material records)
│   ├── materials/               (one JSON per material)
│   │   ├── low-carbon-steel.json
│   │   ├── al-6061.json
│   │   └── ...
│   ├── indices.json             (standard material indices catalog)
│   └── examples/                (ES 192 problem-set chart presets)
└── docs/
    ├── DATA_SOURCES.md          (provenance & citations)
    ├── INDICES.md               (derivation of standard indices)
    └── PEDAGOGY.md              (how this maps to ES 192 weeks)
```

---

## 7. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Chart aesthetics copyright | Ashby textbook explicitly permits chart reproduction for teaching with attribution. We use book data, not EduPack exports. |
| Data values copyright | Cambridge Data Book is freely distributed by Cambridge; Ashby Appendix A is in the textbook the user owns; all reproduced numbers cite source. |
| Scope creep (Granta has 25 yrs of features) | Hard cap at Phase 4 for v1.0; everything else is Phase 5+. |
| Property ranges harder to find than point values | Use book Appendix A ranges directly — they're already curated for exactly this purpose. |
| Maintenance after course ends | MIT license + good contribution docs → other instructors can pick it up. |

---

## 8. Pedagogical mapping to ES 192

| Week | Topic | OpenChartMS feature used |
|---|---|---|
| 2 | Material families overview | Tree filter + family envelopes (Fig 3.3-style chart) |
| 3 | Mechanical properties | Property cards; bar charts (Fig 3.1) |
| 4 | Material indices & Ashby charts | Index line dragging; custom index editor; Ch. 5 worked examples |
| 6 | Failure modes | K_IC charts (Fig 3.7, 3.8) |
| 7 | Sustainability / midterm | Eco-Audit module; embodied-energy charts |
| 8–12 | Family deep dives | Per-family filtered views |
| 14 | Final project | Export annotated charts for student reports |

---

## 9. Open questions for next session

- Should the tool support saving/sharing a "selection state" via URL (deep links)? Probably yes — cheap to add, huge UX win.
- Do we want a dark mode? (Cosmetic; defer.)
- Should the Eco-Audit have its own pre-set BOMs for common products (bike frame, water bottle, laptop case)? Probably yes — high pedagogical value.

---

## 10. Immediate next steps

1. Curate the first 50-material JSON batch from Ashby Appendix A (Tables A.2–A.6).
2. Scaffold Vite + React + TS project.
3. Build single E-vs-ρ chart with ellipses and family colors.
4. Push to GitHub, enable Pages deployment.

That gets us to a real, demoable Phase 1 in ~2 weeks.
