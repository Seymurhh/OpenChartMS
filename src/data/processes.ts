// Process catalog with attribute limits and material-family compatibility.
// Source: Ashby Ch.7 (Process Selection) Section 7.4 limits table + standard
// engineering-handbook compatibility matrices. Order-of-magnitude only — the
// purpose is to teach the screening pattern, not to substitute for a real
// process-cost model.

import type { FamilyId } from './types';

export type ProcessFamily =
  | 'shape-casting'
  | 'shape-deformation'
  | 'shape-molding'
  | 'shape-powder'
  | 'shape-machining'
  | 'shape-additive'
  | 'shape-sheet';

export interface ProcessDef {
  id: string;
  name: string;
  family: ProcessFamily;
  compatibleFamilies: FamilyId[];
  // attribute ranges (order-of-magnitude)
  sectionMin_mm: number;     // smallest section thickness
  sectionMax_mm: number;
  toleranceMin_mm: number;   // tightest tolerance achievable (lower = better)
  surfaceRoughness_um?: number; // typical Ra in micrometers
  batchMin: number;
  batchMax: number;
  // Per-part cost model (Ch.7.6): C = m·Cm + Ctooling/n + Ccapital·tload/(n·utilization)
  toolingUSD: number;       // dedicated tooling cost
  capitalRateUSD_h: number; // capital + overhead $/hr while machine is loaded
  cycleTime_s: number;      // typical time per part
  description?: string;
}

export const PROCESS_FAMILY_LABEL: Record<ProcessFamily, string> = {
  'shape-casting': 'Casting',
  'shape-deformation': 'Deformation (forging, rolling)',
  'shape-molding': 'Polymer molding',
  'shape-powder': 'Powder methods',
  'shape-machining': 'Machining',
  'shape-additive': 'Additive manufacturing',
  'shape-sheet': 'Sheet forming',
};

export const PROCESSES: ProcessDef[] = [
  {
    id: 'sand-casting',
    name: 'Sand casting',
    family: 'shape-casting',
    compatibleFamilies: ['metals'],
    sectionMin_mm: 3,
    sectionMax_mm: 1000,
    toleranceMin_mm: 1,
    surfaceRoughness_um: 25,
    batchMin: 1,
    batchMax: 10000,
    toolingUSD: 300,
    capitalRateUSD_h: 60,
    cycleTime_s: 600,
    description: 'Flexible, low tooling cost, rough surface. Sweet spot for small batches of large castings.',
  },
  {
    id: 'die-casting',
    name: 'Die casting',
    family: 'shape-casting',
    compatibleFamilies: ['metals'],
    sectionMin_mm: 1,
    sectionMax_mm: 100,
    toleranceMin_mm: 0.1,
    surfaceRoughness_um: 1.5,
    batchMin: 1000,
    batchMax: 1000000,
    toolingUSD: 30000,
    capitalRateUSD_h: 120,
    cycleTime_s: 60,
    description: 'Low-melting metals (Al, Zn, Mg). High tooling cost; pays back at high volumes.',
  },
  {
    id: 'injection-molding',
    name: 'Injection molding',
    family: 'shape-molding',
    compatibleFamilies: ['polymers'],
    sectionMin_mm: 1,
    sectionMax_mm: 50,
    toleranceMin_mm: 0.1,
    surfaceRoughness_um: 0.8,
    batchMin: 10000,
    batchMax: 10000000,
    toolingUSD: 50000,
    capitalRateUSD_h: 80,
    cycleTime_s: 30,
    description: 'Polymers only (thermoplastics + some thermosets). High tooling, fast cycles.',
  },
  {
    id: 'machining-cnc',
    name: 'CNC machining',
    family: 'shape-machining',
    compatibleFamilies: ['metals', 'polymers', 'composites'],
    sectionMin_mm: 0.1,
    sectionMax_mm: 1000,
    toleranceMin_mm: 0.01,
    surfaceRoughness_um: 1,
    batchMin: 1,
    batchMax: 10000,
    toolingUSD: 200,
    capitalRateUSD_h: 90,
    cycleTime_s: 1800,
    description: 'Most flexible; tight tolerances; high per-part time and labor.',
  },
  {
    id: 'forging',
    name: 'Forging (closed-die)',
    family: 'shape-deformation',
    compatibleFamilies: ['metals'],
    sectionMin_mm: 5,
    sectionMax_mm: 500,
    toleranceMin_mm: 0.5,
    surfaceRoughness_um: 6,
    batchMin: 100,
    batchMax: 1000000,
    toolingUSD: 20000,
    capitalRateUSD_h: 150,
    cycleTime_s: 30,
    description: 'Wrought metal grain → high strength. Tight on shape, lax on tolerance.',
  },
  {
    id: 'sheet-stamping',
    name: 'Sheet stamping',
    family: 'shape-sheet',
    compatibleFamilies: ['metals'],
    sectionMin_mm: 0.1,
    sectionMax_mm: 6,
    toleranceMin_mm: 0.05,
    surfaceRoughness_um: 1,
    batchMin: 1000,
    batchMax: 10000000,
    toolingUSD: 25000,
    capitalRateUSD_h: 100,
    cycleTime_s: 4,
    description: 'Sheet metal parts (car bodies, cans). Fast cycle, high tooling.',
  },
  {
    id: 'powder-bed-am',
    name: 'Additive manufacturing (powder bed)',
    family: 'shape-additive',
    compatibleFamilies: ['metals', 'polymers', 'ceramics-technical'],
    sectionMin_mm: 0.2,
    sectionMax_mm: 500,
    toleranceMin_mm: 0.1,
    surfaceRoughness_um: 12,
    batchMin: 1,
    batchMax: 1000,
    toolingUSD: 0,
    capitalRateUSD_h: 80,
    cycleTime_s: 7200,
    description: 'No dedicated tooling. Slow cycle. Complex geometry, low-volume sweet spot.',
  },
  {
    id: 'hot-isostatic-pressing',
    name: 'Hot isostatic pressing (HIPing)',
    family: 'shape-powder',
    compatibleFamilies: ['metals', 'ceramics-technical'],
    sectionMin_mm: 1,
    sectionMax_mm: 1000,
    toleranceMin_mm: 0.5,
    batchMin: 10,
    batchMax: 10000,
    toolingUSD: 5000,
    capitalRateUSD_h: 200,
    cycleTime_s: 14400,
    description: 'Dense parts from powder under high pressure + temperature. Used for ceramics and superalloy parts.',
  },
  {
    id: 'thermoset-molding',
    name: 'Thermoset compression molding',
    family: 'shape-molding',
    compatibleFamilies: ['polymers', 'composites'],
    sectionMin_mm: 1,
    sectionMax_mm: 50,
    toleranceMin_mm: 0.2,
    surfaceRoughness_um: 2,
    batchMin: 100,
    batchMax: 100000,
    toolingUSD: 15000,
    capitalRateUSD_h: 70,
    cycleTime_s: 180,
    description: 'Thermosets + fiber composites (CFRP, GFRP layups).',
  },
  {
    id: 'extrusion',
    name: 'Extrusion',
    family: 'shape-deformation',
    compatibleFamilies: ['metals', 'polymers'],
    sectionMin_mm: 1,
    sectionMax_mm: 500,
    toleranceMin_mm: 0.2,
    surfaceRoughness_um: 1.5,
    batchMin: 1000,
    batchMax: 1000000,
    toolingUSD: 8000,
    capitalRateUSD_h: 80,
    cycleTime_s: 5,
    description: 'Continuous profiles (bars, tubes). Long runs only.',
  },
];

/** Per-part cost (USD) for a given batch and material price. */
export function processUnitCost(
  p: ProcessDef,
  batchSize: number,
  massKg: number,
  materialPriceUSDperKg: number,
  utilization = 0.5,
): number {
  const materialCost = massKg * materialPriceUSDperKg;
  const toolingPerPart = p.toolingUSD / Math.max(batchSize, 1);
  const machineHoursPerPart = p.cycleTime_s / 3600 / Math.max(utilization, 0.05);
  const capitalPerPart = p.capitalRateUSD_h * machineHoursPerPart;
  return materialCost + toolingPerPart + capitalPerPart;
}
