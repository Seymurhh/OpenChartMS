// Hybrid material micro-mechanics from Ashby, Materials Selection in Mechanical
// Design (6th ed., 2025), Ch. 13. All formulas in SI units; E in GPa, ρ in kg/m³.

import type { Material } from '../data/types';

export type HybridKind = 'composite-voigt' | 'composite-reuss' | 'foam-open' | 'foam-closed' | 'sandwich';

function gmean(min: number, max: number): number {
  return Math.sqrt(min * max);
}

function midRange(m: Material, key: keyof Material['properties']): number {
  const r = m.properties[key];
  if (!r) return NaN;
  return gmean(r.min, r.max);
}

export interface HybridResult {
  E_GPa: number;       // effective Young's modulus
  rho_kg_m3: number;   // effective density
  label: string;       // display label, e.g. "Voigt: 50% CFRP + 50% Epoxy"
  kind: HybridKind;
  detail: string;      // short formula reminder
}

// Rule-of-mixtures (Voigt) upper bound — aligned continuous fibers in tension.
export function voigtComposite(m1: Material, m2: Material, f: number): HybridResult | null {
  const E1 = midRange(m1, 'youngs_modulus_GPa');
  const E2 = midRange(m2, 'youngs_modulus_GPa');
  const rho1 = midRange(m1, 'density_kg_m3');
  const rho2 = midRange(m2, 'density_kg_m3');
  if (!isFinite(E1) || !isFinite(E2) || !isFinite(rho1) || !isFinite(rho2)) return null;
  return {
    E_GPa: f * E1 + (1 - f) * E2,
    rho_kg_m3: f * rho1 + (1 - f) * rho2,
    label: `Voigt: ${(f * 100).toFixed(0)}% ${m1.short_name ?? m1.name} + ${((1 - f) * 100).toFixed(0)}% ${m2.short_name ?? m2.name}`,
    kind: 'composite-voigt',
    detail: 'E = f·E₁ + (1−f)·E₂  ·  upper bound (aligned continuous fibers)',
  };
}

// Inverse rule-of-mixtures (Reuss) lower bound — series loading / transverse.
export function reussComposite(m1: Material, m2: Material, f: number): HybridResult | null {
  const E1 = midRange(m1, 'youngs_modulus_GPa');
  const E2 = midRange(m2, 'youngs_modulus_GPa');
  const rho1 = midRange(m1, 'density_kg_m3');
  const rho2 = midRange(m2, 'density_kg_m3');
  if (!isFinite(E1) || !isFinite(E2) || !isFinite(rho1) || !isFinite(rho2)) return null;
  const oneOverE = f / E1 + (1 - f) / E2;
  if (oneOverE <= 0) return null;
  return {
    E_GPa: 1 / oneOverE,
    rho_kg_m3: f * rho1 + (1 - f) * rho2,
    label: `Reuss: ${(f * 100).toFixed(0)}% ${m1.short_name ?? m1.name} + ${((1 - f) * 100).toFixed(0)}% ${m2.short_name ?? m2.name}`,
    kind: 'composite-reuss',
    detail: '1/E = f/E₁ + (1−f)/E₂  ·  lower bound (transverse / series)',
  };
}

// Gibson–Ashby open-cell foam: E*/Es ≈ ρ̄² where ρ̄ = ρ_foam / ρ_solid.
// Density is just the solid density × relative density.
export function openCellFoam(solid: Material, relDensity: number): HybridResult | null {
  const Es = midRange(solid, 'youngs_modulus_GPa');
  const rhoSolid = midRange(solid, 'density_kg_m3');
  if (!isFinite(Es) || !isFinite(rhoSolid)) return null;
  return {
    E_GPa: Es * relDensity * relDensity,
    rho_kg_m3: rhoSolid * relDensity,
    label: `Open-cell foam, ρ̄=${relDensity.toFixed(2)} of ${solid.short_name ?? solid.name}`,
    kind: 'foam-open',
    detail: 'E*/Es ≈ ρ̄²  (Gibson–Ashby, bend-dominated cell walls)',
  };
}

// Closed-cell foam: stiffer than open by an empirical factor; we use a simple
// Φ-weighted form E*/Es = Φ²·ρ̄² + (1−Φ)·ρ̄ where Φ is the fraction of solid
// in cell edges (default 0.7 per Gibson–Ashby).
export function closedCellFoam(solid: Material, relDensity: number, phi = 0.7): HybridResult | null {
  const Es = midRange(solid, 'youngs_modulus_GPa');
  const rhoSolid = midRange(solid, 'density_kg_m3');
  if (!isFinite(Es) || !isFinite(rhoSolid)) return null;
  const Eratio = phi * phi * relDensity * relDensity + (1 - phi) * relDensity;
  return {
    E_GPa: Es * Eratio,
    rho_kg_m3: rhoSolid * relDensity,
    label: `Closed-cell foam, ρ̄=${relDensity.toFixed(2)} of ${solid.short_name ?? solid.name}`,
    kind: 'foam-closed',
    detail: `E*/Es ≈ Φ²·ρ̄² + (1−Φ)·ρ̄  with Φ=${phi}`,
  };
}

// Sandwich panel: stiff faces (each of thickness t) bonded to a light core
// (thickness c). Let tFrac = t / H be the per-face thickness fraction of total
// panel thickness H = 2t + c. Assuming the core contributes negligibly to
// bending (Ashby Ch.13 "thin-skin" limit), the parallel-axis theorem gives:
//
//   D     = E_face · (H³ − c³) / 12
//   D_eq  = E_eq  · H³ / 12          ⇒   E_eq = E_face · [1 − (c/H)³]
//
// With c/H = (1 − 2·tFrac), this collapses to E_eq = E_face · [1 − (1−2t)³].
// Density follows the rule of mixtures by volume fraction:
//   ρ_eff = 2·tFrac·ρ_face + (1 − 2·tFrac)·ρ_core
//
// E_eq is the *bending-equivalent* modulus — i.e., the modulus of an
// equal-thickness solid plate that would have the same flexural rigidity. It
// is NOT a tensile modulus and should not be substituted into a tie-stiffness
// index.
export function sandwichPanel(
  face: Material,
  core: Material,
  tFrac: number,
): HybridResult | null {
  const Ef = midRange(face, 'youngs_modulus_GPa');
  const rhoF = midRange(face, 'density_kg_m3');
  const rhoC = midRange(core, 'density_kg_m3');
  if (!isFinite(Ef) || !isFinite(rhoF) || !isFinite(rhoC)) return null;
  const tt = Math.min(0.49, Math.max(0.001, tFrac));
  const rhoEff = 2 * tt * rhoF + (1 - 2 * tt) * rhoC;
  const coreRatio = 1 - 2 * tt;
  const Ebend = Ef * (1 - coreRatio * coreRatio * coreRatio);
  const faceName = face.short_name ?? face.name;
  const coreName = core.short_name ?? core.name;
  return {
    E_GPa: Ebend,
    rho_kg_m3: rhoEff,
    label: `Sandwich · t/H = ${tt.toFixed(2)} per face (${faceName} faces, ${coreName} core)`,
    kind: 'sandwich',
    detail:
      'E_eq = E_face·[1 − (1−2·t/H)³]  ·  bending-equivalent modulus (thin-skin limit, core ignored)',
  };
}
