#!/usr/bin/env python3
"""Build OpenChartMS material corpus from inline tabular data.

Source: Ashby, M.F. (2025) Materials Selection in Mechanical Design, 6th ed.,
Elsevier. Appendix A, Tables A.1-A.12.

Emits one JSON file per material under data/materials/ and a combined index
data/materials.json. Run from the repo root:

    python3 scripts/build_materials.py

Property keys must match data/schema.json. Each tuple is (min, max). For
single-valued sources (Tables A.11, A.12) we set min == max.
"""

from __future__ import annotations

import json
from pathlib import Path

SRC = "Ashby App A (6th ed., 2025)"
ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "data" / "materials"
OUT_INDEX = ROOT / "data" / "materials.json"


# fmt: off
MATERIALS = [
    # ============================================================
    # FERROUS METALS
    # ============================================================
    {
        "id": "cast-iron-ductile", "name": "Cast iron, ductile (nodular)", "short_name": "Cast iron (ductile)",
        "family": "metals", "subfamily": "ferrous-metals",
        "applications": ["Engine block castings", "Heavy machinery frames", "Wear-resistant components"],
        "props": {
            "density_kg_m3": (7100, 7300), "price_USD_kg": (0.40, 0.40),
            "youngs_modulus_GPa": (170, 180), "yield_strength_MPa": (250, 680),
            "ultimate_strength_MPa": (410, 830), "fracture_toughness_MPa_sqrt_m": (22, 54),
            "melting_point_C": (1100, 1200), "specific_heat_J_kgK": (460, 500),
            "thermal_conductivity_W_mK": (29, 44), "thermal_expansion_uK": (10, 13),
            "electrical_resistivity_uohm_cm": (49, 56),
            "embodied_energy_MJ_kg": (30, 30), "co2_footprint_kg_kg": (2.2, 2.2),
            "water_demand_L_kg": (45, 45), "recycle_fraction": (0.69, 0.69),
        },
    },
    {
        "id": "cast-iron-gray", "name": "Cast iron, gray", "short_name": "Cast iron (gray)",
        "family": "metals", "subfamily": "ferrous-metals",
        "applications": ["Engine castings", "Vibration-damped machine bases", "Cast cookware"],
        "props": {
            "density_kg_m3": (7100, 7300), "price_USD_kg": (0.36, 0.36),
            "youngs_modulus_GPa": (80, 140), "yield_strength_MPa": (140, 420),
            "ultimate_strength_MPa": (140, 450), "fracture_toughness_MPa_sqrt_m": (10, 24),
            "melting_point_C": (1100, 1400), "specific_heat_J_kgK": (430, 500),
            "thermal_conductivity_W_mK": (40, 72), "thermal_expansion_uK": (11, 13),
            "electrical_resistivity_uohm_cm": (62, 86),
            "embodied_energy_MJ_kg": (29, 29), "co2_footprint_kg_kg": (2.1, 2.1),
            "water_demand_L_kg": (45, 45), "recycle_fraction": (0.69, 0.69),
        },
    },
    {
        "id": "high-carbon-steel", "name": "High carbon steel", "short_name": "Steel (high C)",
        "family": "metals", "subfamily": "ferrous-metals",
        "applications": ["Wear-tolerant tooling", "Heavy springs", "Rail track and rolling stock"],
        "props": {
            "density_kg_m3": (7800, 7900), "price_USD_kg": (0.76, 0.76),
            "youngs_modulus_GPa": (200, 220), "yield_strength_MPa": (400, 1200),
            "ultimate_strength_MPa": (550, 1600), "fracture_toughness_MPa_sqrt_m": (27, 92),
            "melting_point_C": (1300, 1500), "specific_heat_J_kgK": (440, 510),
            "thermal_conductivity_W_mK": (47, 53), "thermal_expansion_uK": (11, 14),
            "electrical_resistivity_uohm_cm": (17, 20),
            "embodied_energy_MJ_kg": (32, 32), "co2_footprint_kg_kg": (2.4, 2.4),
            "water_demand_L_kg": (45, 45), "recycle_fraction": (0.42, 0.42),
            "recycle_energy_MJ_kg": (8.5, 8.5), "recycle_co2_kg_kg": (0.67, 0.67),
        },
    },
    {
        "id": "low-alloy-steel", "name": "Low alloy steel", "short_name": "Steel (low alloy)",
        "family": "metals", "subfamily": "ferrous-metals",
        "applications": ["Engineered springs", "Rolling-element bearings", "High-fatigue parts"],
        "props": {
            "density_kg_m3": (7800, 7900), "price_USD_kg": (0.84, 0.84),
            "youngs_modulus_GPa": (210, 220), "yield_strength_MPa": (400, 1500),
            "ultimate_strength_MPa": (550, 1800), "fracture_toughness_MPa_sqrt_m": (14, 200),
            "melting_point_C": (1400, 1500), "specific_heat_J_kgK": (410, 530),
            "thermal_conductivity_W_mK": (34, 55), "thermal_expansion_uK": (11, 14),
            "electrical_resistivity_uohm_cm": (15, 35),
            "embodied_energy_MJ_kg": (31, 31), "co2_footprint_kg_kg": (2.5, 2.5),
            "water_demand_L_kg": (49, 49), "recycle_fraction": (0.42, 0.42),
            "recycle_energy_MJ_kg": (9.0, 9.0), "recycle_co2_kg_kg": (0.65, 0.65),
        },
    },
    {
        "id": "low-carbon-steel", "name": "Low carbon steel", "short_name": "Steel (low C)",
        "family": "metals", "subfamily": "ferrous-metals",
        "applications": ["General structural shapes", "Automotive sheet stock", "Pressed containers"],
        "props": {
            "density_kg_m3": (7800, 7900), "price_USD_kg": (0.76, 0.76),
            "youngs_modulus_GPa": (200, 220), "yield_strength_MPa": (250, 400),
            "ultimate_strength_MPa": (350, 580), "fracture_toughness_MPa_sqrt_m": (41, 82),
            "melting_point_C": (1470, 1500), "specific_heat_J_kgK": (460, 510),
            "thermal_conductivity_W_mK": (49, 54), "thermal_expansion_uK": (12, 13),
            "electrical_resistivity_uohm_cm": (15, 20),
            "embodied_energy_MJ_kg": (31, 31), "co2_footprint_kg_kg": (2.3, 2.3),
            "water_demand_L_kg": (46, 46), "recycle_fraction": (0.42, 0.42),
            "recycle_energy_MJ_kg": (8.1, 8.1), "recycle_co2_kg_kg": (0.64, 0.64),
        },
    },
    {
        "id": "medium-carbon-steel", "name": "Medium carbon steel", "short_name": "Steel (med C)",
        "family": "metals", "subfamily": "ferrous-metals",
        "applications": ["Power-transmission components", "Hand-tool stock", "Quenched and tempered shafts"],
        "props": {
            "density_kg_m3": (7800, 7900), "price_USD_kg": (0.76, 0.76),
            "youngs_modulus_GPa": (200, 220), "yield_strength_MPa": (310, 900),
            "ultimate_strength_MPa": (410, 1200), "fracture_toughness_MPa_sqrt_m": (12, 92),
            "melting_point_C": (1400, 1500), "specific_heat_J_kgK": (440, 520),
            "thermal_conductivity_W_mK": (45, 55), "thermal_expansion_uK": (10, 14),
            "electrical_resistivity_uohm_cm": (15, 22),
            "embodied_energy_MJ_kg": (32, 32), "co2_footprint_kg_kg": (2.4, 2.4),
            "water_demand_L_kg": (47, 47), "recycle_fraction": (0.42, 0.42),
            "recycle_energy_MJ_kg": (8.5, 8.5), "recycle_co2_kg_kg": (0.67, 0.67),
        },
    },
    {
        "id": "stainless-steel", "name": "Stainless steel", "short_name": "Stainless steel",
        "family": "metals", "subfamily": "ferrous-metals",
        "applications": ["Food and pharma equipment", "Corrosion-resistant pipework", "Surgical instruments"],
        "props": {
            "density_kg_m3": (7600, 8100), "price_USD_kg": (3.6, 3.6),
            "youngs_modulus_GPa": (190, 210), "yield_strength_MPa": (170, 1000),
            "ultimate_strength_MPa": (480, 2200), "fracture_toughness_MPa_sqrt_m": (62, 150),
            "melting_point_C": (1350, 1400), "specific_heat_J_kgK": (450, 530),
            "thermal_conductivity_W_mK": (12, 24), "thermal_expansion_uK": (13, 20),
            "electrical_resistivity_uohm_cm": (64, 110),
            "embodied_energy_MJ_kg": (73, 73), "co2_footprint_kg_kg": (5.4, 5.4),
            "water_demand_L_kg": (130, 130), "recycle_fraction": (0.37, 0.37),
            "recycle_energy_MJ_kg": (16, 16), "recycle_co2_kg_kg": (1.2, 1.2),
        },
    },

    # ============================================================
    # NONFERROUS METALS
    # ============================================================
    {
        "id": "aluminum-alloys", "name": "Aluminum alloys", "short_name": "Al alloys",
        "family": "metals", "subfamily": "nonferrous-metals",
        "applications": ["Lightweight aerospace components", "Drawn beverage containers", "Building cladding"],
        "props": {
            "density_kg_m3": (2500, 2900), "price_USD_kg": (2.6, 2.6),
            "youngs_modulus_GPa": (68, 82), "yield_strength_MPa": (30, 500),
            "ultimate_strength_MPa": (58, 550), "fracture_toughness_MPa_sqrt_m": (22, 35),
            "melting_point_C": (470, 680), "specific_heat_J_kgK": (860, 990),
            "thermal_conductivity_W_mK": (76, 240), "thermal_expansion_uK": (21, 24),
            "electrical_resistivity_uohm_cm": (3.8, 6),
            "embodied_energy_MJ_kg": (190, 190), "co2_footprint_kg_kg": (12, 12),
            "water_demand_L_kg": (1000, 1000), "recycle_fraction": (0.43, 0.43),
            "recycle_energy_MJ_kg": (33, 33), "recycle_co2_kg_kg": (2.6, 2.6),
        },
    },
    {
        "id": "copper-alloys", "name": "Copper alloys", "short_name": "Cu alloys",
        "family": "metals", "subfamily": "nonferrous-metals",
        "applications": ["Power and electronics conductors", "Heat-exchange coils", "Decorative brasswork"],
        "props": {
            "density_kg_m3": (8900, 8900), "price_USD_kg": (5.6, 5.6),
            "youngs_modulus_GPa": (110, 150), "yield_strength_MPa": (30, 500),
            "ultimate_strength_MPa": (100, 550), "fracture_toughness_MPa_sqrt_m": (30, 90),
            "melting_point_C": (980, 1100), "specific_heat_J_kgK": (370, 390),
            "thermal_conductivity_W_mK": (160, 390), "thermal_expansion_uK": (17, 18),
            "electrical_resistivity_uohm_cm": (1.7, 5),
            "embodied_energy_MJ_kg": (59, 59), "co2_footprint_kg_kg": (3.6, 3.6),
            "water_demand_L_kg": (310, 310), "recycle_fraction": (0.43, 0.43),
            "recycle_energy_MJ_kg": (13, 13), "recycle_co2_kg_kg": (1.1, 1.1),
        },
    },
    {
        "id": "lead-alloys", "name": "Lead alloys", "short_name": "Pb alloys",
        "family": "metals", "subfamily": "nonferrous-metals",
        "applications": ["Radiation shielding", "Solder alloys", "Lead-acid battery plates"],
        "props": {
            "density_kg_m3": (10000, 11000), "price_USD_kg": (3.9, 3.9),
            "youngs_modulus_GPa": (13, 15), "yield_strength_MPa": (8, 14),
            "ultimate_strength_MPa": (12, 20), "fracture_toughness_MPa_sqrt_m": (5, 15),
            "melting_point_C": (320, 330), "specific_heat_J_kgK": (120, 150),
            "thermal_conductivity_W_mK": (22, 36), "thermal_expansion_uK": (18, 32),
            "electrical_resistivity_uohm_cm": (15, 22),
            "embodied_energy_MJ_kg": (32, 32), "co2_footprint_kg_kg": (2.6, 2.6),
            "water_demand_L_kg": (480, 480), "recycle_fraction": (0.72, 0.72),
            "recycle_energy_MJ_kg": (8.6, 8.6), "recycle_co2_kg_kg": (0.67, 0.67),
        },
    },
    {
        "id": "magnesium-alloys", "name": "Magnesium alloys", "short_name": "Mg alloys",
        "family": "metals", "subfamily": "nonferrous-metals",
        "applications": ["Lightweight die castings", "Power-tool housings", "Aerospace and motorsport parts"],
        "props": {
            "density_kg_m3": (1700, 2000), "price_USD_kg": (3.4, 3.4),
            "youngs_modulus_GPa": (42, 47), "yield_strength_MPa": (70, 400),
            "ultimate_strength_MPa": (190, 480), "fracture_toughness_MPa_sqrt_m": (12, 18),
            "melting_point_C": (450, 650), "specific_heat_J_kgK": (960, 1100),
            "thermal_conductivity_W_mK": (50, 160), "thermal_expansion_uK": (25, 28),
            "electrical_resistivity_uohm_cm": (5.5, 15),
            "embodied_energy_MJ_kg": (320, 320), "co2_footprint_kg_kg": (45, 45),
            "water_demand_L_kg": (980, 980), "recycle_fraction": (0.39, 0.39),
            "recycle_energy_MJ_kg": (49, 49), "recycle_co2_kg_kg": (3.8, 3.8),
        },
    },
    {
        "id": "nickel-alloys", "name": "Nickel alloys", "short_name": "Ni alloys",
        "family": "metals", "subfamily": "nonferrous-metals",
        "applications": ["High-temperature turbine blades", "Chemical plant equipment", "Thermocouple wires"],
        "props": {
            "density_kg_m3": (8800, 9000), "price_USD_kg": (15, 15),
            "youngs_modulus_GPa": (190, 220), "yield_strength_MPa": (70, 1100),
            "ultimate_strength_MPa": (350, 1200), "fracture_toughness_MPa_sqrt_m": (80, 110),
            "melting_point_C": (1400, 1500), "specific_heat_J_kgK": (450, 460),
            "thermal_conductivity_W_mK": (67, 91), "thermal_expansion_uK": (12, 14),
            "electrical_resistivity_uohm_cm": (8, 10),
            "embodied_energy_MJ_kg": (220, 220), "co2_footprint_kg_kg": (12, 12),
            "water_demand_L_kg": (260, 260), "recycle_fraction": (0.24, 0.24),
            "recycle_energy_MJ_kg": (37, 37), "recycle_co2_kg_kg": (2.9, 2.9),
        },
    },
    {
        "id": "titanium-alloys", "name": "Titanium alloys", "short_name": "Ti alloys",
        "family": "metals", "subfamily": "nonferrous-metals",
        "applications": ["Aerospace airframe parts", "Biocompatible implants", "High-strength corrosion-resistant components"],
        "props": {
            "density_kg_m3": (4400, 4800), "price_USD_kg": (24, 24),
            "youngs_modulus_GPa": (90, 120), "yield_strength_MPa": (250, 1200),
            "ultimate_strength_MPa": (300, 1600), "fracture_toughness_MPa_sqrt_m": (14, 120),
            "melting_point_C": (1500, 1700), "specific_heat_J_kgK": (520, 600),
            "thermal_conductivity_W_mK": (7, 14), "thermal_expansion_uK": (7.9, 11),
            "electrical_resistivity_uohm_cm": (100, 170),
            "embodied_energy_MJ_kg": (620, 620), "co2_footprint_kg_kg": (36, 36),
            "water_demand_L_kg": (290, 290), "recycle_fraction": (0.23, 0.23),
            "recycle_energy_MJ_kg": (81, 81), "recycle_co2_kg_kg": (6.4, 6.4),
        },
    },
    {
        "id": "tungsten-alloys", "name": "Tungsten alloys", "short_name": "W alloys",
        "family": "metals", "subfamily": "nonferrous-metals",
        "applications": ["Dense counterweights", "High-temperature electrodes", "Radiation shielding"],
        "props": {
            "density_kg_m3": (10800, 20000), "price_USD_kg": (62, 62),
            "youngs_modulus_GPa": (310, 380), "yield_strength_MPa": (530, 800),
            "ultimate_strength_MPa": (720, 1500), "fracture_toughness_MPa_sqrt_m": (50, 60),
            "melting_point_C": (3200, 3400), "specific_heat_J_kgK": (130, 140),
            "thermal_conductivity_W_mK": (100, 140), "thermal_expansion_uK": (4.5, 6),
            "electrical_resistivity_uohm_cm": (10, 14),
            "embodied_energy_MJ_kg": (550, 550), "co2_footprint_kg_kg": (36, 36),
            "water_demand_L_kg": (160, 160), "recycle_fraction": (0.36, 0.36),
            "recycle_energy_MJ_kg": (75, 75), "recycle_co2_kg_kg": (5.9, 5.9),
        },
    },
    {
        "id": "zinc-alloys", "name": "Zinc alloys", "short_name": "Zn alloys",
        "family": "metals", "subfamily": "nonferrous-metals",
        "applications": ["Low-temperature die castings", "Sacrificial coatings", "Hardware fittings"],
        "props": {
            "density_kg_m3": (5000, 7000), "price_USD_kg": (3.4, 3.4),
            "youngs_modulus_GPa": (68, 95), "yield_strength_MPa": (80, 450),
            "ultimate_strength_MPa": (140, 520), "fracture_toughness_MPa_sqrt_m": (10, 100),
            "melting_point_C": (370, 490), "specific_heat_J_kgK": (410, 540),
            "thermal_conductivity_W_mK": (100, 140), "thermal_expansion_uK": (23, 28),
            "electrical_resistivity_uohm_cm": (5.4, 7.2),
            "embodied_energy_MJ_kg": (52, 52), "co2_footprint_kg_kg": (4, 4),
            "water_demand_L_kg": (380, 380), "recycle_fraction": (0.22, 0.22),
            "recycle_energy_MJ_kg": (12, 12), "recycle_co2_kg_kg": (0.97, 0.97),
        },
    },

    # ============================================================
    # GLASSES
    # ============================================================
    {
        "id": "borosilicate-glass", "name": "Borosilicate glass", "short_name": "Borosilicate",
        "family": "glasses",
        "applications": ["Thermal-shock-resistant labware", "Lighting envelopes", "Cookware"],
        "props": {
            "density_kg_m3": (2200, 2300), "price_USD_kg": (5.4, 5.4),
            "youngs_modulus_GPa": (61, 64), "yield_strength_MPa": (22, 32),
            "ultimate_strength_MPa": (22, 32), "fracture_toughness_MPa_sqrt_m": (0.5, 0.7),
            "melting_point_C": (450, 600), "specific_heat_J_kgK": (760, 800),
            "thermal_conductivity_W_mK": (1, 1.3), "thermal_expansion_uK": (3.2, 4),
            "dielectric_constant": (4.7, 6),
            "embodied_energy_MJ_kg": (29, 29), "co2_footprint_kg_kg": (1.7, 1.7),
            "water_demand_L_kg": (15, 15), "recycle_fraction": (0.24, 0.24),
            "recycle_energy_MJ_kg": (24, 24), "recycle_co2_kg_kg": (1.2, 1.2),
        },
    },
    {
        "id": "silica-glass", "name": "Silica glass", "short_name": "Silica glass",
        "family": "glasses",
        "applications": ["Fused-quartz crucibles", "UV-transparent optics", "High-temperature furnace components"],
        "props": {
            "density_kg_m3": (2200, 2200), "price_USD_kg": (7.4, 7.4),
            "youngs_modulus_GPa": (68, 74), "yield_strength_MPa": (45, 160),
            "ultimate_strength_MPa": (45, 160), "fracture_toughness_MPa_sqrt_m": (0.6, 0.8),
            "melting_point_C": (960, 1600), "specific_heat_J_kgK": (680, 730),
            "thermal_conductivity_W_mK": (1.4, 1.5), "thermal_expansion_uK": (0.55, 0.75),
            "dielectric_constant": (3.7, 3.9),
            "embodied_energy_MJ_kg": (39, 39), "co2_footprint_kg_kg": (2.3, 2.3),
            "water_demand_L_kg": (1.4, 1.4), "recycle_fraction": (0.25, 0.25),
            "recycle_energy_MJ_kg": (32, 32), "recycle_co2_kg_kg": (1.6, 1.6),
        },
    },
    {
        "id": "soda-lime-glass", "name": "Soda-lime glass", "short_name": "Soda-lime",
        "family": "glasses",
        "applications": ["Architectural glazing", "Container glass", "Display screens"],
        "props": {
            "density_kg_m3": (2400, 2500), "price_USD_kg": (1.5, 1.5),
            "youngs_modulus_GPa": (68, 72), "yield_strength_MPa": (30, 35),
            "ultimate_strength_MPa": (31, 35), "fracture_toughness_MPa_sqrt_m": (0.55, 0.7),
            "melting_point_C": (440, 590), "specific_heat_J_kgK": (850, 950),
            "thermal_conductivity_W_mK": (2.4, 2.5), "thermal_expansion_uK": (1.4, 1.7),
            "dielectric_constant": (7, 7.6),
            "embodied_energy_MJ_kg": (11, 11), "co2_footprint_kg_kg": (0.76, 0.76),
            "water_demand_L_kg": (14, 14), "recycle_fraction": (0.24, 0.24),
            "recycle_energy_MJ_kg": (8.7, 8.7), "recycle_co2_kg_kg": (0.53, 0.53),
        },
    },

    # ============================================================
    # TECHNICAL CERAMICS
    # ============================================================
    {
        "id": "alumina", "name": "Alumina", "short_name": "Al2O3",
        "family": "ceramics-technical",
        "applications": ["Insulator substrates", "Wear-tool inserts", "Spark-plug bodies"],
        "props": {
            "density_kg_m3": (3800, 4000), "price_USD_kg": (25, 25),
            "youngs_modulus_GPa": (340, 390), "yield_strength_MPa": (350, 590),
            "ultimate_strength_MPa": (350, 590), "fracture_toughness_MPa_sqrt_m": (3.3, 4.8),
            "melting_point_C": (2000, 2100), "specific_heat_J_kgK": (790, 820),
            "thermal_conductivity_W_mK": (26, 39), "thermal_expansion_uK": (7, 7.9),
            "dielectric_constant": (6.5, 6.8),
            "embodied_energy_MJ_kg": (52, 52), "co2_footprint_kg_kg": (2.8, 2.8),
            "water_demand_L_kg": (55, 55),
        },
    },
    {
        "id": "aluminum-nitride", "name": "Aluminum nitride", "short_name": "AlN",
        "family": "ceramics-technical",
        "applications": ["High-conductivity electronic substrates", "RF-package heat spreaders"],
        "props": {
            "density_kg_m3": (3300, 3300), "price_USD_kg": (130, 130),
            "youngs_modulus_GPa": (300, 350), "yield_strength_MPa": (300, 350),
            "ultimate_strength_MPa": (300, 350), "fracture_toughness_MPa_sqrt_m": (2.5, 3.4),
            "melting_point_C": (2400, 2500), "specific_heat_J_kgK": (780, 820),
            "thermal_conductivity_W_mK": (140, 200), "thermal_expansion_uK": (4.9, 5.5),
            "dielectric_constant": (8.3, 9.3),
            "embodied_energy_MJ_kg": (230, 230), "co2_footprint_kg_kg": (13, 13),
            "water_demand_L_kg": (240, 240),
        },
    },
    {
        "id": "silicon", "name": "Silicon", "short_name": "Si",
        "family": "ceramics-technical",
        "applications": ["Semiconductor wafers", "MEMS devices", "Solar cells"],
        "props": {
            "density_kg_m3": (2300, 2400), "price_USD_kg": (11, 11),
            "youngs_modulus_GPa": (140, 160), "yield_strength_MPa": (160, 180),
            "ultimate_strength_MPa": (160, 180), "fracture_toughness_MPa_sqrt_m": (0.83, 0.94),
            "melting_point_C": (1400, 1400), "specific_heat_J_kgK": (670, 720),
            "thermal_conductivity_W_mK": (140, 150), "thermal_expansion_uK": (2, 3.2),
            "dielectric_constant": (11, 12),
            "embodied_energy_MJ_kg": (120, 120), "co2_footprint_kg_kg": (5, 5),
            "water_demand_L_kg": (24, 24),
        },
    },
    {
        "id": "silicon-carbide", "name": "Silicon carbide", "short_name": "SiC",
        "family": "ceramics-technical",
        "applications": ["High-temperature shaft seals", "Cutting and grinding abrasives", "Light armor plate"],
        "props": {
            "density_kg_m3": (3100, 3200), "price_USD_kg": (16, 16),
            "youngs_modulus_GPa": (400, 460), "yield_strength_MPa": (400, 610),
            "ultimate_strength_MPa": (400, 610), "fracture_toughness_MPa_sqrt_m": (3, 5.6),
            "melting_point_C": (2200, 2500), "specific_heat_J_kgK": (660, 800),
            "thermal_conductivity_W_mK": (80, 130), "thermal_expansion_uK": (4, 4.8),
            "dielectric_constant": (6.3, 9),
            "embodied_energy_MJ_kg": (170, 170), "co2_footprint_kg_kg": (7.2, 7.2),
            "water_demand_L_kg": (58, 58),
        },
    },
    {
        "id": "tungsten-carbide", "name": "Tungsten carbide", "short_name": "WC",
        "family": "ceramics-technical",
        "applications": ["Carbide cutting inserts", "Rock-drilling bits", "Wear plates"],
        "props": {
            "density_kg_m3": (10500, 10600), "price_USD_kg": (22, 22),
            "youngs_modulus_GPa": (630, 700), "yield_strength_MPa": (340, 550),
            "ultimate_strength_MPa": (370, 550), "fracture_toughness_MPa_sqrt_m": (2, 3.8),
            "melting_point_C": (2800, 2900), "specific_heat_J_kgK": (180, 290),
            "thermal_conductivity_W_mK": (55, 88), "thermal_expansion_uK": (5.2, 7.1),
            "electrical_resistivity_uohm_cm": (20, 100),
            "embodied_energy_MJ_kg": (580, 580), "co2_footprint_kg_kg": (38, 38),
            "water_demand_L_kg": (83, 83), "recycle_fraction": (0.31, 0.31),
        },
    },

    # ============================================================
    # NON-TECHNICAL CERAMICS
    # ============================================================
    {
        "id": "brick", "name": "Brick", "short_name": "Brick",
        "family": "ceramics-nontechnical",
        "applications": ["Masonry construction", "Facade cladding"],
        "props": {
            "density_kg_m3": (1600, 2100), "price_USD_kg": (1.0, 1.0),
            "youngs_modulus_GPa": (15, 30), "yield_strength_MPa": (5, 14),
            "ultimate_strength_MPa": (5, 14), "fracture_toughness_MPa_sqrt_m": (1, 2),
            "melting_point_C": (930, 1200), "specific_heat_J_kgK": (750, 850),
            "thermal_conductivity_W_mK": (0.46, 0.73), "thermal_expansion_uK": (5, 8),
            "embodied_energy_MJ_kg": (3, 3), "co2_footprint_kg_kg": (0.24, 0.24),
            "water_demand_L_kg": (5.5, 5.5), "recycle_fraction": (0.17, 0.17),
        },
    },
    {
        "id": "concrete", "name": "Concrete", "short_name": "Concrete",
        "family": "ceramics-nontechnical",
        "applications": ["Civil structural construction", "Foundations and slabs"],
        "props": {
            "density_kg_m3": (2300, 2600), "price_USD_kg": (0.05, 0.05),
            "youngs_modulus_GPa": (15, 25), "yield_strength_MPa": (1, 3),
            "ultimate_strength_MPa": (1, 1.5), "fracture_toughness_MPa_sqrt_m": (0.35, 0.45),
            "melting_point_C": (930, 1200), "specific_heat_J_kgK": (840, 1100),
            "thermal_conductivity_W_mK": (0.8, 2.4), "thermal_expansion_uK": (6, 13),
            "embodied_energy_MJ_kg": (0.82, 0.82), "co2_footprint_kg_kg": (0.12, 0.12),
            "water_demand_L_kg": (3.4, 3.4), "recycle_fraction": (0.13, 0.13),
            "recycle_energy_MJ_kg": (0.8, 0.8), "recycle_co2_kg_kg": (0.07, 0.07),
        },
    },
    {
        "id": "stone", "name": "Stone", "short_name": "Stone",
        "family": "ceramics-nontechnical",
        "applications": ["Cut stone facades", "Monumental construction", "Pavers and tiles"],
        "props": {
            "density_kg_m3": (2000, 2600), "price_USD_kg": (0.5, 0.5),
            "youngs_modulus_GPa": (20, 60), "yield_strength_MPa": (2, 25),
            "ultimate_strength_MPa": (2, 25), "fracture_toughness_MPa_sqrt_m": (0.7, 1.4),
            "melting_point_C": (1200, 1400), "specific_heat_J_kgK": (840, 920),
            "thermal_conductivity_W_mK": (5.4, 6), "thermal_expansion_uK": (3.7, 6.3),
            "embodied_energy_MJ_kg": (1, 1), "co2_footprint_kg_kg": (0.06, 0.06),
            "water_demand_L_kg": (3.4, 3.4),
        },
    },

    # ============================================================
    # ELASTOMERS
    # ============================================================
    {
        "id": "butyl-rubber", "name": "Butyl rubber", "short_name": "Butyl rubber",
        "family": "elastomers",
        "applications": ["Inner tubes and tire liners", "Vibration mounts", "Chemical-resistant tubing"],
        "props": {
            "density_kg_m3": (900, 920), "price_USD_kg": (2.3, 2.3),
            "youngs_modulus_GPa": (0.001, 0.002), "yield_strength_MPa": (2, 3),
            "ultimate_strength_MPa": (5, 10), "fracture_toughness_MPa_sqrt_m": (0.07, 0.1),
            "glass_temperature_C": (-73, -63), "specific_heat_J_kgK": (1800, 2500),
            "thermal_conductivity_W_mK": (0.08, 0.1), "thermal_expansion_uK": (120, 300),
            "embodied_energy_MJ_kg": (95, 95), "co2_footprint_kg_kg": (4.4, 4.4),
            "water_demand_L_kg": (110, 110), "recycle_fraction": (0.028, 0.028),
        },
    },
    {
        "id": "eva", "name": "Ethylene vinyl acetate", "short_name": "EVA",
        "family": "elastomers",
        "applications": ["Athletic-shoe midsoles", "Flexible film packaging", "Adhesive hot-melt formulations"],
        "props": {
            "density_kg_m3": (950, 960), "price_USD_kg": (1.8, 1.8),
            "youngs_modulus_GPa": (0.01, 0.04), "yield_strength_MPa": (12, 18),
            "ultimate_strength_MPa": (16, 20), "fracture_toughness_MPa_sqrt_m": (0.5, 0.7),
            "glass_temperature_C": (-73, -23), "specific_heat_J_kgK": (2000, 2200),
            "thermal_conductivity_W_mK": (0.3, 0.4), "thermal_expansion_uK": (160, 190),
            "embodied_energy_MJ_kg": (79, 79), "co2_footprint_kg_kg": (2.1, 2.1),
            "water_demand_L_kg": (2.8, 2.8), "recycle_fraction": (0.001, 0.001),
        },
    },
    {
        "id": "natural-rubber", "name": "Natural rubber", "short_name": "NR",
        "family": "elastomers",
        "applications": ["Tire treads and inner tubes", "Latex gloves and films", "Vibration-damping mounts"],
        "props": {
            "density_kg_m3": (920, 930), "price_USD_kg": (1.6, 1.6),
            "youngs_modulus_GPa": (0.0015, 0.0025), "yield_strength_MPa": (20, 30),
            "ultimate_strength_MPa": (22, 32), "fracture_toughness_MPa_sqrt_m": (0.15, 0.25),
            "glass_temperature_C": (-78, -63), "specific_heat_J_kgK": (1800, 2500),
            "thermal_conductivity_W_mK": (0.1, 0.14), "thermal_expansion_uK": (150, 450),
            "embodied_energy_MJ_kg": (78, 78), "co2_footprint_kg_kg": (2, 2),
            "water_demand_L_kg": (17000, 17000), "recycle_fraction": (0.001, 0.001),
        },
    },
    {
        "id": "polychloroprene", "name": "Polychloroprene (Neoprene)", "short_name": "Neoprene",
        "family": "elastomers",
        "applications": ["Marine and outdoor seals", "Wetsuit material", "Oil-resistant gaskets"],
        "props": {
            "density_kg_m3": (1200, 1300), "price_USD_kg": (4.7, 4.7),
            "youngs_modulus_GPa": (0.0007, 0.002), "yield_strength_MPa": (3.4, 24),
            "ultimate_strength_MPa": (3.4, 24), "fracture_toughness_MPa_sqrt_m": (0.1, 0.3),
            "glass_temperature_C": (-48, -43), "specific_heat_J_kgK": (2000, 2200),
            "thermal_conductivity_W_mK": (0.1, 0.12), "thermal_expansion_uK": (580, 610),
            "embodied_energy_MJ_kg": (64, 64), "co2_footprint_kg_kg": (1.5, 1.5),
            "water_demand_L_kg": (220, 220), "recycle_fraction": (0.014, 0.014),
        },
    },
    {
        "id": "silicone-elastomers", "name": "Silicone elastomers", "short_name": "Silicone",
        "family": "elastomers",
        "applications": ["Medical implant components", "Electronics potting compounds", "High-temperature seals"],
        "props": {
            "density_kg_m3": (1300, 1800), "price_USD_kg": (5.4, 5.4),
            "youngs_modulus_GPa": (0.005, 0.022), "yield_strength_MPa": (2.4, 5.5),
            "ultimate_strength_MPa": (2.4, 5.5), "fracture_toughness_MPa_sqrt_m": (0.033, 0.5),
            "glass_temperature_C": (-120, -73), "specific_heat_J_kgK": (1100, 1300),
            "thermal_conductivity_W_mK": (0.3, 1), "thermal_expansion_uK": (250, 300),
            "embodied_energy_MJ_kg": (120, 120), "co2_footprint_kg_kg": (6.5, 6.5),
            "water_demand_L_kg": (3.3, 3.3), "recycle_fraction": (0.001, 0.001),
        },
    },

    # ============================================================
    # THERMOPLASTICS
    # ============================================================
    {
        "id": "abs", "name": "Acrylonitrile butadiene styrene (ABS)", "short_name": "ABS",
        "family": "polymers", "subfamily": "thermoplastics",
        "applications": ["Injection-molded enclosures", "Automotive trim", "Consumer-product housings"],
        "props": {
            "density_kg_m3": (1000, 1200), "price_USD_kg": (1.9, 1.9),
            "youngs_modulus_GPa": (1.1, 2.9), "yield_strength_MPa": (19, 51),
            "ultimate_strength_MPa": (28, 55), "fracture_toughness_MPa_sqrt_m": (1.2, 4.3),
            "glass_temperature_C": (88, 130), "specific_heat_J_kgK": (1400, 1900),
            "thermal_conductivity_W_mK": (0.19, 0.34), "thermal_expansion_uK": (85, 230),
            "embodied_energy_MJ_kg": (92, 92), "co2_footprint_kg_kg": (3.4, 3.4),
            "water_demand_L_kg": (170, 170), "recycle_fraction": (0.04, 0.04),
            "recycle_energy_MJ_kg": (32, 32), "recycle_co2_kg_kg": (1.2, 1.2),
        },
    },
    {
        "id": "polyamide", "name": "Polyamides (nylons, PA)", "short_name": "Nylon",
        "family": "polymers", "subfamily": "thermoplastics",
        "applications": ["Wear-resistant gears and bearings", "Textile fibers", "Engineered plumbing fittings"],
        "props": {
            "density_kg_m3": (1100, 1100), "price_USD_kg": (5.3, 5.3),
            "youngs_modulus_GPa": (2.6, 3.2), "yield_strength_MPa": (50, 95),
            "ultimate_strength_MPa": (90, 170), "fracture_toughness_MPa_sqrt_m": (2.2, 5.6),
            "melting_point_C": (44, 56), "specific_heat_J_kgK": (1600, 1700),
            "thermal_conductivity_W_mK": (0.23, 0.25), "thermal_expansion_uK": (140, 150),
            "embodied_energy_MJ_kg": (140, 140), "co2_footprint_kg_kg": (7, 7),
            "water_demand_L_kg": (380, 380), "recycle_fraction": (0.007, 0.007),
            "recycle_energy_MJ_kg": (43, 43), "recycle_co2_kg_kg": (3.0, 3.0),
        },
    },
    {
        "id": "polycarbonate", "name": "Polycarbonate (PC)", "short_name": "PC",
        "family": "polymers", "subfamily": "thermoplastics",
        "applications": ["Impact-resistant glazing", "Protective eyewear", "Medical-device housings"],
        "props": {
            "density_kg_m3": (1100, 1200), "price_USD_kg": (3.4, 3.4),
            "youngs_modulus_GPa": (2, 2.4), "yield_strength_MPa": (59, 70),
            "ultimate_strength_MPa": (60, 72), "fracture_toughness_MPa_sqrt_m": (2.1, 4.6),
            "glass_temperature_C": (140, 200), "specific_heat_J_kgK": (1500, 1600),
            "thermal_conductivity_W_mK": (0.19, 0.22), "thermal_expansion_uK": (120, 140),
            "embodied_energy_MJ_kg": (110, 110), "co2_footprint_kg_kg": (4.8, 4.8),
            "water_demand_L_kg": (170, 170), "recycle_fraction": (0.007, 0.007),
            "recycle_energy_MJ_kg": (37, 37), "recycle_co2_kg_kg": (2.4, 2.4),
        },
    },
    {
        "id": "peek", "name": "Polyetheretherketone (PEEK)", "short_name": "PEEK",
        "family": "polymers", "subfamily": "thermoplastics",
        "applications": ["High-temperature engineered components", "Aerospace bearings", "Surgical implant subassemblies"],
        "props": {
            "density_kg_m3": (1300, 1300), "price_USD_kg": (92, 92),
            "youngs_modulus_GPa": (3.8, 4.5), "yield_strength_MPa": (65, 95),
            "ultimate_strength_MPa": (70, 100), "fracture_toughness_MPa_sqrt_m": (2.7, 4.3),
            "melting_point_C": (140, 200), "specific_heat_J_kgK": (1400, 1500),
            "thermal_conductivity_W_mK": (0.24, 0.26), "thermal_expansion_uK": (72, 190),
            "embodied_energy_MJ_kg": (300, 300), "co2_footprint_kg_kg": (17, 17),
            "water_demand_L_kg": (920, 920), "recycle_fraction": (0.014, 0.014),
            "recycle_energy_MJ_kg": (100, 100), "recycle_co2_kg_kg": (5.7, 5.7),
        },
    },
    {
        "id": "polyethylene", "name": "Polyethylene (PE)", "short_name": "PE",
        "family": "polymers", "subfamily": "thermoplastics",
        "applications": ["Flexible packaging films", "Blow-molded bottles", "Joint-replacement bearings"],
        "props": {
            "density_kg_m3": (940, 960), "price_USD_kg": (1.6, 1.6),
            "youngs_modulus_GPa": (0.62, 0.9), "yield_strength_MPa": (18, 29),
            "ultimate_strength_MPa": (21, 45), "fracture_toughness_MPa_sqrt_m": (1.4, 1.7),
            "melting_point_C": (120, 130), "specific_heat_J_kgK": (1800, 1900),
            "thermal_conductivity_W_mK": (0.4, 0.44), "thermal_expansion_uK": (130, 200),
            "embodied_energy_MJ_kg": (75, 75), "co2_footprint_kg_kg": (1.9, 1.9),
            "water_demand_L_kg": (58, 58), "recycle_fraction": (0.084, 0.084),
            "recycle_energy_MJ_kg": (27, 27), "recycle_co2_kg_kg": (0.94, 0.94),
        },
    },
    {
        "id": "pet", "name": "Polyethylene terephthalate (PET)", "short_name": "PET",
        "family": "polymers", "subfamily": "thermoplastics",
        "applications": ["Beverage bottles", "Industrial fibers and tapes", "Food-grade packaging"],
        "props": {
            "density_kg_m3": (1300, 1400), "price_USD_kg": (1.4, 1.4),
            "youngs_modulus_GPa": (2.8, 4.1), "yield_strength_MPa": (57, 62),
            "ultimate_strength_MPa": (48, 72), "fracture_toughness_MPa_sqrt_m": (4.5, 5.5),
            "melting_point_C": (68, 80), "specific_heat_J_kgK": (1400, 1500),
            "thermal_conductivity_W_mK": (0.14, 0.15), "thermal_expansion_uK": (110, 120),
            "embodied_energy_MJ_kg": (73, 73), "co2_footprint_kg_kg": (2.7, 2.7),
            "water_demand_L_kg": (130, 130), "recycle_fraction": (0.21, 0.21),
            "recycle_energy_MJ_kg": (28, 28), "recycle_co2_kg_kg": (1.5, 1.5),
        },
    },
    {
        "id": "pmma", "name": "Polymethyl methacrylate (PMMA)", "short_name": "PMMA",
        "family": "polymers", "subfamily": "thermoplastics",
        "applications": ["Optical-quality glazing", "Display covers", "Light-pipe components"],
        "props": {
            "density_kg_m3": (1200, 1200), "price_USD_kg": (4.3, 4.3),
            "youngs_modulus_GPa": (2.2, 3.8), "yield_strength_MPa": (54, 72),
            "ultimate_strength_MPa": (48, 80), "fracture_toughness_MPa_sqrt_m": (0.7, 1.6),
            "glass_temperature_C": (85, 160), "specific_heat_J_kgK": (1500, 1600),
            "thermal_conductivity_W_mK": (0.084, 0.25), "thermal_expansion_uK": (72, 160),
            "refractive_index": (1.49, 1.49),
            "embodied_energy_MJ_kg": (100, 100), "co2_footprint_kg_kg": (4.9, 4.9),
            "water_demand_L_kg": (76, 76), "recycle_fraction": (0.007, 0.007),
            "recycle_energy_MJ_kg": (38, 38), "recycle_co2_kg_kg": (2.2, 2.2),
        },
    },
    {
        "id": "pom", "name": "Polyoxymethylene (Acetal, POM)", "short_name": "POM",
        "family": "polymers", "subfamily": "thermoplastics",
        "applications": ["Precision gears and snaps", "Small mechanism parts", "Appliance internals"],
        "props": {
            "density_kg_m3": (1400, 1400), "price_USD_kg": (2.9, 2.9),
            "youngs_modulus_GPa": (2.5, 5), "yield_strength_MPa": (49, 72),
            "ultimate_strength_MPa": (60, 90), "fracture_toughness_MPa_sqrt_m": (1.7, 4.2),
            "melting_point_C": (160, 180), "specific_heat_J_kgK": (1400, 1400),
            "thermal_conductivity_W_mK": (0.22, 0.35), "thermal_expansion_uK": (76, 200),
            "embodied_energy_MJ_kg": (86, 86), "co2_footprint_kg_kg": (3.2, 3.2),
            "water_demand_L_kg": (250, 250), "recycle_fraction": (0.001, 0.001),
            "recycle_energy_MJ_kg": (36, 36), "recycle_co2_kg_kg": (1.8, 1.8),
        },
    },
    {
        "id": "polypropylene", "name": "Polypropylene (PP)", "short_name": "PP",
        "family": "polymers", "subfamily": "thermoplastics",
        "applications": ["Living-hinge containers", "Chemical-resistant piping", "Synthetic fibers"],
        "props": {
            "density_kg_m3": (890, 910), "price_USD_kg": (1.4, 1.4),
            "youngs_modulus_GPa": (0.9, 1.55), "yield_strength_MPa": (21, 37),
            "ultimate_strength_MPa": (28, 41), "fracture_toughness_MPa_sqrt_m": (3, 4.5),
            "melting_point_C": (150, 170), "specific_heat_J_kgK": (1900, 2000),
            "thermal_conductivity_W_mK": (0.11, 0.17), "thermal_expansion_uK": (120, 180),
            "embodied_energy_MJ_kg": (80, 80), "co2_footprint_kg_kg": (2.9, 2.9),
            "water_demand_L_kg": (39, 39), "recycle_fraction": (0.055, 0.055),
            "recycle_energy_MJ_kg": (23, 23), "recycle_co2_kg_kg": (0.99, 0.99),
        },
    },
    {
        "id": "polystyrene", "name": "Polystyrene (PS)", "short_name": "PS",
        "family": "polymers", "subfamily": "thermoplastics",
        "applications": ["Disposable packaging", "Optical clarity products", "Foamed insulation board"],
        "props": {
            "density_kg_m3": (1000, 1100), "price_USD_kg": (2.2, 2.2),
            "youngs_modulus_GPa": (1.2, 2.6), "yield_strength_MPa": (29, 56),
            "ultimate_strength_MPa": (36, 57), "fracture_toughness_MPa_sqrt_m": (0.7, 1.1),
            "glass_temperature_C": (74, 110), "specific_heat_J_kgK": (1700, 1800),
            "thermal_conductivity_W_mK": (0.12, 0.13), "thermal_expansion_uK": (90, 150),
            "embodied_energy_MJ_kg": (82, 82), "co2_footprint_kg_kg": (2.5, 2.5),
            "water_demand_L_kg": (150, 150), "recycle_fraction": (0.06, 0.06),
            "recycle_energy_MJ_kg": (29, 29), "recycle_co2_kg_kg": (1.3, 1.3),
        },
    },
    {
        "id": "ptfe", "name": "Polytetrafluoroethylene (PTFE/Teflon)", "short_name": "PTFE",
        "family": "polymers", "subfamily": "thermoplastics",
        "applications": ["Low-friction bearings", "Chemical-process gaskets", "Wire insulation"],
        "props": {
            "density_kg_m3": (2100, 2200), "price_USD_kg": (13, 13),
            "youngs_modulus_GPa": (0.4, 0.55), "yield_strength_MPa": (15, 25),
            "ultimate_strength_MPa": (20, 30), "fracture_toughness_MPa_sqrt_m": (1.3, 1.8),
            "melting_point_C": (110, 120), "specific_heat_J_kgK": (1000, 1100),
            "thermal_conductivity_W_mK": (0.24, 0.26), "thermal_expansion_uK": (130, 220),
            "embodied_energy_MJ_kg": (300, 300), "co2_footprint_kg_kg": (16, 16),
            "water_demand_L_kg": (450, 450), "recycle_fraction": (0.007, 0.007),
            "recycle_energy_MJ_kg": (39, 39), "recycle_co2_kg_kg": (1.9, 1.9),
        },
    },
    {
        "id": "pvc", "name": "Polyvinylchloride (PVC)", "short_name": "PVC",
        "family": "polymers", "subfamily": "thermoplastics",
        "applications": ["Plumbing and drainage pipe", "Window-frame extrusions", "Flexible film products"],
        "props": {
            "density_kg_m3": (1300, 1600), "price_USD_kg": (2.6, 2.6),
            "youngs_modulus_GPa": (2.1, 4.1), "yield_strength_MPa": (35, 52),
            "ultimate_strength_MPa": (41, 65), "fracture_toughness_MPa_sqrt_m": (1.5, 5.1),
            "glass_temperature_C": (75, 100), "specific_heat_J_kgK": (1400, 1400),
            "thermal_conductivity_W_mK": (0.15, 0.29), "thermal_expansion_uK": (100, 150),
            "embodied_energy_MJ_kg": (65, 65), "co2_footprint_kg_kg": (2.7, 2.7),
            "water_demand_L_kg": (190, 190), "recycle_fraction": (0.015, 0.015),
            "recycle_energy_MJ_kg": (23, 23), "recycle_co2_kg_kg": (1.1, 1.1),
        },
    },

    # ============================================================
    # THERMOSETS
    # ============================================================
    {
        "id": "epoxy", "name": "Epoxies", "short_name": "Epoxy",
        "family": "polymers", "subfamily": "thermosets",
        "applications": ["Structural adhesives", "Composite-matrix resin", "Encapsulation compounds"],
        "props": {
            "density_kg_m3": (1100, 1400), "price_USD_kg": (2.6, 2.6),
            "youngs_modulus_GPa": (2.4, 3.1), "yield_strength_MPa": (36, 72),
            "ultimate_strength_MPa": (45, 90), "fracture_toughness_MPa_sqrt_m": (0.4, 2.2),
            "glass_temperature_C": (67, 170), "specific_heat_J_kgK": (1500, 1700),
            "thermal_conductivity_W_mK": (0.18, 0.5), "thermal_expansion_uK": (58, 120),
            "embodied_energy_MJ_kg": (130, 130), "co2_footprint_kg_kg": (6.6, 6.6),
            "water_demand_L_kg": (28, 28), "recycle_fraction": (0.007, 0.007),
        },
    },
    {
        "id": "phenolic", "name": "Phenolics", "short_name": "Phenolic",
        "family": "polymers", "subfamily": "thermosets",
        "applications": ["Heat-resistant electrical fittings", "Press-molded handles", "Wood-product adhesives"],
        "props": {
            "density_kg_m3": (1200, 1300), "price_USD_kg": (1.8, 1.8),
            "youngs_modulus_GPa": (2.8, 4.8), "yield_strength_MPa": (28, 50),
            "ultimate_strength_MPa": (35, 62), "fracture_toughness_MPa_sqrt_m": (0.79, 1.2),
            "glass_temperature_C": (170, 270), "specific_heat_J_kgK": (1500, 1500),
            "thermal_conductivity_W_mK": (0.14, 0.15), "thermal_expansion_uK": (120, 120),
            "embodied_energy_MJ_kg": (77, 77), "co2_footprint_kg_kg": (1.9, 1.9),
            "water_demand_L_kg": (51, 51), "recycle_fraction": (0.007, 0.007),
        },
    },
    {
        "id": "polyester-thermoset", "name": "Polyester (thermoset)", "short_name": "Polyester",
        "family": "polymers", "subfamily": "thermosets",
        "applications": ["Marine and recreational composites", "Glass-fiber bodywork", "Architectural panels"],
        "props": {
            "density_kg_m3": (1000, 1400), "price_USD_kg": (4.1, 4.1),
            "youngs_modulus_GPa": (2.1, 4.4), "yield_strength_MPa": (33, 40),
            "ultimate_strength_MPa": (41, 90), "fracture_toughness_MPa_sqrt_m": (1.1, 1.7),
            "glass_temperature_C": (150, 210), "specific_heat_J_kgK": (1500, 1600),
            "thermal_conductivity_W_mK": (0.29, 0.3), "thermal_expansion_uK": (99, 180),
            "embodied_energy_MJ_kg": (71, 71), "co2_footprint_kg_kg": (2.5, 2.5),
            "water_demand_L_kg": (200, 200), "recycle_fraction": (0.001, 0.001),
        },
    },

    # ============================================================
    # FOAMS
    # ============================================================
    {
        "id": "flexible-foam-ld", "name": "Flexible polymer foam (low density)", "short_name": "Flex foam LD",
        "family": "foams",
        "applications": ["Cushion stuffing", "Protective-packaging inserts", "Bedding fillers"],
        "props": {
            "density_kg_m3": (38, 70), "price_USD_kg": (2.7, 2.7),
            "youngs_modulus_GPa": (0.001, 0.003), "yield_strength_MPa": (0.02, 0.3),
            "ultimate_strength_MPa": (0.24, 2.4), "fracture_toughness_MPa_sqrt_m": (0.015, 0.05),
            "glass_temperature_C": (-110, -13), "specific_heat_J_kgK": (1800, 2300),
            "thermal_conductivity_W_mK": (0.04, 0.059), "thermal_expansion_uK": (120, 220),
            "embodied_energy_MJ_kg": (90, 90), "co2_footprint_kg_kg": (3.2, 3.2),
            "water_demand_L_kg": (170, 170), "recycle_fraction": (0.084, 0.084),
        },
    },
    {
        "id": "flexible-foam-md", "name": "Flexible polymer foam (medium density)", "short_name": "Flex foam MD",
        "family": "foams",
        "applications": ["Upholstery foam", "Acoustic-damping pads", "Filtration sponges"],
        "props": {
            "density_kg_m3": (70, 120), "price_USD_kg": (2.7, 2.7),
            "youngs_modulus_GPa": (0.004, 0.012), "yield_strength_MPa": (0.048, 0.7),
            "ultimate_strength_MPa": (0.43, 3), "fracture_toughness_MPa_sqrt_m": (0.03, 0.09),
            "glass_temperature_C": (-110, -13), "specific_heat_J_kgK": (1800, 2300),
            "thermal_conductivity_W_mK": (0.041, 0.078), "thermal_expansion_uK": (120, 220),
            "embodied_energy_MJ_kg": (90, 90), "co2_footprint_kg_kg": (3.2, 3.2),
            "water_demand_L_kg": (170, 170),
        },
    },
    {
        "id": "rigid-foam-hd", "name": "Rigid polymer foam (high density)", "short_name": "Rigid foam HD",
        "family": "foams",
        "applications": ["Building-board insulation", "Structural sandwich cores", "Buoyancy modules"],
        "props": {
            "density_kg_m3": (170, 470), "price_USD_kg": (15, 15),
            "youngs_modulus_GPa": (0.2, 0.48), "yield_strength_MPa": (0.8, 12),
            "ultimate_strength_MPa": (1.2, 12), "fracture_toughness_MPa_sqrt_m": (0.024, 0.09),
            "glass_temperature_C": (67, 170), "specific_heat_J_kgK": (1000, 1900),
            "thermal_conductivity_W_mK": (0.034, 0.063), "thermal_expansion_uK": (22, 70),
            "embodied_energy_MJ_kg": (80, 80), "co2_footprint_kg_kg": (5.1, 5.1),
            "water_demand_L_kg": (450, 450),
        },
    },
    {
        "id": "rigid-foam-ld", "name": "Rigid polymer foam (low density)", "short_name": "Rigid foam LD",
        "family": "foams",
        "applications": ["Cold-storage insulation", "Shock-absorbing voids", "Foam-board cores"],
        "props": {
            "density_kg_m3": (36, 70), "price_USD_kg": (15, 15),
            "youngs_modulus_GPa": (0.023, 0.08), "yield_strength_MPa": (0.3, 1.7),
            "ultimate_strength_MPa": (0.45, 2.3), "fracture_toughness_MPa_sqrt_m": (0.002, 0.02),
            "glass_temperature_C": (67, 170), "specific_heat_J_kgK": (1100, 1900),
            "thermal_conductivity_W_mK": (0.023, 0.04), "thermal_expansion_uK": (20, 80),
            "embodied_energy_MJ_kg": (80, 80), "co2_footprint_kg_kg": (5.1, 5.1),
            "water_demand_L_kg": (450, 450),
        },
    },

    # ============================================================
    # NATURAL MATERIALS
    # ============================================================
    {
        "id": "cork", "name": "Cork", "short_name": "Cork",
        "family": "natural",
        "applications": ["Sealing closures", "Acoustic-damping panels", "Flooring underlay"],
        "props": {
            "density_kg_m3": (120, 240), "price_USD_kg": (6, 6),
            "youngs_modulus_GPa": (0.013, 0.05), "yield_strength_MPa": (0.3, 1.5),
            "ultimate_strength_MPa": (0.5, 2.5), "fracture_toughness_MPa_sqrt_m": (0.05, 0.1),
            "thermal_conductivity_W_mK": (0.035, 0.05), "thermal_expansion_uK": (130, 230),
        },
    },
    {
        "id": "paper", "name": "Paper and cardboard", "short_name": "Paper",
        "family": "natural",
        "applications": ["Box and bag stock", "Print substrates", "Honeycomb cores"],
        "props": {
            "density_kg_m3": (480, 860), "price_USD_kg": (1.2, 1.2),
            "youngs_modulus_GPa": (3, 8.9), "yield_strength_MPa": (15, 34),
            "ultimate_strength_MPa": (23, 51), "fracture_toughness_MPa_sqrt_m": (6, 10),
            "melting_point_C": (47, 67), "specific_heat_J_kgK": (1300, 1400),
            "thermal_conductivity_W_mK": (0.06, 0.17), "thermal_expansion_uK": (5, 20),
            "embodied_energy_MJ_kg": (28, 28), "co2_footprint_kg_kg": (0.71, 0.71),
            "water_demand_L_kg": (1700, 1700), "recycle_fraction": (0.72, 0.72),
            "recycle_energy_MJ_kg": (22, 22), "recycle_co2_kg_kg": (0.7, 0.7),
        },
    },
    {
        "id": "softwood", "name": "Softwood", "short_name": "Softwood",
        "family": "natural",
        "applications": ["Framing lumber", "Joinery and trim", "Pulp and pallets"],
        "props": {
            "density_kg_m3": (660, 800), "price_USD_kg": (0.6, 0.6),
            "youngs_modulus_GPa": (6, 20), "yield_strength_MPa": (30, 70),
            "ultimate_strength_MPa": (60, 100), "fracture_toughness_MPa_sqrt_m": (5, 9),
            "melting_point_C": (77, 100), "specific_heat_J_kgK": (1700, 1700),
            "thermal_conductivity_W_mK": (0.31, 0.38), "thermal_expansion_uK": (2, 11),
            "embodied_energy_MJ_kg": (11, 11), "co2_footprint_kg_kg": (0.37, 0.37),
            "water_demand_L_kg": (700, 700), "recycle_fraction": (0.09, 0.09),
        },
    },
    {
        "id": "hardwood", "name": "Hardwood", "short_name": "Hardwood",
        "family": "natural",
        "applications": ["Furniture stock", "Cabinet and flooring boards", "Marine planking"],
        "props": {
            "density_kg_m3": (600, 800), "price_USD_kg": (2, 2),
            "youngs_modulus_GPa": (6, 20), "yield_strength_MPa": (30, 70),
            "ultimate_strength_MPa": (60, 100), "fracture_toughness_MPa_sqrt_m": (5, 9),
            "melting_point_C": (77, 100), "specific_heat_J_kgK": (1700, 1700),
            "thermal_conductivity_W_mK": (0.31, 0.38), "thermal_expansion_uK": (2, 11),
            "embodied_energy_MJ_kg": (12, 12), "co2_footprint_kg_kg": (0.6, 0.6),
            "water_demand_L_kg": (700, 700), "recycle_fraction": (0.09, 0.09),
        },
    },

    # ============================================================
    # COMPOSITES
    # ============================================================
    {
        "id": "cfrp", "name": "Carbon-fiber reinforced polymer (CFRP)", "short_name": "CFRP",
        "family": "composites",
        "applications": ["Aerospace primary structure", "Sporting-good composite frames", "High-performance pressure vessels"],
        "props": {
            "density_kg_m3": (1500, 1600), "price_USD_kg": (36, 36),
            "youngs_modulus_GPa": (69, 150), "yield_strength_MPa": (550, 1100),
            "ultimate_strength_MPa": (550, 1100), "fracture_toughness_MPa_sqrt_m": (6.1, 20),
            "glass_temperature_C": (100, 180), "specific_heat_J_kgK": (900, 1000),
            "thermal_conductivity_W_mK": (1.3, 2.6), "thermal_expansion_uK": (1, 4),
            "embodied_energy_MJ_kg": (475, 475), "co2_footprint_kg_kg": (34.5, 34.5),
            "water_demand_L_kg": (1400, 1400),
        },
    },
    {
        "id": "gfrp", "name": "Glass-fiber reinforced polymer (GFRP)", "short_name": "GFRP",
        "family": "composites",
        "applications": ["Marine hull laminates", "Lightweight enclosures", "Wind-turbine blade skins"],
        "props": {
            "density_kg_m3": (1800, 2000), "price_USD_kg": (27, 27),
            "youngs_modulus_GPa": (15, 28), "yield_strength_MPa": (110, 190),
            "ultimate_strength_MPa": (140, 240), "fracture_toughness_MPa_sqrt_m": (7, 23),
            "glass_temperature_C": (150, 200), "specific_heat_J_kgK": (1000, 1200),
            "thermal_conductivity_W_mK": (0.4, 0.55), "thermal_expansion_uK": (8.6, 33),
            "embodied_energy_MJ_kg": (160, 160), "co2_footprint_kg_kg": (10, 10),
            "water_demand_L_kg": (160, 160),
        },
    },
]
# fmt: on


def emit(material: dict) -> dict:
    """Convert internal (min, max) tuples to schema-compliant range objects."""
    out = {
        "id": material["id"],
        "name": material["name"],
        "family": material["family"],
    }
    if "short_name" in material:
        out["short_name"] = material["short_name"]
    if "subfamily" in material:
        out["subfamily"] = material["subfamily"]
    out["applications"] = material["applications"]
    if "notes" in material:
        out["notes"] = material["notes"]
    out["properties"] = {
        key: {"min": float(lo), "max": float(hi), "source": SRC}
        for key, (lo, hi) in material["props"].items()
    }
    return out


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    seen_ids: set[str] = set()
    index_entries = []

    for raw in MATERIALS:
        record = emit(raw)
        mid = record["id"]
        if mid in seen_ids:
            print(f"ERROR: duplicate id {mid!r}", flush=True)
            return 1
        seen_ids.add(mid)

        path = OUT_DIR / f"{mid}.json"
        with path.open("w") as f:
            json.dump(record, f, indent=2)
            f.write("\n")
        index_entries.append(record)

    with OUT_INDEX.open("w") as f:
        json.dump(
            {
                "count": len(index_entries),
                "source": SRC,
                "materials": index_entries,
            },
            f,
            indent=2,
        )
        f.write("\n")

    print(f"Wrote {len(index_entries)} materials to {OUT_DIR}/")
    print(f"Wrote combined index to {OUT_INDEX}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
