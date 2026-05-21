#!/usr/bin/env python3
"""One-shot paraphraser for materials' application strings.

Rewrites the `applications` list in scripts/build_materials.py so the values are
genuine rewordings rather than near-verbatim copies of Ashby Table A.1, then
exits. The intent is to reduce literal-similarity to the source text while
preserving the engineering meaning of the field.

Run once after editing the mapping; the result is committed alongside the
regenerated JSON corpus.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BUILD_SCRIPT = ROOT / "scripts" / "build_materials.py"

PARAPHRASED = {
    # Ferrous metals
    "cast-iron-ductile":   ["Engine block castings", "Heavy machinery frames", "Wear-resistant components"],
    "cast-iron-gray":      ["Engine castings", "Vibration-damped machine bases", "Cast cookware"],
    "high-carbon-steel":   ["Wear-tolerant tooling", "Heavy springs", "Rail track and rolling stock"],
    "low-alloy-steel":     ["Engineered springs", "Rolling-element bearings", "High-fatigue parts"],
    "low-carbon-steel":    ["General structural shapes", "Automotive sheet stock", "Pressed containers"],
    "medium-carbon-steel": ["Power-transmission components", "Hand-tool stock", "Quenched and tempered shafts"],
    "stainless-steel":     ["Food and pharma equipment", "Corrosion-resistant pipework", "Surgical instruments"],

    # Nonferrous metals
    "aluminum-alloys":  ["Lightweight aerospace components", "Drawn beverage containers", "Building cladding"],
    "copper-alloys":    ["Power and electronics conductors", "Heat-exchange coils", "Decorative brasswork"],
    "lead-alloys":      ["Radiation shielding", "Solder alloys", "Lead-acid battery plates"],
    "magnesium-alloys": ["Lightweight die castings", "Power-tool housings", "Aerospace and motorsport parts"],
    "nickel-alloys":    ["High-temperature turbine blades", "Chemical plant equipment", "Thermocouple wires"],
    "titanium-alloys":  ["Aerospace airframe parts", "Biocompatible implants", "High-strength corrosion-resistant components"],
    "tungsten-alloys":  ["Dense counterweights", "High-temperature electrodes", "Radiation shielding"],
    "zinc-alloys":      ["Low-temperature die castings", "Sacrificial coatings", "Hardware fittings"],

    # Glasses
    "borosilicate-glass": ["Thermal-shock-resistant labware", "Lighting envelopes", "Cookware"],
    "silica-glass":       ["Fused-quartz crucibles", "UV-transparent optics", "High-temperature furnace components"],
    "soda-lime-glass":    ["Architectural glazing", "Container glass", "Display screens"],

    # Technical ceramics
    "alumina":          ["Insulator substrates", "Wear-tool inserts", "Spark-plug bodies"],
    "aluminum-nitride": ["High-conductivity electronic substrates", "RF-package heat spreaders"],
    "silicon":          ["Semiconductor wafers", "MEMS devices", "Solar cells"],
    "silicon-carbide":  ["High-temperature shaft seals", "Cutting and grinding abrasives", "Light armor plate"],
    "tungsten-carbide": ["Carbide cutting inserts", "Rock-drilling bits", "Wear plates"],

    # Non-technical ceramics
    "brick":    ["Masonry construction", "Facade cladding"],
    "concrete": ["Civil structural construction", "Foundations and slabs"],
    "stone":    ["Cut stone facades", "Monumental construction", "Pavers and tiles"],

    # Elastomers
    "butyl-rubber":        ["Inner tubes and tire liners", "Vibration mounts", "Chemical-resistant tubing"],
    "eva":                 ["Athletic-shoe midsoles", "Flexible film packaging", "Adhesive hot-melt formulations"],
    "natural-rubber":      ["Tire treads and inner tubes", "Latex gloves and films", "Vibration-damping mounts"],
    "polychloroprene":     ["Marine and outdoor seals", "Wetsuit material", "Oil-resistant gaskets"],
    "silicone-elastomers": ["Medical implant components", "Electronics potting compounds", "High-temperature seals"],

    # Thermoplastics
    "abs":          ["Injection-molded enclosures", "Automotive trim", "Consumer-product housings"],
    "polyamide":    ["Wear-resistant gears and bearings", "Textile fibers", "Engineered plumbing fittings"],
    "polycarbonate":["Impact-resistant glazing", "Protective eyewear", "Medical-device housings"],
    "peek":         ["High-temperature engineered components", "Aerospace bearings", "Surgical implant subassemblies"],
    "polyethylene": ["Flexible packaging films", "Blow-molded bottles", "Joint-replacement bearings"],
    "pet":          ["Beverage bottles", "Industrial fibers and tapes", "Food-grade packaging"],
    "pmma":         ["Optical-quality glazing", "Display covers", "Light-pipe components"],
    "pom":          ["Precision gears and snaps", "Small mechanism parts", "Appliance internals"],
    "polypropylene":["Living-hinge containers", "Chemical-resistant piping", "Synthetic fibers"],
    "polystyrene":  ["Disposable packaging", "Optical clarity products", "Foamed insulation board"],
    "ptfe":         ["Low-friction bearings", "Chemical-process gaskets", "Wire insulation"],
    "pvc":          ["Plumbing and drainage pipe", "Window-frame extrusions", "Flexible film products"],

    # Thermosets
    "epoxy":              ["Structural adhesives", "Composite-matrix resin", "Encapsulation compounds"],
    "phenolic":           ["Heat-resistant electrical fittings", "Press-molded handles", "Wood-product adhesives"],
    "polyester-thermoset":["Marine and recreational composites", "Glass-fiber bodywork", "Architectural panels"],

    # Foams
    "flexible-foam-ld": ["Cushion stuffing", "Protective-packaging inserts", "Bedding fillers"],
    "flexible-foam-md": ["Upholstery foam", "Acoustic-damping pads", "Filtration sponges"],
    "rigid-foam-hd":    ["Building-board insulation", "Structural sandwich cores", "Buoyancy modules"],
    "rigid-foam-ld":    ["Cold-storage insulation", "Shock-absorbing voids", "Foam-board cores"],

    # Natural
    "cork":     ["Sealing closures", "Acoustic-damping panels", "Flooring underlay"],
    "paper":    ["Box and bag stock", "Print substrates", "Honeycomb cores"],
    "softwood": ["Framing lumber", "Joinery and trim", "Pulp and pallets"],
    "hardwood": ["Furniture stock", "Cabinet and flooring boards", "Marine planking"],

    # Composites
    "cfrp": ["Aerospace primary structure", "Sporting-good composite frames", "High-performance pressure vessels"],
    "gfrp": ["Marine hull laminates", "Lightweight enclosures", "Wind-turbine blade skins"],
}


def main() -> int:
    src = BUILD_SCRIPT.read_text()
    updates = 0
    misses: list[str] = []

    for mid, apps in PARAPHRASED.items():
        apps_lit = "[" + ", ".join(f'"{a}"' for a in apps) + "]"
        # Match each material's id line and its corresponding applications line
        pattern = re.compile(
            r'("id":\s*"' + re.escape(mid) + r'".*?"applications":\s*)\[[^\]]*\]',
            re.DOTALL,
        )
        new_src, n = pattern.subn(lambda m: m.group(1) + apps_lit, src, count=1)
        if n == 1:
            src = new_src
            updates += 1
        else:
            misses.append(mid)

    BUILD_SCRIPT.write_text(src)
    print(f"Updated {updates}/{len(PARAPHRASED)} applications.")
    if misses:
        print(f"WARNING: no match for ids: {misses}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
