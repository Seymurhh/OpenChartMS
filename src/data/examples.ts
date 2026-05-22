// Worked examples from Ashby, Materials Selection in Mechanical Design (6th
// ed., 2025), Chapter 5. Each example pairs a chart preset with a material
// index plus a short problem statement, so the chart becomes a guided exercise
// rather than a blank slate.

export interface WorkedExample {
  id: string;
  label: string;
  presetId: string;
  indexId: string;
  chapter: string;
  description: string;
}

export const WORKED_EXAMPLES: WorkedExample[] = [
  {
    id: 'oar',
    label: 'Light, stiff oar (beam)',
    presetId: 'E-rho',
    indexId: 'beam',
    chapter: 'Ashby Ex. 5.4',
    description:
      'Minimum mass of a beam at specified stiffness; section area free to vary. Index M = E^(1/2)/ρ — slope 2 on the E vs ρ chart. Drag the cutoff right and the candidates collapse to woods, bamboo and CFRP.',
  },
  {
    id: 'tie-stiffness',
    label: 'Light, stiff tie rod',
    presetId: 'E-rho',
    indexId: 'tie',
    chapter: 'Ashby Ex. 5.4',
    description:
      'Minimum mass of a tensile strut at specified stiffness. Index M = E/ρ — slope 1. With no shape freedom, fibre composites and ultra-stiff metals lead.',
  },
  {
    id: 'floor-panel',
    label: 'Light, stiff floor panel',
    presetId: 'E-rho',
    indexId: 'panel',
    chapter: 'Ashby Ex. 5.4',
    description:
      'Minimum mass of a panel in bending; thickness free. Index M = E^(1/3)/ρ — slope 3. Foams, balsa and honeycomb climb the ranking because thickness is unconstrained.',
  },
  {
    id: 'strong-tie',
    label: 'Strong, light tie',
    presetId: 'sigma-rho',
    indexId: 'tie',
    chapter: 'Ashby Ex. 5.4',
    description:
      'Minimum mass for a tie at specified strength. Index M = σf/ρ — slope 1. CFRP and ultra-high-strength steels dominate the top of the ranking.',
  },
  {
    id: 'strong-beam',
    label: 'Strong, light beam',
    presetId: 'sigma-rho',
    indexId: 'beam',
    chapter: 'Ashby Ex. 5.4',
    description:
      'Minimum mass of a beam at specified failure load; section free. Index M = σf^(2/3)/ρ — slope 1.5. Wood and CFRP win once shape is free.',
  },
  {
    id: 'flywheel',
    label: 'Flywheel — max kinetic energy',
    presetId: 'sigma-rho',
    indexId: 'flywheel',
    chapter: 'Ashby Ex. 5.6',
    description:
      'Maximum kinetic energy per unit mass before the rim bursts. Index M = σf/ρ — same form as the strong tie, but motivated by spin-up. Composites yield the highest energy density.',
  },
  {
    id: 'leak-before-break',
    label: 'Pressure vessel — leak before break',
    presetId: 'K1c-sigma',
    indexId: 'leak-before-break',
    chapter: 'Ashby Ex. 5.7',
    description:
      'Design so any growing crack penetrates the wall (leaks audibly) before reaching critical size. Index M = K1c²/σf. Tough metals dominate; ceramics are dangerous in this role.',
  },
  {
    id: 'yield-before-break',
    label: 'Pressure vessel — yield before break',
    presetId: 'K1c-sigma',
    indexId: 'yield-before-break',
    chapter: 'Ashby Ex. 5.7',
    description:
      'Design so the vessel yields plastically (visible bulging warns of failure) before fracture. Index M = K1c/σf. The same materials usually qualify under both pressure-vessel criteria.',
  },
];
