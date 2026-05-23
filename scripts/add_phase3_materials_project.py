"""
Phase 3 material expansion — Materials Project API.
Pulls DFT density + elastic moduli (K_VRH, G_VRH) for ~50 technical ceramics,
refractory metals, semiconductors, and intermetallics, then merges with
supplementary properties (strength, toughness, thermal, eco) from published
literature curated below.

Run from repo root:
    export MP_API_KEY="your-key"
    python scripts/add_phase3_materials_project.py

Or pass the key inline (not recommended for shared repos):
    python scripts/add_phase3_materials_project.py --api-key <KEY>

Requirements:
    pip install mp-api==0.42.1 emmet-core==0.83.6 pymatgen==2024.8.9

Sources for supplementary data:
  - ASM Engineered Materials Handbook Vol 4 (Ceramics & Glasses)
  - Munro, R.G. "Material Properties of a Sintered α-SiC" J. Phys. Chem.
  - Bath ICE v3.0 (eco properties)
  - CRC Handbook of Chemistry and Physics
"""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Optional

REPO = Path(__file__).parent.parent
DATA_DIR = REPO / "data"
MAT_DIR = DATA_DIR / "materials"


# ── Supplementary property table (literature, not from MP) ────────────────
# Keyed by mp_id. Properties follow the OpenChartMS schema exactly.
# For ceramics: yield_strength_MPa = flexural strength (Ashby convention).
SUPPLEMENTARY: dict[str, dict] = {

    # ── Oxide ceramics ─────────────────────────────────────────────────────
    "mp-2657": {   # TiO2 rutile
        "name": "Titanium dioxide, rutile (TiO₂)",
        "short_name": "TiO₂ (rutile)",
        "family": "ceramics-technical",
        "subfamily": "oxide-ceramics",
        "applications": ["White pigment", "Photocatalysts (UV)", "Optical coatings", "Gas sensors", "Solar cells"],
        "notes": "Most stable TiO₂ polymorph. Wide bandgap (~3.0 eV). Photocatalytic activity under UV.",
        "props": {
            "yield_strength_MPa":            {"min": 100,  "max": 200,  "source": "ASM EH Vol 4"},
            "fracture_toughness_MPa_sqrt_m": {"min": 2.5,  "max": 3.5,  "source": "ASM EH Vol 4"},
            "melting_point_C":               {"min": 1843, "max": 1843, "source": "CRC Handbook"},
            "specific_heat_J_kgK":           {"min": 680,  "max": 710,  "source": "CRC Handbook"},
            "thermal_conductivity_W_mK":     {"min": 4.8,  "max": 11.8, "source": "CRC Handbook"},
            "thermal_expansion_uK":          {"min": 7.1,  "max": 9.2,  "source": "CRC Handbook"},
            "embodied_energy_MJ_kg":         {"min": 30,   "max": 60,   "source": "Bath ICE v3.0 (estimate)"},
            "co2_footprint_kg_kg":           {"min": 2.0,  "max": 4.0,  "source": "Bath ICE v3.0 (estimate)"},
        }
    },
    "mp-2133": {   # ZnO
        "name": "Zinc oxide (ZnO, wurtzite)",
        "short_name": "ZnO",
        "family": "ceramics-technical",
        "subfamily": "oxide-ceramics",
        "applications": ["Varistors", "Sunscreen (UV absorber)", "Piezoelectric transducers", "Transparent electrodes", "Anti-corrosion coatings"],
        "notes": "Wide bandgap (3.37 eV), strong room-temperature piezoelectric response. Wurtzite structure.",
        "props": {
            "yield_strength_MPa":            {"min": 100,  "max": 200,  "source": "ASM EH Vol 4"},
            "fracture_toughness_MPa_sqrt_m": {"min": 0.8,  "max": 1.5,  "source": "ASM EH Vol 4"},
            "melting_point_C":               {"min": 1975, "max": 1975, "source": "CRC Handbook"},
            "specific_heat_J_kgK":           {"min": 490,  "max": 510,  "source": "CRC Handbook"},
            "thermal_conductivity_W_mK":     {"min": 30,   "max": 55,   "source": "CRC Handbook"},
            "thermal_expansion_uK":          {"min": 2.9,  "max": 4.7,  "source": "CRC Handbook"},
            "embodied_energy_MJ_kg":         {"min": 20,   "max": 50,   "source": "Bath ICE v3.0 (estimate)"},
            "co2_footprint_kg_kg":           {"min": 1.5,  "max": 3.5,  "source": "Bath ICE v3.0 (estimate)"},
        }
    },
    "mp-19399": {  # Cr2O3
        "name": "Chromia (Cr₂O₃, eskolaite)",
        "short_name": "Cr₂O₃",
        "family": "ceramics-technical",
        "subfamily": "oxide-ceramics",
        "applications": ["Green pigment", "Refractory wear linings", "Hard coatings", "Abrasives"],
        "notes": "Extremely hard oxide (Vickers ~2800). Forms protective passive layer on stainless steel.",
        "props": {
            "yield_strength_MPa":            {"min": 150,  "max": 300,  "source": "ASM EH Vol 4"},
            "fracture_toughness_MPa_sqrt_m": {"min": 2.0,  "max": 3.5,  "source": "ASM EH Vol 4"},
            "melting_point_C":               {"min": 2435, "max": 2435, "source": "CRC Handbook"},
            "specific_heat_J_kgK":           {"min": 750,  "max": 760,  "source": "CRC Handbook"},
            "thermal_conductivity_W_mK":     {"min": 12,   "max": 15,   "source": "CRC Handbook"},
            "thermal_expansion_uK":          {"min": 7.5,  "max": 9.5,  "source": "CRC Handbook"},
            "embodied_energy_MJ_kg":         {"min": 40,   "max": 80,   "source": "Bath ICE v3.0 (estimate)"},
            "co2_footprint_kg_kg":           {"min": 3.0,  "max": 6.0,  "source": "Bath ICE v3.0 (estimate)"},
        }
    },
    "mp-20194": {  # CeO2
        "name": "Ceria (CeO₂, cerianite)",
        "short_name": "CeO₂",
        "family": "ceramics-technical",
        "subfamily": "oxide-ceramics",
        "applications": ["Catalytic converter washcoat", "Solid oxide fuel cell electrolytes", "Glass polishing", "UV filters"],
        "notes": "Excellent oxygen storage capacity (Ce³⁺↔Ce⁴⁺). Used in 3-way catalysts for emission control.",
        "props": {
            "yield_strength_MPa":            {"min": 100,  "max": 200,  "source": "ASM EH Vol 4"},
            "fracture_toughness_MPa_sqrt_m": {"min": 1.5,  "max": 2.5,  "source": "ASM EH Vol 4"},
            "melting_point_C":               {"min": 2400, "max": 2400, "source": "CRC Handbook"},
            "specific_heat_J_kgK":           {"min": 435,  "max": 450,  "source": "CRC Handbook"},
            "thermal_conductivity_W_mK":     {"min": 11,   "max": 12,   "source": "CRC Handbook"},
            "thermal_expansion_uK":          {"min": 11.0, "max": 12.0, "source": "CRC Handbook"},
            "embodied_energy_MJ_kg":         {"min": 100,  "max": 250,  "source": "Bath ICE v3.0 (estimate)"},
            "co2_footprint_kg_kg":           {"min": 7,    "max": 18,   "source": "Bath ICE v3.0 (estimate)"},
        }
    },
    "mp-2652": {   # Y2O3
        "name": "Yttria (Y₂O₃)",
        "short_name": "Y₂O₃",
        "family": "ceramics-technical",
        "subfamily": "oxide-ceramics",
        "applications": ["Stabiliser in Y-TZP zirconia", "Phosphors", "Laser gain medium host", "Infrared windows"],
        "notes": "Critical dopant for stabilising tetragonal zirconia. Also used as a phosphor host lattice.",
        "props": {
            "yield_strength_MPa":            {"min": 150,  "max": 220,  "source": "ASM EH Vol 4"},
            "fracture_toughness_MPa_sqrt_m": {"min": 1.5,  "max": 2.5,  "source": "ASM EH Vol 4"},
            "melting_point_C":               {"min": 2430, "max": 2430, "source": "CRC Handbook"},
            "specific_heat_J_kgK":           {"min": 455,  "max": 465,  "source": "CRC Handbook"},
            "thermal_conductivity_W_mK":     {"min": 13,   "max": 15,   "source": "CRC Handbook"},
            "thermal_expansion_uK":          {"min": 8.0,  "max": 8.3,  "source": "CRC Handbook"},
            "embodied_energy_MJ_kg":         {"min": 200,  "max": 500,  "source": "Bath ICE v3.0 (estimate)"},
            "co2_footprint_kg_kg":           {"min": 14,   "max": 35,   "source": "Bath ICE v3.0 (estimate)"},
        }
    },
    "mp-19770": {  # Fe2O3
        "name": "Haematite (Fe₂O₃)",
        "short_name": "Fe₂O₃",
        "family": "ceramics-nontechnical",
        "subfamily": "mineral-ceramics",
        "applications": ["Iron ore (primary feed)", "Red/yellow pigment", "Magnetic recording media", "Photocatalyst"],
        "notes": "Most stable iron oxide. Antiferromagnetic below 955 K (Morin transition).",
        "props": {
            "yield_strength_MPa":            {"min": 50,   "max": 150,  "source": "ASM EH Vol 4"},
            "fracture_toughness_MPa_sqrt_m": {"min": 1.0,  "max": 1.5,  "source": "ASM EH Vol 4"},
            "melting_point_C":               {"min": 1565, "max": 1565, "source": "CRC Handbook"},
            "specific_heat_J_kgK":           {"min": 650,  "max": 680,  "source": "CRC Handbook"},
            "thermal_conductivity_W_mK":     {"min": 10,   "max": 12,   "source": "CRC Handbook"},
            "thermal_expansion_uK":          {"min": 12,   "max": 14,   "source": "CRC Handbook"},
            "embodied_energy_MJ_kg":         {"min": 0.5,  "max": 2.0,  "source": "Bath ICE v3.0"},
            "co2_footprint_kg_kg":           {"min": 0.05, "max": 0.2,  "source": "Bath ICE v3.0"},
        }
    },
    "mp-3536": {   # MgAl2O4 spinel
        "name": "Spinel (MgAl₂O₄)",
        "short_name": "Spinel",
        "family": "ceramics-technical",
        "subfamily": "oxide-ceramics",
        "applications": ["Transparent armour windows", "Refractory linings (steel-making)", "Optical domes"],
        "notes": "Optically transparent from UV to mid-IR. High hardness and thermal shock resistance.",
        "props": {
            "yield_strength_MPa":            {"min": 150,  "max": 270,  "source": "ASM EH Vol 4"},
            "fracture_toughness_MPa_sqrt_m": {"min": 1.5,  "max": 2.5,  "source": "ASM EH Vol 4"},
            "melting_point_C":               {"min": 2135, "max": 2135, "source": "CRC Handbook"},
            "specific_heat_J_kgK":           {"min": 815,  "max": 830,  "source": "CRC Handbook"},
            "thermal_conductivity_W_mK":     {"min": 15,   "max": 20,   "source": "CRC Handbook"},
            "thermal_expansion_uK":          {"min": 7.6,  "max": 8.5,  "source": "CRC Handbook"},
            "embodied_energy_MJ_kg":         {"min": 20,   "max": 50,   "source": "Bath ICE v3.0 (estimate)"},
            "co2_footprint_kg_kg":           {"min": 1.5,  "max": 4.0,  "source": "Bath ICE v3.0 (estimate)"},
        }
    },
    "mp-1039": {   # BeO
        "name": "Beryllia (BeO)",
        "short_name": "BeO",
        "family": "ceramics-technical",
        "subfamily": "oxide-ceramics",
        "applications": ["High-power electronics substrates", "Nuclear reactor moderator", "Microwave tube windows"],
        "notes": "Exceptionally high thermal conductivity for a ceramic (~250 W/mK). BeO dust is highly toxic — strict handling controls required.",
        "props": {
            "yield_strength_MPa":            {"min": 200,  "max": 350,  "source": "ASM EH Vol 4"},
            "fracture_toughness_MPa_sqrt_m": {"min": 2.0,  "max": 3.5,  "source": "ASM EH Vol 4"},
            "melting_point_C":               {"min": 2530, "max": 2530, "source": "CRC Handbook"},
            "specific_heat_J_kgK":           {"min": 1020, "max": 1050, "source": "CRC Handbook"},
            "thermal_conductivity_W_mK":     {"min": 230,  "max": 300,  "source": "CRC Handbook"},
            "thermal_expansion_uK":          {"min": 7.5,  "max": 8.5,  "source": "CRC Handbook"},
            "embodied_energy_MJ_kg":         {"min": 300,  "max": 600,  "source": "Bath ICE v3.0 (estimate)"},
            "co2_footprint_kg_kg":           {"min": 20,   "max": 40,   "source": "Bath ICE v3.0 (estimate)"},
        }
    },

    # ── Refractory carbides ────────────────────────────────────────────────
    "mp-1018": {   # ZrC
        "name": "Zirconium carbide (ZrC)",
        "short_name": "ZrC",
        "family": "ceramics-technical",
        "subfamily": "carbide-ceramics",
        "applications": ["Nuclear fuel coating (TRISO particles)", "Ultra-high temp structures", "Hard coatings"],
        "notes": "Refractory carbide with metallic conductivity. Stable in neutron flux — used in nuclear fuel microspheres.",
        "props": {
            "yield_strength_MPa":            {"min": 300,  "max": 500,  "source": "ASM EH Vol 4"},
            "fracture_toughness_MPa_sqrt_m": {"min": 2.5,  "max": 4.0,  "source": "ASM EH Vol 4"},
            "melting_point_C":               {"min": 3530, "max": 3530, "source": "CRC Handbook"},
            "specific_heat_J_kgK":           {"min": 370,  "max": 380,  "source": "CRC Handbook"},
            "thermal_conductivity_W_mK":     {"min": 20,   "max": 25,   "source": "CRC Handbook"},
            "thermal_expansion_uK":          {"min": 6.7,  "max": 7.0,  "source": "CRC Handbook"},
            "electrical_resistivity_uohm_cm":{"min": 42,   "max": 67,   "source": "CRC Handbook"},
            "embodied_energy_MJ_kg":         {"min": 200,  "max": 500,  "source": "Bath ICE v3.0 (estimate)"},
            "co2_footprint_kg_kg":           {"min": 14,   "max": 35,   "source": "Bath ICE v3.0 (estimate)"},
        }
    },
    "mp-1043": {   # TaC
        "name": "Tantalum carbide (TaC)",
        "short_name": "TaC",
        "family": "ceramics-technical",
        "subfamily": "carbide-ceramics",
        "applications": ["Cemented carbide binders", "Cutting tools", "Rocket motor nozzles", "Diffusion barriers"],
        "notes": "TaC has the highest melting point of any binary compound (~3880°C). Added to WC tools to inhibit grain growth.",
        "props": {
            "yield_strength_MPa":            {"min": 400,  "max": 600,  "source": "ASM EH Vol 4"},
            "fracture_toughness_MPa_sqrt_m": {"min": 4.0,  "max": 6.0,  "source": "ASM EH Vol 4"},
            "melting_point_C":               {"min": 3880, "max": 3880, "source": "CRC Handbook"},
            "specific_heat_J_kgK":           {"min": 185,  "max": 195,  "source": "CRC Handbook"},
            "thermal_conductivity_W_mK":     {"min": 22,   "max": 24,   "source": "CRC Handbook"},
            "thermal_expansion_uK":          {"min": 6.3,  "max": 6.6,  "source": "CRC Handbook"},
            "electrical_resistivity_uohm_cm":{"min": 30,   "max": 42,   "source": "CRC Handbook"},
            "embodied_energy_MJ_kg":         {"min": 300,  "max": 800,  "source": "Bath ICE v3.0 (estimate)"},
            "co2_footprint_kg_kg":           {"min": 20,   "max": 55,   "source": "Bath ICE v3.0 (estimate)"},
        }
    },
    "mp-1065": {   # NbC
        "name": "Niobium carbide (NbC)",
        "short_name": "NbC",
        "family": "ceramics-technical",
        "subfamily": "carbide-ceramics",
        "applications": ["Cemented carbide grain growth inhibitor", "Wear-resistant coatings", "Cutting tools"],
        "props": {
            "yield_strength_MPa":            {"min": 300,  "max": 500,  "source": "ASM EH Vol 4"},
            "fracture_toughness_MPa_sqrt_m": {"min": 2.5,  "max": 4.0,  "source": "ASM EH Vol 4"},
            "melting_point_C":               {"min": 3490, "max": 3490, "source": "CRC Handbook"},
            "specific_heat_J_kgK":           {"min": 270,  "max": 285,  "source": "CRC Handbook"},
            "thermal_conductivity_W_mK":     {"min": 14,   "max": 17,   "source": "CRC Handbook"},
            "thermal_expansion_uK":          {"min": 6.6,  "max": 7.2,  "source": "CRC Handbook"},
            "electrical_resistivity_uohm_cm":{"min": 35,   "max": 75,   "source": "CRC Handbook"},
            "embodied_energy_MJ_kg":         {"min": 200,  "max": 500,  "source": "Bath ICE v3.0 (estimate)"},
            "co2_footprint_kg_kg":           {"min": 14,   "max": 35,   "source": "Bath ICE v3.0 (estimate)"},
        }
    },
    "mp-1551": {   # Cr3C2
        "name": "Chromium carbide (Cr₃C₂)",
        "short_name": "Cr₃C₂",
        "family": "ceramics-technical",
        "subfamily": "carbide-ceramics",
        "applications": ["Thermal-spray wear coatings", "Corrosion/oxidation resistant coatings", "Cutting tools"],
        "notes": "Used in Cr₃C₂–NiCr thermal spray coatings for elevated-temperature wear and corrosion resistance.",
        "props": {
            "yield_strength_MPa":            {"min": 300,  "max": 600,  "source": "ASM EH Vol 4"},
            "fracture_toughness_MPa_sqrt_m": {"min": 2.5,  "max": 5.0,  "source": "ASM EH Vol 4"},
            "melting_point_C":               {"min": 1895, "max": 1895, "source": "CRC Handbook"},
            "specific_heat_J_kgK":           {"min": 560,  "max": 580,  "source": "CRC Handbook"},
            "thermal_conductivity_W_mK":     {"min": 19,   "max": 22,   "source": "CRC Handbook"},
            "thermal_expansion_uK":          {"min": 10.0, "max": 11.0, "source": "CRC Handbook"},
            "electrical_resistivity_uohm_cm":{"min": 75,   "max": 125,  "source": "CRC Handbook"},
            "embodied_energy_MJ_kg":         {"min": 100,  "max": 250,  "source": "Bath ICE v3.0 (estimate)"},
            "co2_footprint_kg_kg":           {"min": 7,    "max": 18,   "source": "Bath ICE v3.0 (estimate)"},
        }
    },

    # ── Refractory nitrides ────────────────────────────────────────────────
    "mp-804": {    # GaN
        "name": "Gallium nitride (GaN)",
        "short_name": "GaN",
        "family": "ceramics-technical",
        "subfamily": "nitride-ceramics",
        "applications": ["Blue/UV LEDs and lasers", "High-electron-mobility transistors (HEMT)", "5G power amplifiers", "Electric vehicle inverters"],
        "notes": "Wide bandgap (3.4 eV) semiconductor. Enabling material for solid-state lighting and high-power/high-frequency electronics.",
        "props": {
            "yield_strength_MPa":            {"min": 200,  "max": 400,  "source": "ASM EH Vol 4"},
            "fracture_toughness_MPa_sqrt_m": {"min": 0.5,  "max": 1.5,  "source": "ASM EH Vol 4"},
            "melting_point_C":               {"min": 2500, "max": 2500, "source": "CRC Handbook"},
            "specific_heat_J_kgK":           {"min": 485,  "max": 495,  "source": "CRC Handbook"},
            "thermal_conductivity_W_mK":     {"min": 130,  "max": 200,  "source": "CRC Handbook"},
            "thermal_expansion_uK":          {"min": 5.4,  "max": 5.8,  "source": "CRC Handbook"},
            "embodied_energy_MJ_kg":         {"min": 500,  "max": 2000, "source": "Bath ICE v3.0 (estimate, MOCVD wafer)"},
            "co2_footprint_kg_kg":           {"min": 35,   "max": 130,  "source": "Bath ICE v3.0 (estimate)"},
        }
    },
    "mp-1025": {   # ZrN
        "name": "Zirconium nitride (ZrN)",
        "short_name": "ZrN",
        "family": "ceramics-technical",
        "subfamily": "nitride-ceramics",
        "applications": ["Gold-coloured PVD coatings", "Cutting tool wear coatings", "Diffusion barriers in microelectronics"],
        "notes": "Similar colour and properties to TiN. Lower chemical reactivity; used where TiN would react.",
        "props": {
            "yield_strength_MPa":            {"min": 600,  "max": 900,  "source": "ASM EH Vol 4"},
            "fracture_toughness_MPa_sqrt_m": {"min": 3.0,  "max": 5.0,  "source": "ASM EH Vol 4"},
            "melting_point_C":               {"min": 2980, "max": 2980, "source": "CRC Handbook"},
            "specific_heat_J_kgK":           {"min": 390,  "max": 410,  "source": "CRC Handbook"},
            "thermal_conductivity_W_mK":     {"min": 10,   "max": 12,   "source": "CRC Handbook"},
            "thermal_expansion_uK":          {"min": 7.2,  "max": 7.5,  "source": "CRC Handbook"},
            "electrical_resistivity_uohm_cm":{"min": 13,   "max": 21,   "source": "CRC Handbook"},
            "embodied_energy_MJ_kg":         {"min": 300,  "max": 700,  "source": "Bath ICE v3.0 (estimate)"},
            "co2_footprint_kg_kg":           {"min": 20,   "max": 50,   "source": "Bath ICE v3.0 (estimate)"},
        }
    },
    "mp-1219": {   # NbN
        "name": "Niobium nitride (NbN)",
        "short_name": "NbN",
        "family": "ceramics-technical",
        "subfamily": "nitride-ceramics",
        "applications": ["Superconducting single-photon detectors", "Josephson junctions", "Hard coatings"],
        "notes": "Superconducting below ~16 K — one of highest-Tc conventional superconductors. Hard refractory nitride.",
        "props": {
            "yield_strength_MPa":            {"min": 400,  "max": 700,  "source": "ASM EH Vol 4"},
            "fracture_toughness_MPa_sqrt_m": {"min": 2.0,  "max": 4.0,  "source": "ASM EH Vol 4"},
            "melting_point_C":               {"min": 2300, "max": 2400, "source": "CRC Handbook"},
            "thermal_conductivity_W_mK":     {"min": 4,    "max": 8,    "source": "CRC Handbook"},
            "thermal_expansion_uK":          {"min": 10,   "max": 12,   "source": "CRC Handbook"},
            "electrical_resistivity_uohm_cm":{"min": 54,   "max": 200,  "source": "CRC Handbook"},
        }
    },

    # ── Borides ────────────────────────────────────────────────────────────
    "mp-1013": {   # TiB2
        "name": "Titanium diboride (TiB₂)",
        "short_name": "TiB₂",
        "family": "ceramics-technical",
        "subfamily": "boride-ceramics",
        "applications": ["Molten aluminium-resistant crucibles", "Cutting tools", "Ballistic armour", "Electrical contacts"],
        "notes": "Unusually high electrical and thermal conductivity for a ceramic. Hard and refractory.",
        "props": {
            "yield_strength_MPa":            {"min": 300,  "max": 500,  "source": "ASM EH Vol 4"},
            "fracture_toughness_MPa_sqrt_m": {"min": 5.0,  "max": 6.5,  "source": "ASM EH Vol 4"},
            "melting_point_C":               {"min": 3225, "max": 3225, "source": "CRC Handbook"},
            "specific_heat_J_kgK":           {"min": 600,  "max": 650,  "source": "CRC Handbook"},
            "thermal_conductivity_W_mK":     {"min": 60,   "max": 96,   "source": "CRC Handbook"},
            "thermal_expansion_uK":          {"min": 6.4,  "max": 8.1,  "source": "CRC Handbook"},
            "electrical_resistivity_uohm_cm":{"min": 9,    "max": 15,   "source": "CRC Handbook"},
            "embodied_energy_MJ_kg":         {"min": 300,  "max": 700,  "source": "Bath ICE v3.0 (estimate)"},
            "co2_footprint_kg_kg":           {"min": 20,   "max": 50,   "source": "Bath ICE v3.0 (estimate)"},
        }
    },
    "mp-1550": {   # ZrB2
        "name": "Zirconium diboride (ZrB₂)",
        "short_name": "ZrB₂",
        "family": "ceramics-technical",
        "subfamily": "boride-ceramics",
        "applications": ["Ultra-high temperature ceramics (UHTC) for hypersonic vehicles", "Electrode materials", "Hard coatings"],
        "notes": "Stable to >2500°C. Key UHTC for hypersonic leading edges alongside HfB₂.",
        "props": {
            "yield_strength_MPa":            {"min": 200,  "max": 400,  "source": "ASM EH Vol 4"},
            "fracture_toughness_MPa_sqrt_m": {"min": 3.5,  "max": 5.0,  "source": "ASM EH Vol 4"},
            "melting_point_C":               {"min": 3245, "max": 3245, "source": "CRC Handbook"},
            "specific_heat_J_kgK":           {"min": 430,  "max": 450,  "source": "CRC Handbook"},
            "thermal_conductivity_W_mK":     {"min": 57,   "max": 75,   "source": "CRC Handbook"},
            "thermal_expansion_uK":          {"min": 5.9,  "max": 6.8,  "source": "CRC Handbook"},
            "electrical_resistivity_uohm_cm":{"min": 9,    "max": 11,   "source": "CRC Handbook"},
            "embodied_energy_MJ_kg":         {"min": 300,  "max": 700,  "source": "Bath ICE v3.0 (estimate)"},
            "co2_footprint_kg_kg":           {"min": 20,   "max": 50,   "source": "Bath ICE v3.0 (estimate)"},
        }
    },
    "mp-1966": {   # HfB2
        "name": "Hafnium diboride (HfB₂)",
        "short_name": "HfB₂",
        "family": "ceramics-technical",
        "subfamily": "boride-ceramics",
        "applications": ["Hypersonic leading edges (Mach 10+ re-entry)", "Plasma arc electrodes", "Ultra-high temperature ceramics"],
        "notes": "One of the densest UHTC materials. Critical for nose caps and wing leading edges of hypersonic vehicles.",
        "props": {
            "yield_strength_MPa":            {"min": 200,  "max": 380,  "source": "ASM EH Vol 4"},
            "fracture_toughness_MPa_sqrt_m": {"min": 3.0,  "max": 4.5,  "source": "ASM EH Vol 4"},
            "melting_point_C":               {"min": 3250, "max": 3380, "source": "CRC Handbook"},
            "specific_heat_J_kgK":           {"min": 240,  "max": 260,  "source": "CRC Handbook"},
            "thermal_conductivity_W_mK":     {"min": 60,   "max": 104,  "source": "CRC Handbook"},
            "thermal_expansion_uK":          {"min": 6.3,  "max": 7.6,  "source": "CRC Handbook"},
            "electrical_resistivity_uohm_cm":{"min": 10,   "max": 15,   "source": "CRC Handbook"},
            "embodied_energy_MJ_kg":         {"min": 400,  "max": 1000, "source": "Bath ICE v3.0 (estimate)"},
            "co2_footprint_kg_kg":           {"min": 28,   "max": 70,   "source": "Bath ICE v3.0 (estimate)"},
        }
    },

    # ── Silicides ──────────────────────────────────────────────────────────
    "mp-1174": {   # MoSi2
        "name": "Molybdenum disilicide (MoSi₂)",
        "short_name": "MoSi₂",
        "family": "ceramics-technical",
        "subfamily": "silicide-ceramics",
        "applications": ["High-temperature furnace heating elements (Kanthal Super)", "Gas turbine coatings", "MEMS devices"],
        "notes": "Metallic conductivity + self-healing SiO₂ scale at high T. Maximum use temperature ~1700°C.",
        "props": {
            "yield_strength_MPa":            {"min": 200,  "max": 400,  "source": "ASM EH Vol 4"},
            "fracture_toughness_MPa_sqrt_m": {"min": 2.0,  "max": 3.5,  "source": "ASM EH Vol 4"},
            "melting_point_C":               {"min": 2030, "max": 2030, "source": "CRC Handbook"},
            "specific_heat_J_kgK":           {"min": 435,  "max": 445,  "source": "CRC Handbook"},
            "thermal_conductivity_W_mK":     {"min": 52,   "max": 63,   "source": "CRC Handbook"},
            "thermal_expansion_uK":          {"min": 8.1,  "max": 8.5,  "source": "CRC Handbook"},
            "electrical_resistivity_uohm_cm":{"min": 21,   "max": 22,   "source": "CRC Handbook"},
            "embodied_energy_MJ_kg":         {"min": 200,  "max": 500,  "source": "Bath ICE v3.0 (estimate)"},
            "co2_footprint_kg_kg":           {"min": 14,   "max": 35,   "source": "Bath ICE v3.0 (estimate)"},
        }
    },

    # ── Semiconductors ─────────────────────────────────────────────────────
    "mp-66": {     # Diamond
        "name": "Diamond (C, cubic)",
        "short_name": "Diamond",
        "family": "ceramics-technical",
        "subfamily": "carbon-ceramics",
        "applications": ["Cutting tools (non-ferrous)", "Grinding/polishing abrasives", "Heat spreaders in electronics", "Optical windows (IR)"],
        "notes": "Hardest natural material, highest thermal conductivity of any solid (>2000 W/mK). Graphitises above ~1800°C in air.",
        "props": {
            "yield_strength_MPa":            {"min": 3000, "max": 5000, "source": "ASM EH Vol 4"},
            "fracture_toughness_MPa_sqrt_m": {"min": 3.0,  "max": 5.0,  "source": "ASM EH Vol 4"},
            "melting_point_C":               {"min": 4027, "max": 4027, "source": "CRC Handbook"},
            "specific_heat_J_kgK":           {"min": 510,  "max": 530,  "source": "CRC Handbook"},
            "thermal_conductivity_W_mK":     {"min": 1000, "max": 2500, "source": "CRC Handbook"},
            "thermal_expansion_uK":          {"min": 1.0,  "max": 1.3,  "source": "CRC Handbook"},
            "electrical_resistivity_uohm_cm":{"min": 1e13, "max": 1e17, "source": "CRC Handbook"},
            "embodied_energy_MJ_kg":         {"min": 5000, "max": 50000,"source": "Bath ICE v3.0 (estimate, synthetic CVD)"},
            "co2_footprint_kg_kg":           {"min": 300,  "max": 3000, "source": "Bath ICE v3.0 (estimate)"},
        }
    },
    "mp-32": {     # Ge
        "name": "Germanium (Ge)",
        "short_name": "Germanium",
        "family": "ceramics-technical",
        "subfamily": "semiconductors",
        "applications": ["IR optics (2–15 µm window)", "Transistors (legacy)", "Gamma-ray detector substrates", "SiGe solar cells"],
        "notes": "Transparent to thermal IR; used in FLIR camera lenses. Narrow bandgap (0.67 eV).",
        "props": {
            "yield_strength_MPa":            {"min": 80,   "max": 150,  "source": "ASM EH Vol 4"},
            "fracture_toughness_MPa_sqrt_m": {"min": 0.6,  "max": 0.8,  "source": "ASM EH Vol 4"},
            "melting_point_C":               {"min": 938,  "max": 938,  "source": "CRC Handbook"},
            "specific_heat_J_kgK":           {"min": 318,  "max": 322,  "source": "CRC Handbook"},
            "thermal_conductivity_W_mK":     {"min": 58,   "max": 62,   "source": "CRC Handbook"},
            "thermal_expansion_uK":          {"min": 5.7,  "max": 5.9,  "source": "CRC Handbook"},
            "electrical_resistivity_uohm_cm":{"min": 4.6e7,"max": 4.6e7,"source": "CRC Handbook"},
            "embodied_energy_MJ_kg":         {"min": 800,  "max": 2500, "source": "Bath ICE v3.0 (estimate)"},
            "co2_footprint_kg_kg":           {"min": 55,   "max": 170,  "source": "Bath ICE v3.0 (estimate)"},
        }
    },
    "mp-2534": {   # GaAs
        "name": "Gallium arsenide (GaAs)",
        "short_name": "GaAs",
        "family": "ceramics-technical",
        "subfamily": "semiconductors",
        "applications": ["High-frequency transistors (RF, microwave)", "Laser diodes", "Solar cells (record efficiency)", "LED pioneer"],
        "notes": "Direct bandgap (1.42 eV) — efficient light emitter unlike Si. High electron mobility (8500 cm²/V·s).",
        "props": {
            "yield_strength_MPa":            {"min": 70,   "max": 120,  "source": "ASM EH Vol 4"},
            "fracture_toughness_MPa_sqrt_m": {"min": 0.4,  "max": 0.6,  "source": "ASM EH Vol 4"},
            "melting_point_C":               {"min": 1238, "max": 1238, "source": "CRC Handbook"},
            "specific_heat_J_kgK":           {"min": 346,  "max": 352,  "source": "CRC Handbook"},
            "thermal_conductivity_W_mK":     {"min": 44,   "max": 48,   "source": "CRC Handbook"},
            "thermal_expansion_uK":          {"min": 5.8,  "max": 6.2,  "source": "CRC Handbook"},
            "electrical_resistivity_uohm_cm":{"min": 1e5,  "max": 1e9,  "source": "CRC Handbook"},
            "embodied_energy_MJ_kg":         {"min": 600,  "max": 2000, "source": "Bath ICE v3.0 (estimate)"},
            "co2_footprint_kg_kg":           {"min": 40,   "max": 130,  "source": "Bath ICE v3.0 (estimate)"},
        }
    },
    "mp-20351": {  # InP
        "name": "Indium phosphide (InP)",
        "short_name": "InP",
        "family": "ceramics-technical",
        "subfamily": "semiconductors",
        "applications": ["Fibre-optic laser diodes (1310/1550 nm)", "High-speed photonic ICs", "Solar cells", "THz devices"],
        "notes": "Direct bandgap (1.34 eV). Substrate for InGaAsP and InGaAs devices — critical for optical communications.",
        "props": {
            "yield_strength_MPa":            {"min": 60,   "max": 100,  "source": "ASM EH Vol 4"},
            "fracture_toughness_MPa_sqrt_m": {"min": 0.4,  "max": 0.7,  "source": "ASM EH Vol 4"},
            "melting_point_C":               {"min": 1062, "max": 1062, "source": "CRC Handbook"},
            "specific_heat_J_kgK":           {"min": 310,  "max": 320,  "source": "CRC Handbook"},
            "thermal_conductivity_W_mK":     {"min": 68,   "max": 72,   "source": "CRC Handbook"},
            "thermal_expansion_uK":          {"min": 4.5,  "max": 4.8,  "source": "CRC Handbook"},
            "embodied_energy_MJ_kg":         {"min": 600,  "max": 2000, "source": "Bath ICE v3.0 (estimate)"},
            "co2_footprint_kg_kg":           {"min": 40,   "max": 130,  "source": "Bath ICE v3.0 (estimate)"},
        }
    },

    # ── Intermetallics ─────────────────────────────────────────────────────
    "mp-1090": {   # NiAl
        "name": "Nickel aluminide (NiAl, B2 phase)",
        "short_name": "NiAl",
        "family": "metals",
        "subfamily": "intermetallics",
        "applications": ["Bond coat for thermal barrier coatings", "High-temperature oxidation-resistant components", "Research on ordered intermetallics"],
        "notes": "Ordered intermetallic — higher specific stiffness and strength at temperature than Ni superalloys, but brittle at RT.",
        "props": {
            "yield_strength_MPa":            {"min": 200,  "max": 800,  "source": "ASM EH Vol 2"},
            "fracture_toughness_MPa_sqrt_m": {"min": 5,    "max": 15,   "source": "ASM EH Vol 2"},
            "melting_point_C":               {"min": 1638, "max": 1638, "source": "CRC Handbook"},
            "specific_heat_J_kgK":           {"min": 500,  "max": 530,  "source": "CRC Handbook"},
            "thermal_conductivity_W_mK":     {"min": 72,   "max": 80,   "source": "CRC Handbook"},
            "thermal_expansion_uK":          {"min": 13.0, "max": 14.0, "source": "CRC Handbook"},
            "electrical_resistivity_uohm_cm":{"min": 25,   "max": 32,   "source": "CRC Handbook"},
            "embodied_energy_MJ_kg":         {"min": 130,  "max": 220,  "source": "Bath ICE v3.0 (estimate)"},
            "co2_footprint_kg_kg":           {"min": 9,    "max": 16,   "source": "Bath ICE v3.0 (estimate)"},
        }
    },
    "mp-2593": {   # Ni3Al
        "name": "Nickel aluminide (Ni₃Al, γ′ phase)",
        "short_name": "Ni₃Al (γ′)",
        "family": "metals",
        "subfamily": "intermetallics",
        "applications": ["Strengthening precipitate in Ni superalloys", "Structural intermetallic research", "Oxidation-resistant coatings"],
        "notes": "γ′ precipitate phase responsible for high-temperature strength in Ni-base superalloys. Yield strength increases with temperature up to ~800°C.",
        "props": {
            "yield_strength_MPa":            {"min": 180,  "max": 500,  "source": "ASM EH Vol 2"},
            "fracture_toughness_MPa_sqrt_m": {"min": 10,   "max": 25,   "source": "ASM EH Vol 2"},
            "melting_point_C":               {"min": 1385, "max": 1400, "source": "CRC Handbook"},
            "specific_heat_J_kgK":           {"min": 440,  "max": 460,  "source": "CRC Handbook"},
            "thermal_conductivity_W_mK":     {"min": 23,   "max": 30,   "source": "CRC Handbook"},
            "thermal_expansion_uK":          {"min": 12.5, "max": 13.5, "source": "CRC Handbook"},
            "embodied_energy_MJ_kg":         {"min": 130,  "max": 220,  "source": "Bath ICE v3.0 (estimate)"},
            "co2_footprint_kg_kg":           {"min": 9,    "max": 16,   "source": "Bath ICE v3.0 (estimate)"},
        }
    },

    # ── Refractory metals ──────────────────────────────────────────────────
    "mp-91": {     # W pure
        "name": "Tungsten (W, pure wrought)",
        "short_name": "Tungsten",
        "family": "metals",
        "subfamily": "refractory-metals",
        "applications": ["Incandescent lamp filaments", "X-ray tube anodes", "Furnace heating elements", "Kinetic energy penetrators"],
        "notes": "Highest melting point of all metals (3422°C). Very high density. Brittle below ~300°C (DBTT).",
        "props": {
            "yield_strength_MPa":            {"min": 500,  "max": 750,  "source": "ASM Handbook Vol 2"},
            "ultimate_strength_MPa":         {"min": 620,  "max": 950,  "source": "ASM Handbook Vol 2"},
            "fracture_toughness_MPa_sqrt_m": {"min": 20,   "max": 50,   "source": "ASM Handbook Vol 2"},
            "elongation":                    {"min": 0.02, "max": 0.25, "source": "ASM Handbook Vol 2"},
            "melting_point_C":               {"min": 3422, "max": 3422, "source": "CRC Handbook"},
            "specific_heat_J_kgK":           {"min": 134,  "max": 136,  "source": "CRC Handbook"},
            "thermal_conductivity_W_mK":     {"min": 170,  "max": 177,  "source": "CRC Handbook"},
            "thermal_expansion_uK":          {"min": 4.4,  "max": 4.6,  "source": "CRC Handbook"},
            "electrical_resistivity_uohm_cm":{"min": 5.3,  "max": 5.7,  "source": "CRC Handbook"},
            "embodied_energy_MJ_kg":         {"min": 600,  "max": 1200, "source": "Bath ICE v3.0"},
            "co2_footprint_kg_kg":           {"min": 40,   "max": 80,   "source": "Bath ICE v3.0"},
            "recycle_fraction":              {"min": 0.35, "max": 0.55, "source": "Bath ICE v3.0"},
        }
    },
    "mp-39": {     # Nb
        "name": "Niobium (Nb, pure)",
        "short_name": "Niobium",
        "family": "metals",
        "subfamily": "refractory-metals",
        "applications": ["Microalloying agent in high-strength steels", "Superconducting MRI magnets (Nb-Ti)", "Jet engine alloys", "Capacitor electrodes"],
        "notes": "Critical for high-strength low-alloy (HSLA) steels. Superconducting below 9.2 K (pure Nb).",
        "props": {
            "yield_strength_MPa":            {"min": 210,  "max": 320,  "source": "ASM Handbook Vol 2"},
            "ultimate_strength_MPa":         {"min": 290,  "max": 430,  "source": "ASM Handbook Vol 2"},
            "fracture_toughness_MPa_sqrt_m": {"min": 40,   "max": 80,   "source": "ASM Handbook Vol 2"},
            "elongation":                    {"min": 0.25, "max": 0.40, "source": "ASM Handbook Vol 2"},
            "melting_point_C":               {"min": 2477, "max": 2477, "source": "CRC Handbook"},
            "specific_heat_J_kgK":           {"min": 265,  "max": 270,  "source": "CRC Handbook"},
            "thermal_conductivity_W_mK":     {"min": 51,   "max": 54,   "source": "CRC Handbook"},
            "thermal_expansion_uK":          {"min": 7.2,  "max": 7.4,  "source": "CRC Handbook"},
            "electrical_resistivity_uohm_cm":{"min": 15,   "max": 16,   "source": "CRC Handbook"},
            "embodied_energy_MJ_kg":         {"min": 250,  "max": 500,  "source": "Bath ICE v3.0"},
            "co2_footprint_kg_kg":           {"min": 18,   "max": 35,   "source": "Bath ICE v3.0"},
            "recycle_fraction":              {"min": 0.30, "max": 0.50, "source": "Bath ICE v3.0"},
        }
    },
    "mp-72": {     # Ta
        "name": "Tantalum (Ta, pure)",
        "short_name": "Tantalum",
        "family": "metals",
        "subfamily": "refractory-metals",
        "applications": ["Electrolytic capacitors", "Chemical processing equipment", "Surgical implants", "Sputtering targets"],
        "notes": "Excellent corrosion resistance (comparable to glass). Critical for miniaturised capacitors in mobile devices.",
        "props": {
            "yield_strength_MPa":            {"min": 200,  "max": 400,  "source": "ASM Handbook Vol 2"},
            "ultimate_strength_MPa":         {"min": 270,  "max": 500,  "source": "ASM Handbook Vol 2"},
            "fracture_toughness_MPa_sqrt_m": {"min": 70,   "max": 100,  "source": "ASM Handbook Vol 2"},
            "elongation":                    {"min": 0.20, "max": 0.40, "source": "ASM Handbook Vol 2"},
            "melting_point_C":               {"min": 3017, "max": 3017, "source": "CRC Handbook"},
            "specific_heat_J_kgK":           {"min": 138,  "max": 142,  "source": "CRC Handbook"},
            "thermal_conductivity_W_mK":     {"min": 55,   "max": 58,   "source": "CRC Handbook"},
            "thermal_expansion_uK":          {"min": 6.3,  "max": 6.6,  "source": "CRC Handbook"},
            "electrical_resistivity_uohm_cm":{"min": 12.1, "max": 13.5, "source": "CRC Handbook"},
            "embodied_energy_MJ_kg":         {"min": 600,  "max": 1500, "source": "Bath ICE v3.0"},
            "co2_footprint_kg_kg":           {"min": 40,   "max": 100,  "source": "Bath ICE v3.0"},
            "recycle_fraction":              {"min": 0.25, "max": 0.45, "source": "Bath ICE v3.0"},
        }
    },
    "mp-8": {      # Re
        "name": "Rhenium (Re, pure)",
        "short_name": "Rhenium",
        "family": "metals",
        "subfamily": "refractory-metals",
        "applications": ["Jet engine single-crystal turbine blade alloy additions", "Thermocouple wire (W-Re)", "Catalysts for gasoline reforming"],
        "notes": "3rd highest melting point after W and Os. Critical rhenium addition (3–6%) enables 2nd/3rd gen Ni superalloys. Extremely scarce.",
        "props": {
            "yield_strength_MPa":            {"min": 550,  "max": 1100, "source": "ASM Handbook Vol 2"},
            "ultimate_strength_MPa":         {"min": 1040, "max": 1400, "source": "ASM Handbook Vol 2"},
            "fracture_toughness_MPa_sqrt_m": {"min": 20,   "max": 45,   "source": "ASM Handbook Vol 2"},
            "elongation":                    {"min": 0.10, "max": 0.25, "source": "ASM Handbook Vol 2"},
            "melting_point_C":               {"min": 3185, "max": 3185, "source": "CRC Handbook"},
            "specific_heat_J_kgK":           {"min": 136,  "max": 140,  "source": "CRC Handbook"},
            "thermal_conductivity_W_mK":     {"min": 47,   "max": 49,   "source": "CRC Handbook"},
            "thermal_expansion_uK":          {"min": 6.2,  "max": 6.4,  "source": "CRC Handbook"},
            "electrical_resistivity_uohm_cm":{"min": 17,   "max": 20,   "source": "CRC Handbook"},
            "embodied_energy_MJ_kg":         {"min": 5000, "max": 15000,"source": "Bath ICE v3.0 (estimate, by-product of Mo mining)"},
            "co2_footprint_kg_kg":           {"min": 350,  "max": 1000, "source": "Bath ICE v3.0 (estimate)"},
        }
    },
    "mp-33": {     # Ru
        "name": "Ruthenium (Ru, pure)",
        "short_name": "Ruthenium",
        "family": "metals",
        "subfamily": "precious-metals",
        "applications": ["Ni superalloy addition (strengthening)", "Electrical contacts", "Wear-resistant coatings", "Catalysts (ammonia synthesis)"],
        "notes": "Platinum group metal; often used as hardener in Pt/Pd alloys. Extremely hard for a metal.",
        "props": {
            "yield_strength_MPa":            {"min": 400,  "max": 700,  "source": "ASM Handbook Vol 2"},
            "ultimate_strength_MPa":         {"min": 500,  "max": 900,  "source": "ASM Handbook Vol 2"},
            "fracture_toughness_MPa_sqrt_m": {"min": 8,    "max": 20,   "source": "ASM Handbook Vol 2"},
            "elongation":                    {"min": 0.01, "max": 0.06, "source": "ASM Handbook Vol 2"},
            "melting_point_C":               {"min": 2334, "max": 2334, "source": "CRC Handbook"},
            "specific_heat_J_kgK":           {"min": 238,  "max": 242,  "source": "CRC Handbook"},
            "thermal_conductivity_W_mK":     {"min": 117,  "max": 120,  "source": "CRC Handbook"},
            "thermal_expansion_uK":          {"min": 6.4,  "max": 6.6,  "source": "CRC Handbook"},
            "electrical_resistivity_uohm_cm":{"min": 7.1,  "max": 7.6,  "source": "CRC Handbook"},
            "embodied_energy_MJ_kg":         {"min": 5000, "max": 30000,"source": "Bath ICE v3.0 (estimate)"},
            "co2_footprint_kg_kg":           {"min": 350,  "max": 2000, "source": "Bath ICE v3.0 (estimate)"},
            "recycle_fraction":              {"min": 0.50, "max": 0.80, "source": "Bath ICE v3.0"},
        }
    },
    "mp-101": {    # Ir
        "name": "Iridium (Ir, pure)",
        "short_name": "Iridium",
        "family": "metals",
        "subfamily": "precious-metals",
        "applications": ["Spark plug electrodes", "Crucibles for high-temperature crystal growth", "Satellite thruster nozzles", "International kilogram standard"],
        "notes": "Densest element with stable oxidation resistance. Former international kilogram prototype (IPK) is Pt-Ir alloy.",
        "props": {
            "yield_strength_MPa":            {"min": 700,  "max": 1100, "source": "ASM Handbook Vol 2"},
            "ultimate_strength_MPa":         {"min": 900,  "max": 1300, "source": "ASM Handbook Vol 2"},
            "fracture_toughness_MPa_sqrt_m": {"min": 5,    "max": 15,   "source": "ASM Handbook Vol 2"},
            "elongation":                    {"min": 0.01, "max": 0.06, "source": "ASM Handbook Vol 2"},
            "melting_point_C":               {"min": 2446, "max": 2446, "source": "CRC Handbook"},
            "specific_heat_J_kgK":           {"min": 130,  "max": 134,  "source": "CRC Handbook"},
            "thermal_conductivity_W_mK":     {"min": 147,  "max": 150,  "source": "CRC Handbook"},
            "thermal_expansion_uK":          {"min": 6.4,  "max": 6.5,  "source": "CRC Handbook"},
            "electrical_resistivity_uohm_cm":{"min": 5.1,  "max": 5.5,  "source": "CRC Handbook"},
            "embodied_energy_MJ_kg":         {"min": 5000, "max": 50000,"source": "Bath ICE v3.0 (estimate)"},
            "co2_footprint_kg_kg":           {"min": 350,  "max": 3500, "source": "Bath ICE v3.0 (estimate)"},
            "recycle_fraction":              {"min": 0.50, "max": 0.80, "source": "Bath ICE v3.0"},
        }
    },
}

# ── Target MP IDs to query ─────────────────────────────────────────────────
TARGET_IDS = list(SUPPLEMENTARY.keys())


def compute_E_from_K_G(K: float, G: float) -> float:
    """Voigt-Reuss-Hill Young's modulus from bulk K and shear G moduli (GPa)."""
    return 9 * K * G / (3 * K + G)


def fetch_mp_data(api_key: str) -> dict:
    """Fetch density + elasticity from Materials Project for all target IDs."""
    from mp_api.client import MPRester

    density_map: dict[str, float] = {}
    elastic_map: dict[str, tuple[float, float]] = {}  # id → (K_vrh, G_vrh)

    with MPRester(api_key) as mpr:
        print(f"Fetching summary (density) for {len(TARGET_IDS)} materials…")
        sdocs = mpr.materials.summary.search(
            material_ids=TARGET_IDS,
            fields=["material_id", "formula_pretty", "density"],
        )
        for d in sdocs:
            density_map[d.material_id] = d.density  # g/cm³

        print(f"Fetching elasticity for {len(TARGET_IDS)} materials…")
        edocs = mpr.materials.elasticity.search(
            material_ids=TARGET_IDS,
            fields=["material_id", "bulk_modulus", "shear_modulus"],
        )
        for d in edocs:
            if d.bulk_modulus and d.shear_modulus:
                elastic_map[d.material_id] = (d.bulk_modulus.vrh, d.shear_modulus.vrh)

    print(f"  Density available: {len(density_map)}/{len(TARGET_IDS)}")
    print(f"  Elasticity available: {len(elastic_map)}/{len(TARGET_IDS)}")
    return {"density": density_map, "elasticity": elastic_map}


def build_material_record(mp_id: str, mp_data: dict) -> Optional[dict]:
    supp = SUPPLEMENTARY[mp_id]
    density_gcm3 = mp_data["density"].get(mp_id)
    elastic = mp_data["elasticity"].get(mp_id)

    if density_gcm3 is None:
        print(f"  SKIP {mp_id}: no density from MP")
        return None

    density_kg_m3 = density_gcm3 * 1000

    props: dict = {
        "density_kg_m3": {
            "min": round(density_kg_m3 * 0.98, 0),
            "max": round(density_kg_m3 * 1.02, 0),
            "source": f"Materials Project {mp_id} (DFT)",
        }
    }

    if elastic:
        K, G = elastic
        E = compute_E_from_K_G(K, G)
        props["youngs_modulus_GPa"] = {
            "min": round(E * 0.93, 1),
            "max": round(E * 1.07, 1),
            "source": f"Materials Project {mp_id} (DFT, E = 9KG/(3K+G))",
        }

    # Merge supplementary props
    for k, v in supp["props"].items():
        props[k] = v

    mat_id = mp_id.replace("mp-", "") + "-" + supp["short_name"].lower()
    mat_id = (
        mat_id
        .replace("₂", "2").replace("₃", "3").replace("₄", "4")
        .replace("(", "").replace(")", "").replace(",", "")
        .replace("'", "").replace(" ", "-").replace("γ′", "gamma-prime")
        .replace("/", "-").strip("-")
    )
    # Sanitise to kebab-case
    import re
    mat_id = re.sub(r"[^a-z0-9-]", "", mat_id.lower())
    mat_id = re.sub(r"-+", "-", mat_id).strip("-")

    return {
        "id": mat_id,
        "name": supp["name"],
        "family": supp["family"],
        "short_name": supp["short_name"],
        "subfamily": supp["subfamily"],
        "applications": supp.get("applications", []),
        "notes": supp.get("notes", ""),
        "properties": props,
    }


def rebuild_materials_json():
    all_materials = []
    for p in sorted(MAT_DIR.glob("*.json")):
        with open(p) as f:
            all_materials.append(json.load(f))
    doc = {
        "count": len(all_materials),
        "source": "Ashby App A (6th ed., 2025) + ASM Handbooks + Bath ICE v3.0 + Materials Project API",
        "materials": all_materials,
    }
    with open(DATA_DIR / "materials.json", "w") as f:
        json.dump(doc, f, indent=2)
    print(f"Rebuilt materials.json — {len(all_materials)} materials total.")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--api-key", default=os.environ.get("MP_API_KEY", ""))
    args = parser.parse_args()

    if not args.api_key:
        print("ERROR: set MP_API_KEY env var or pass --api-key")
        sys.exit(1)

    mp_data = fetch_mp_data(args.api_key)

    existing_ids = {p.stem for p in MAT_DIR.glob("*.json")}
    added, skipped = 0, 0

    for mp_id in TARGET_IDS:
        rec = build_material_record(mp_id, mp_data)
        if rec is None:
            continue
        if rec["id"] in existing_ids:
            print(f"  SKIP (exists): {rec['id']}")
            skipped += 1
            continue
        path = MAT_DIR / f"{rec['id']}.json"
        with open(path, "w") as f:
            json.dump(rec, f, indent=2)
        print(f"  ADD: {rec['id']}  ({rec['name']})")
        added += 1

    print(f"\nAdded {added} new materials, skipped {skipped}.")
    rebuild_materials_json()


if __name__ == "__main__":
    main()
