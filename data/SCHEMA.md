# Material Data Schema

Each material is one JSON file under `data/materials/`, named `{id}.json`.

## Record shape

```json
{
  "id": "kebab-case-id",
  "name": "Human-readable name",
  "family": "metals | ceramics-technical | ceramics-nontechnical | glasses | polymers | elastomers | composites | foams | natural",
  "subfamily": "optional finer grouping (e.g., 'ferrous-metals', 'thermoplastics')",
  "short_name": "Short label for charts (e.g., 'Steel')",
  "applications": ["string", "..."],
  "properties": {
    "<property_key>": {
      "min": <number>,
      "max": <number>,
      "source": "optional citation string"
    }
  },
  "notes": "optional free-text notes"
}
```

## Property keys & SI units

All values stored in the listed SI unit. Display layer can convert.

| Key | Unit | Notes |
|---|---|---|
| `density_kg_m3` | kg/m³ | App A.2 |
| `price_USD_kg` | USD/kg | App A.2 |
| `youngs_modulus_GPa` | GPa | App A.3 |
| `yield_strength_MPa` | MPa | App A.3; flexural strength for ceramics, tear strength for elastomers |
| `ultimate_strength_MPa` | MPa | App A.4 |
| `fracture_toughness_MPa_sqrt_m` | MPa·m^(1/2) | App A.4 |
| `elongation` | dimensionless (0–1) | strain at failure |
| `loss_coefficient` | dimensionless | App; damping η at 20°C |
| `melting_point_C` | °C | App A.5 |
| `glass_temperature_C` | °C | polymers only; App A.5 |
| `specific_heat_J_kgK` | J/(kg·K) | App A.5 |
| `thermal_conductivity_W_mK` | W/(m·K) | App A.6 |
| `thermal_expansion_uK` | 10⁻⁶ /K | App A.6 |
| `electrical_resistivity_uohm_cm` | µΩ·cm | App A.7 (metals only in Phase 1) |
| `dielectric_constant` | dimensionless | App A.7 |
| `refractive_index` | dimensionless | App A.10 |
| `embodied_energy_MJ_kg` | MJ/kg | App A.11 |
| `co2_footprint_kg_kg` | kg CO₂ / kg | App A.11 |
| `water_demand_L_kg` | L/kg | App A.11 |
| `recycle_fraction` | dimensionless (0–1) | App A.12 |
| `recycle_energy_MJ_kg` | MJ/kg | App A.12 |
| `recycle_co2_kg_kg` | kg CO₂ / kg | App A.12 |

## Validation rules

- Every record must have `id`, `name`, `family`, and at least `density_kg_m3` + `youngs_modulus_GPa`.
- For every property entry: `min <= max`, both positive (except where physically meaningful otherwise).
- `id` must match filename and be globally unique.
- `family` must match the controlled vocabulary above.

CI will enforce these via `data/schema.json` (JSON Schema, to be written).

## Data sources & precedence

When values disagree:
1. Ashby, *Materials Selection in Mechanical Design* (6th ed., 2025) Appendix A — primary
2. Cambridge Materials Data Book (2011) — secondary, free PDF
3. MechaniCalc / NIST / FreeCAD material XML — tertiary, cite explicitly

Always record `source` in the property entry when overriding the primary.
