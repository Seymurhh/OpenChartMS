# Data sources, provenance and copyright

OpenChartMS is an open-source teaching tool developed for **Harvard ES 192
(Materials Selection and Failure Analysis)**. The software code is
MIT-licensed. This document records where every piece of data comes from,
which licence governs it, and why we believe the bundled corpus can be
redistributed for educational purposes.

**This tool is for educational and non-commercial use only.**
It is not intended for safety-critical engineering decisions.

---

## Corpus overview

The material database is built in phases. Every property value in
`data/materials/*.json` carries a per-cell `source` field. The table below
maps the `source` strings you will see in the JSON to the authoritative
publication:

| JSON `source` string | Full citation | Licence / terms |
|---|---|---|
| `Ashby App A (6th ed., 2025)` | Ashby, M.F. (2025). *Materials Selection in Mechanical Design*, 6th ed. Butterworth-Heinemann / Elsevier. ISBN 978-0-443-16028-8. | Textbook preface authorises reproduction for teaching with attribution |
| `ASM Handbook Vol 1` | *ASM Handbook, Vol. 1: Properties and Selection — Irons, Steels, and High-Performance Alloys*. ASM International. | Property values are physical facts (see §"Why data can be redistributed") |
| `ASM Handbook Vol 2` | *ASM Handbook, Vol. 2: Properties and Selection — Nonferrous Alloys and Special-Purpose Materials*. ASM International. | Same |
| `ASM EH Vol 4` | *ASM Engineered Materials Handbook, Vol. 4: Ceramics and Glasses*. ASM International. | Same |
| `CRC Handbook` | Haynes, W.M. (ed.) (2016). *CRC Handbook of Chemistry and Physics*, 97th ed. CRC Press. | Same |
| `Cambridge Materials Data Book` | Cebon, D. & Ashby, M.F. (2001). *Cambridge Materials Data Book*. Cambridge University Engineering Department. Freely distributed at teaching.eng.cam.ac.uk. | Freely distributed for teaching |
| `Bath ICE v3.0` | Hammond, G. & Jones, C. (2019). *Inventory of Carbon & Energy (ICE) v3.0*. University of Bath / BSRIA. | Research database; values used as factual reference |
| `Materials Project mp-XXXX (DFT)` | Jain, A. et al. (2013). The Materials Project: A materials genome approach to accelerating materials innovation. *APL Materials*, 1, 011002. DOI: 10.1063/1.4812323 | **CC BY 4.0** — attribution required (see below) |
| `Materials Project mp-XXXX (DFT, E = 9KG/(3K+G))` | Same Materials Project entry; Young's modulus *E* is derived from VRH bulk (*K*) and shear (*G*) moduli via the Voigt-Reuss-Hill relation | **CC BY 4.0** |

---

## Phase-by-phase provenance

### Phase 0 — original corpus (56 materials)

Source: Ashby Appendix A, Tables A.1–A.12, as listed below.

| OpenChartMS file or feature | Book reference |
|---|---|
| `data/materials/*.json` (phase-0 entries) | Appendix A, Tables A.1 – A.12 |
| `data/indices.json` (preset indices) | Appendix C, Tables C.2 – C.8 |
| Chart aesthetics (log-log, family envelopes, draggable index lines) | Chapter 3 |
| Penalty function + Pareto trade-off (Trade-off tab) | §9.3 |
| Coupling chart, min-max active-constraint method (Multi-constraint tab) | §9.2 |
| Hybrid micro-mechanics (Hybrid synthesizer tab) | Chapter 13 |
| Process attribute matrix + cost model (Process tab) | Chapter 7 |
| Eco-Audit lifecycle accounting (Eco-Audit tab) | Chapter 15 |

### Phase 1 — specific alloy grades (35 materials, total: 91)

Script: `scripts/add_phase1_materials.py`

Added specific commercial alloy grades and advanced materials not covered in
Ashby Appendix A. Primary sources:

- **ASM Handbook Vol. 1** (steels: 4140, 4340 alloy steels)
- **ASM Handbook Vol. 2** (aluminium alloys 1100, 2024-T3, 5052-H32, 6061-T6, 7075-T6; copper alloys C110, C260, C932, C17200; magnesium AZ31B/AZ91D; titanium Grade 2; Inconel 625/718)
- **Aerospace manufacturer data sheets** (Ti-6Al-4V/Grade 2, 17-4PH stainless)
- **ASTM standards** (316L, 304 stainless)
- **Cambridge Materials Data Book** (natural materials: bamboo, cortical bone, UHMWPE)
- **ASM Engineered Materials Handbook Vol. 4** (zirconia Y-TZP, Si₃N₄, B₄C, hydroxyapatite)
- **Composites supplier data** (CFRP UD, aramid, basalt composite)
- **Bath ICE v3.0** (eco properties: embodied energy, CO₂ footprint)

### Phase 2 — gap-filling materials (39 materials, total: 130)

Script: `scripts/add_phase2_materials.py`

Added tool steels, refractory/precious metals, additional ceramics, foams,
polymers, and natural materials to improve family coverage. Primary sources:

- **ASM Handbook Vol. 1** (H13, M2, 52100, maraging 300 tool/die steels)
- **ASM Handbook Vol. 2** (molybdenum, gold, silver, Zamak 3, Al A356-T6)
- **ASM Engineered Materials Handbook** (Hastelloy C-276, Stellite 6, TiN, TiC, MgO, cBN)
- **CRC Handbook** (graphite, granite, Zerodur glass-ceramic)
- **Cambridge Materials Data Book** (porcelain, gypsum, Macor, C/C composite)
- **Manufacturer data sheets** (Macor: Corning; PVDF: Arkema Kynar)
- **Published foam literature** (Al closed/open-cell foam, syntactic foam; Gibson & Ashby, *Cellular Solids*, 2nd ed., 1997)
- **ISO/DIN standards** (LCP, PPS, PEI/Ultem polymer grades)
- **Bath ICE v3.0** (eco properties for all new entries)

### Phase 3 — Materials Project API (29 materials, total: 159)

Script: `scripts/add_phase3_materials_project.py`

DFT-computed density and elastic constants were retrieved from the Materials
Project API (accessed May 2025). Young's modulus is derived via the
Voigt-Reuss-Hill relation *E = 9KG / (3K + G)*; a ±7% range is applied to
reflect typical DFT accuracy for elastic moduli. Supplementary properties
(strength, toughness, thermal, eco) were sourced from the references below.

Materials added and their MP identifiers:

| Material | MP id | Supplementary source |
|---|---|---|
| TiO₂ (rutile) | mp-2657 | ASM EH Vol 4, Bath ICE v3.0 |
| ZnO (wurtzite) | mp-2133 | CRC Handbook, Bath ICE v3.0 |
| Cr₂O₃ | mp-19399 | ASM EH Vol 4 |
| CeO₂ | mp-20194 | CRC Handbook |
| Y₂O₃ | mp-2652 | ASM EH Vol 4 |
| Fe₂O₃ (haematite) | mp-19770 | CRC Handbook |
| MgAl₂O₄ (spinel) | mp-3536 | ASM EH Vol 4 |
| BeO (beryllia) | mp-1039 | ASM EH Vol 4 |
| TaC | mp-1043 | ASM EH Vol 4 |
| NbC | mp-1065 | ASM EH Vol 4 |
| Cr₃C₂ | mp-1551 | ASM EH Vol 4 |
| GaN | mp-804 | CRC Handbook |
| ZrN | mp-1025 | ASM EH Vol 4 |
| NbN | mp-1219 | CRC Handbook |
| ZrB₂ | mp-1550 | ASM EH Vol 4 |
| HfB₂ | mp-1966 | ASM EH Vol 4 |
| MoSi₂ | mp-1174 | ASM EH Vol 4 |
| Diamond (cubic C) | mp-66 | ASM EH Vol 4, Bath ICE v3.0 |
| Germanium | mp-32 | CRC Handbook |
| GaAs | mp-2534 | CRC Handbook |
| InP | mp-20351 | CRC Handbook |
| NiAl (B2) | mp-1090 | ASM Handbook Vol 2 |
| Ni₃Al (γ′) | mp-2593 | ASM Handbook Vol 2 |
| W (tungsten) | mp-91 | ASM Handbook Vol 2 |
| Nb (niobium) | mp-39 | ASM Handbook Vol 2 |
| Ta (tantalum) | mp-72 | ASM Handbook Vol 2 |
| Re (rhenium) | mp-8 | CRC Handbook |
| Ru (ruthenium) | mp-33 | CRC Handbook |
| Ir (iridium) | mp-101 | CRC Handbook |

**Materials Project citation (required under CC BY 4.0):**

> Jain, A., Ong, S.P., Hautier, G., Chen, W., Richards, W.D., Dacek, S.,
> Cholia, S., Gunter, D., Skinner, D., Ceder, G. & Persson, K.A. (2013).
> Commentary: The Materials Project: A materials genome approach to accelerating
> materials innovation. *APL Materials*, 1(1), 011002.
> DOI: [10.1063/1.4812323](https://doi.org/10.1063/1.4812323)

Data downloaded via `mp-api==0.42.1` using the Materials Project REST API
(<https://api.materialsproject.org>). Accessed May 2025.

---

## Why data can be redistributed

Three reasons:

1. **Express permission from the textbook author**. The book's preface (page xiv,
   6th ed.) states:
   > "Although the book itself is copyrighted, the instructor or reader is
   > authorized to make unlimited copies of the charts and to reproduce these
   > for teaching purposes, provided that the source is referenced."

   OpenChartMS reproduces charts only as live, interactive output of its own
   code; the underlying values used to generate those charts fall within the
   intent of that permission. Every place a value is shown, the source is
   cited.

2. **Property values are physical facts**. Density, modulus, strength, etc. are
   not authored content; they are measurements of physical reality reported in
   countless reference works (ASM Handbook, NIST WebBook, Cambridge Materials
   Data Book, MMPDS, MatWeb, MakeItFrom). Under *Feist Publications, Inc. v.
   Rural Telephone Service Co.* (US Supreme Court, 1991), facts themselves
   carry no copyright; only original selection or arrangement does.

3. **Application descriptions are paraphrased**. The `applications` strings on
   each material were rewritten in our own words rather than copied from
   Table A.1 (see [scripts/paraphrase_applications.py](../scripts/paraphrase_applications.py)).
   This reduces literal-text similarity to the book.

If you wish to rebuild the corpus from a fully independent source, the
[Cambridge Materials Data Book (2011)](https://teaching.eng.cam.ac.uk/sites/teaching.eng.cam.ac.uk/files/Documents/Databooks/MATERIALS%20DATABOOK%20(2011)%20version%20for%20Moodle.pdf)
is freely distributed by the Cambridge University Engineering Department and
covers most of the same materials.

## What OpenChartMS does *not* do

- It does **not** reproduce any page, figure, table, or paragraph of the book
  verbatim. The charts shown are generated at runtime by the OpenChartMS code
  from the JSON corpus.
- It does **not** use any data exported from Ansys Granta EduPack or any other
  proprietary database. "Granta", "EduPack", and the Ansys logos are
  trademarks of Ansys, Inc. and are not used by this project.
- It does **not** copy the look-and-feel of Granta's UI. Chart styling follows
  standard Ashby textbook conventions (log-log axes, family-colored envelopes,
  ellipses for range) which predate Granta.

## Reuse and licensing

| Component | License | Notes |
|---|---|---|
| Software code (`src/`, `scripts/`, configs) | MIT (see [LICENSE](../LICENSE)) | Free to use, modify, redistribute. |
| Bundled material corpus (`data/materials/*.json`) | Reuse permitted with attribution to Ashby (6th ed., 2025) per textbook preface; OpenChartMS does not add additional restrictions. | Treat property values as factual; cite the book. |
| Material families palette + indices catalog | MIT (our work) | Derived from Ashby methodology but the JSON encoding is our own. |
| Chart aesthetics | Not licensed by us — standard scientific convention. | Reproduces classical Ashby chart appearance. |

## Citing OpenChartMS

See [CITATION.cff](../CITATION.cff) for a machine-readable citation. In short:
cite **both** OpenChartMS (this repository) **and** the Ashby textbook when you
use OpenChartMS in teaching or research.

## Disclaimers

OpenChartMS values are intended for **teaching**, not for safety-critical
engineering design. Where life-safety or regulatory compliance is at stake,
use MMPDS, ASM, NIST, manufacturer data sheets, or a comparable validated
source.

The maintainers are not lawyers; this document records our good-faith reading
of the relevant permissions and applicable copyright concepts. Institutions
considering OpenChartMS as part of an official course or product should
consult their own counsel.
