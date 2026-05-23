/**
 * The 56 original Ashby Appendix A materials (6th ed., 2025).
 * Used to switch between Teaching mode (clean, lecture-ready) and
 * Extended mode (all 159 materials, for problem sets and exploration).
 */
export const CORE_IDS = new Set<string>([
  'cast-iron-ductile', 'cast-iron-gray', 'high-carbon-steel', 'low-alloy-steel',
  'low-carbon-steel', 'medium-carbon-steel', 'stainless-steel', 'aluminum-alloys',
  'copper-alloys', 'lead-alloys', 'magnesium-alloys', 'nickel-alloys',
  'titanium-alloys', 'tungsten-alloys', 'zinc-alloys',
  'borosilicate-glass', 'silica-glass', 'soda-lime-glass',
  'alumina', 'aluminum-nitride', 'silicon', 'silicon-carbide', 'tungsten-carbide',
  'brick', 'concrete', 'stone',
  'butyl-rubber', 'eva', 'natural-rubber', 'polychloroprene', 'silicone-elastomers',
  'abs', 'polyamide', 'polycarbonate', 'peek', 'polyethylene', 'pet',
  'pmma', 'pom', 'polypropylene', 'polystyrene', 'ptfe', 'pvc',
  'epoxy', 'phenolic', 'polyester-thermoset',
  'flexible-foam-ld', 'flexible-foam-md', 'rigid-foam-hd', 'rigid-foam-ld',
  'cork', 'paper', 'softwood', 'hardwood',
  'cfrp', 'gfrp',
]);
