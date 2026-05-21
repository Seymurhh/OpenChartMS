# Data sources, provenance and copyright

OpenChartMS is an open-source teaching tool. The software code is MIT-licensed.
This document explains where the *data* and *methods* come from, what
permissions apply, and how to extend or replace the bundled corpus.

## Primary source

Every property value in `data/materials/*.json` carries a `source` field, and
the bundled corpus is sourced from a single book:

> Ashby, M.F. (2025). *Materials Selection in Mechanical Design*, 6th edition.
> Butterworth-Heinemann / Elsevier. ISBN 978-0-443-16028-8.

Specifically:

| OpenChartMS file or feature | Book reference |
|---|---|
| `data/materials/*.json` | Appendix A, Tables A.1 – A.12 |
| `data/indices.json` (preset indices) | Appendix C, Tables C.2 – C.8 |
| Chart aesthetics (log-log, family envelopes, draggable index lines) | Chapter 3 |
| Penalty function + Pareto trade-off (Trade-off tab) | §9.3 |
| Coupling chart, min-max active-constraint method (Multi-constraint tab) | §9.2 |
| Hybrid micro-mechanics (Hybrid synthesizer tab) | Chapter 13 |
| Process attribute matrix + cost model (Process tab) | Chapter 7 |
| Eco-Audit lifecycle accounting (Eco-Audit tab) | Chapter 15 |

## Why we believe the bundled data and charts can be redistributed

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
