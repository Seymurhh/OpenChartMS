export interface Range {
  min: number;
  max: number;
  source?: string;
}

export type PropertyKey =
  | 'density_kg_m3'
  | 'price_USD_kg'
  | 'youngs_modulus_GPa'
  | 'yield_strength_MPa'
  | 'ultimate_strength_MPa'
  | 'fracture_toughness_MPa_sqrt_m'
  | 'elongation'
  | 'loss_coefficient'
  | 'melting_point_C'
  | 'glass_temperature_C'
  | 'specific_heat_J_kgK'
  | 'thermal_conductivity_W_mK'
  | 'thermal_expansion_uK'
  | 'electrical_resistivity_uohm_cm'
  | 'dielectric_constant'
  | 'refractive_index'
  | 'embodied_energy_MJ_kg'
  | 'co2_footprint_kg_kg'
  | 'water_demand_L_kg'
  | 'recycle_fraction'
  | 'recycle_energy_MJ_kg'
  | 'recycle_co2_kg_kg';

export type FamilyId =
  | 'metals'
  | 'ceramics-technical'
  | 'ceramics-nontechnical'
  | 'glasses'
  | 'polymers'
  | 'elastomers'
  | 'composites'
  | 'foams'
  | 'natural';

export interface Material {
  id: string;
  name: string;
  short_name?: string;
  family: FamilyId;
  subfamily?: string;
  applications: string[];
  notes?: string;
  properties: Partial<Record<PropertyKey, Range>>;
}

export interface Family {
  id: FamilyId;
  label: string;
  color: string;
  description: string;
}

export interface PropertyMeta {
  key: PropertyKey;
  label: string;
  unit: string;
  symbol?: string;
}

export const PROPERTY_META: Record<PropertyKey, PropertyMeta> = {
  density_kg_m3: { key: 'density_kg_m3', label: 'Density', unit: 'kg/m³', symbol: 'ρ' },
  price_USD_kg: { key: 'price_USD_kg', label: 'Price', unit: 'USD/kg', symbol: 'Cm' },
  youngs_modulus_GPa: { key: 'youngs_modulus_GPa', label: "Young's modulus", unit: 'GPa', symbol: 'E' },
  yield_strength_MPa: { key: 'yield_strength_MPa', label: 'Yield strength', unit: 'MPa', symbol: 'σy' },
  ultimate_strength_MPa: { key: 'ultimate_strength_MPa', label: 'Ultimate strength', unit: 'MPa', symbol: 'σu' },
  fracture_toughness_MPa_sqrt_m: { key: 'fracture_toughness_MPa_sqrt_m', label: 'Fracture toughness', unit: 'MPa·m^0.5', symbol: 'K1c' },
  elongation: { key: 'elongation', label: 'Elongation', unit: '-' },
  loss_coefficient: { key: 'loss_coefficient', label: 'Loss coefficient', unit: '-', symbol: 'η' },
  melting_point_C: { key: 'melting_point_C', label: 'Melting point', unit: '°C', symbol: 'Tm' },
  glass_temperature_C: { key: 'glass_temperature_C', label: 'Glass temperature', unit: '°C', symbol: 'Tg' },
  specific_heat_J_kgK: { key: 'specific_heat_J_kgK', label: 'Specific heat', unit: 'J/(kg·K)', symbol: 'Cp' },
  thermal_conductivity_W_mK: { key: 'thermal_conductivity_W_mK', label: 'Thermal conductivity', unit: 'W/(m·K)', symbol: 'λ' },
  thermal_expansion_uK: { key: 'thermal_expansion_uK', label: 'Thermal expansion', unit: '10⁻⁶/K', symbol: 'α' },
  electrical_resistivity_uohm_cm: { key: 'electrical_resistivity_uohm_cm', label: 'Electrical resistivity', unit: 'µΩ·cm', symbol: 'ρe' },
  dielectric_constant: { key: 'dielectric_constant', label: 'Dielectric constant', unit: '-' },
  refractive_index: { key: 'refractive_index', label: 'Refractive index', unit: '-' },
  embodied_energy_MJ_kg: { key: 'embodied_energy_MJ_kg', label: 'Embodied energy', unit: 'MJ/kg' },
  co2_footprint_kg_kg: { key: 'co2_footprint_kg_kg', label: 'CO₂ footprint', unit: 'kg/kg' },
  water_demand_L_kg: { key: 'water_demand_L_kg', label: 'Water demand', unit: 'L/kg' },
  recycle_fraction: { key: 'recycle_fraction', label: 'Recycle fraction', unit: '-' },
  recycle_energy_MJ_kg: { key: 'recycle_energy_MJ_kg', label: 'Recycle energy', unit: 'MJ/kg' },
  recycle_co2_kg_kg: { key: 'recycle_co2_kg_kg', label: 'Recycle CO₂', unit: 'kg/kg' },
};
