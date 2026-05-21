// Material indices for each chart preset. An index of the form M = y^a / x^b
// has slope b/a on log-log axes, and the iso-M line is y = M^(1/a) · x^(slope).
//
// Source: Ashby, Materials Selection in Mechanical Design (6th ed.), Appendix C.
// Tables C.2 (stiffness-limited) and C.3 (strength-limited).

import { PROPERTY_META, type PropertyKey } from './types';

export interface MaterialIndex {
  id: string;
  label: string;        // human-readable function: e.g. "Light stiff beam"
  expr: string;         // display string: e.g. "E^(1/2) / ρ"
  slope: number;        // slope on log-log axes (= b/a)
  computeM: (x: number, y: number) => number;       // compute index value from raw point
  lineY: (x: number, M: number) => number;          // y on the iso-M line at given x
  description?: string;
}

function fmtExp(n: number): string {
  if (n === 1) return '';
  if (Math.abs(n - 0.5) < 1e-9) return '^(1/2)';
  if (Math.abs(n - 1 / 3) < 1e-6) return '^(1/3)';
  if (Math.abs(n - 2 / 3) < 1e-6) return '^(2/3)';
  if (n === 2) return '²';
  if (n === 3) return '³';
  return `^${n}`;
}

// Build an ad-hoc index of the form M = y^a / x^b for the current chart axes.
// Slope on log-log = b/a; iso-M line is y = M^(1/a) · x^(b/a).
export function makeCustomIndex(
  a: number,
  b: number,
  xKey: PropertyKey,
  yKey: PropertyKey,
): MaterialIndex {
  const xSym = PROPERTY_META[xKey].symbol || PROPERTY_META[xKey].label;
  const ySym = PROPERTY_META[yKey].symbol || PROPERTY_META[yKey].label;
  const yPart = `${ySym}${fmtExp(a)}`;
  const xPart = `${xSym}${fmtExp(b)}`;
  return {
    id: 'custom',
    label: 'Custom index',
    expr: `${yPart} / ${xPart}`,
    slope: b / a,
    computeM: (x, y) => Math.pow(y, a) / Math.pow(x, b),
    lineY: (x, M) => Math.pow(M, 1 / a) * Math.pow(x, b / a),
    description: `Custom: maximize ${yPart} / ${xPart}`,
  };
}

export const CHART_INDICES: Record<string, MaterialIndex[]> = {
  'E-rho': [
    {
      id: 'tie',
      label: 'Light stiff tie',
      expr: 'E / ρ',
      slope: 1,
      computeM: (rho, E) => E / rho,
      lineY: (rho, M) => M * rho,
      description: 'Minimum mass of a tensile strut at specified stiffness.',
    },
    {
      id: 'beam',
      label: 'Light stiff beam (section free)',
      expr: 'E^(1/2) / ρ',
      slope: 2,
      computeM: (rho, E) => Math.sqrt(E) / rho,
      lineY: (rho, M) => Math.pow(M * rho, 2),
      description: 'Minimum mass of a beam in bending with shape specified, section area free.',
    },
    {
      id: 'panel',
      label: 'Light stiff panel',
      expr: 'E^(1/3) / ρ',
      slope: 3,
      computeM: (rho, E) => Math.cbrt(E) / rho,
      lineY: (rho, M) => Math.pow(M * rho, 3),
      description: 'Minimum mass of a flat panel in bending; thickness free.',
    },
  ],
  'sigma-rho': [
    {
      id: 'tie',
      label: 'Light strong tie',
      expr: 'σf / ρ',
      slope: 1,
      computeM: (rho, sigma) => sigma / rho,
      lineY: (rho, M) => M * rho,
      description: 'Minimum mass of a tensile strut at specified strength.',
    },
    {
      id: 'beam',
      label: 'Light strong beam (section free)',
      expr: 'σf^(2/3) / ρ',
      slope: 1.5,
      computeM: (rho, sigma) => Math.pow(sigma, 2 / 3) / rho,
      lineY: (rho, M) => Math.pow(M * rho, 1.5),
      description: 'Minimum mass of a beam in bending at yield; shape specified.',
    },
    {
      id: 'panel',
      label: 'Light strong panel',
      expr: 'σf^(1/2) / ρ',
      slope: 2,
      computeM: (rho, sigma) => Math.sqrt(sigma) / rho,
      lineY: (rho, M) => Math.pow(M * rho, 2),
      description: 'Minimum mass of a flat panel at yield; thickness free.',
    },
    {
      id: 'flywheel',
      label: 'Flywheel energy storage',
      expr: 'σf / ρ',
      slope: 1,
      computeM: (rho, sigma) => sigma / rho,
      lineY: (rho, M) => M * rho,
      description: 'Maximum kinetic energy per unit mass; no failure.',
    },
  ],
  'K1c-sigma': [
    {
      id: 'leak-before-break',
      label: 'Leak-before-break',
      expr: 'K1c^2 / σf',
      slope: 0.5,
      computeM: (sigma, K1c) => (K1c * K1c) / sigma,
      lineY: (sigma, M) => Math.sqrt(M * sigma),
      description: 'Pressure vessel — leak before catastrophic break.',
    },
    {
      id: 'yield-before-break',
      label: 'Yield-before-break',
      expr: 'K1c / σf',
      slope: 1,
      computeM: (sigma, K1c) => K1c / sigma,
      lineY: (sigma, M) => M * sigma,
      description: 'Pressure vessel — material yields before it fractures.',
    },
  ],
};
