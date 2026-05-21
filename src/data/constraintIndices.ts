// Constraint indices in MINIMIZATION form (smaller value = lighter material to
// satisfy the constraint). These are the reciprocals of the maximize-form indices
// in Ashby Appendix C: for example, the stiffness-tie maximize-form index E/ρ
// corresponds here to the minimize-form index ρ/E.
//
// Used by the Multi-Constraint view to plot two simultaneous constraints on a
// coupling chart, where the min-max metric m̃(material) = max(I₁, I₂/Cc) ranks
// candidates per Ashby §9.2.
//
// Source: Ashby, Materials Selection in Mechanical Design (6th ed., 2025), Ch. 9.2.

import type { Material } from './types';

export interface ConstraintIndex {
  id: string;
  label: string;        // human label, e.g., "Tie — stiffness"
  expr: string;         // display expression, e.g., "ρ / E"
  description?: string; // what this constraint represents
  computeI: (m: Material) => number | undefined;
}

function mid(r: { min: number; max: number } | undefined): number {
  if (!r) return NaN;
  return Math.sqrt(r.min * r.max); // geomean — works well for log-scale properties
}

export const CONSTRAINT_INDICES: ConstraintIndex[] = [
  {
    id: 'tie-stiffness',
    label: 'Tie — stiffness',
    expr: 'ρ / E',
    description: 'Minimum mass of a tie at specified stiffness.',
    computeI: (m) => {
      const E = mid(m.properties.youngs_modulus_GPa);
      const rho = mid(m.properties.density_kg_m3);
      return E > 0 && rho > 0 ? rho / E : undefined;
    },
  },
  {
    id: 'tie-strength',
    label: 'Tie — strength',
    expr: 'ρ / σf',
    description: 'Minimum mass of a tie at specified strength.',
    computeI: (m) => {
      const sigma = mid(m.properties.yield_strength_MPa);
      const rho = mid(m.properties.density_kg_m3);
      return sigma > 0 && rho > 0 ? rho / sigma : undefined;
    },
  },
  {
    id: 'beam-stiffness',
    label: 'Beam — stiffness',
    expr: 'ρ / E^(1/2)',
    description: 'Minimum mass of a beam at specified stiffness; section area free.',
    computeI: (m) => {
      const E = mid(m.properties.youngs_modulus_GPa);
      const rho = mid(m.properties.density_kg_m3);
      return E > 0 && rho > 0 ? rho / Math.sqrt(E) : undefined;
    },
  },
  {
    id: 'beam-strength',
    label: 'Beam — strength',
    expr: 'ρ / σf^(2/3)',
    description: 'Minimum mass of a beam at specified strength; section area free.',
    computeI: (m) => {
      const sigma = mid(m.properties.yield_strength_MPa);
      const rho = mid(m.properties.density_kg_m3);
      return sigma > 0 && rho > 0 ? rho / Math.pow(sigma, 2 / 3) : undefined;
    },
  },
  {
    id: 'panel-stiffness',
    label: 'Panel — stiffness',
    expr: 'ρ / E^(1/3)',
    description: 'Minimum mass of a panel at specified stiffness; thickness free.',
    computeI: (m) => {
      const E = mid(m.properties.youngs_modulus_GPa);
      const rho = mid(m.properties.density_kg_m3);
      return E > 0 && rho > 0 ? rho / Math.cbrt(E) : undefined;
    },
  },
  {
    id: 'panel-strength',
    label: 'Panel — strength',
    expr: 'ρ / σf^(1/2)',
    description: 'Minimum mass of a panel at specified strength; thickness free.',
    computeI: (m) => {
      const sigma = mid(m.properties.yield_strength_MPa);
      const rho = mid(m.properties.density_kg_m3);
      return sigma > 0 && rho > 0 ? rho / Math.sqrt(sigma) : undefined;
    },
  },
  {
    id: 'tie-toughness',
    label: 'Tie — fracture toughness',
    expr: 'ρ / K1c',
    description: 'Minimum mass of a tie at specified fracture-toughness threshold.',
    computeI: (m) => {
      const K = mid(m.properties.fracture_toughness_MPa_sqrt_m);
      const rho = mid(m.properties.density_kg_m3);
      return K > 0 && rho > 0 ? rho / K : undefined;
    },
  },
  {
    id: 'cost-stiffness-tie',
    label: 'Tie — stiffness, cost per part',
    expr: 'Cm·ρ / E',
    description: 'Minimum material cost of a tie at specified stiffness.',
    computeI: (m) => {
      const E = mid(m.properties.youngs_modulus_GPa);
      const rho = mid(m.properties.density_kg_m3);
      const Cm = mid(m.properties.price_USD_kg);
      return E > 0 && rho > 0 && Cm > 0 ? (Cm * rho) / E : undefined;
    },
  },
  {
    id: 'cost-strength-tie',
    label: 'Tie — strength, cost per part',
    expr: 'Cm·ρ / σf',
    description: 'Minimum material cost of a tie at specified strength.',
    computeI: (m) => {
      const sigma = mid(m.properties.yield_strength_MPa);
      const rho = mid(m.properties.density_kg_m3);
      const Cm = mid(m.properties.price_USD_kg);
      return sigma > 0 && rho > 0 && Cm > 0 ? (Cm * rho) / sigma : undefined;
    },
  },
  {
    id: 'eco-stiffness-tie',
    label: 'Tie — stiffness, embodied energy',
    expr: 'Hm·ρ / E',
    description: 'Minimum embodied energy of a tie at specified stiffness.',
    computeI: (m) => {
      const E = mid(m.properties.youngs_modulus_GPa);
      const rho = mid(m.properties.density_kg_m3);
      const Hm = mid(m.properties.embodied_energy_MJ_kg);
      return E > 0 && rho > 0 && Hm > 0 ? (Hm * rho) / E : undefined;
    },
  },
];
