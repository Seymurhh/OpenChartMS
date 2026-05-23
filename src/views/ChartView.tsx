import { useMemo, useState } from 'react';
import { AshbyChart, type IndexLineSpec } from '../components/AshbyChart';
import { LimitsPanel, passesLimits, type PropertyLimit } from '../components/LimitsPanel';
import { SelectedMaterialsPanel, type SelectedItem } from '../components/SelectedMaterialsPanel';
import type { PropertyKey } from '../data/types';
import { materials } from '../data/loadMaterials';
import { CHART_INDICES, makeCustomIndex, type MaterialIndex } from '../data/chartIndices';
import { WORKED_EXAMPLES } from '../data/examples';
import { PROPERTY_META } from '../data/types';

interface ChartPreset {
  id: string;
  label: string;
  x: PropertyKey;
  y: PropertyKey;
  /** Canonical initial view in linear scale — matches Ashby textbook figure extents. */
  xRange: [number, number];
  yRange: [number, number];
}

const PRESETS: ChartPreset[] = [
  // Fig 3.3 — E vs ρ: foams (ρ~50) through Ir (ρ~22500); elastomers (E~0.0001) through diamond (E~1100)
  { id: 'E-rho',        label: "Young's modulus E vs Density ρ (Fig 3.3)",        x: 'density_kg_m3',        y: 'youngs_modulus_GPa',            xRange: [10,    25000], yRange: [1e-5,  1500]   },
  // Fig 3.4 — σ vs ρ: same density span; strength from elastomers (0.01) to ultra-high (10000 MPa)
  { id: 'sigma-rho',    label: 'Yield strength σf vs Density ρ (Fig 3.4)',        x: 'density_kg_m3',        y: 'yield_strength_MPa',            xRange: [10,    25000], yRange: [0.01,  15000]  },
  // Fig 3.5 — E vs σ
  { id: 'E-sigma',      label: 'Modulus E vs Strength σf (Fig 3.5)',              x: 'yield_strength_MPa',   y: 'youngs_modulus_GPa',            xRange: [0.01,  15000], yRange: [1e-5,  1500]   },
  // Fig 3.7 — K1c vs E
  { id: 'K1c-E',        label: 'Fracture toughness K1c vs Modulus E (Fig 3.7)',   x: 'youngs_modulus_GPa',   y: 'fracture_toughness_MPa_sqrt_m', xRange: [1e-4,  1500],  yRange: [0.01,  300]    },
  // Fig 3.8 — K1c vs σ
  { id: 'K1c-sigma',    label: 'Fracture toughness K1c vs Strength σf (Fig 3.8)', x: 'yield_strength_MPa',   y: 'fracture_toughness_MPa_sqrt_m', xRange: [0.01,  15000], yRange: [0.01,  300]    },
  // Thermal: α spans ~0.1 (Si, invar) to ~700 µK⁻¹ (elastomers); λ spans ~0.01 to ~2500 (diamond)
  { id: 'lambda-alpha', label: 'Thermal conductivity λ vs Thermal expansion α',   x: 'thermal_expansion_uK', y: 'thermal_conductivity_W_mK',     xRange: [0.05,  1000],  yRange: [0.01,  3000]   },
  // Embodied energy vs E
  { id: 'embodied-E',   label: 'Embodied energy vs Modulus E',                    x: 'youngs_modulus_GPa',   y: 'embodied_energy_MJ_kg',         xRange: [1e-4,  1500],  yRange: [0.5,   500000] },
  // CO₂ vs density
  { id: 'co2-rho',      label: 'CO₂ footprint vs Density ρ',                      x: 'density_kg_m3',        y: 'co2_footprint_kg_kg',           xRange: [10,    25000], yRange: [0.001, 100]    },
];

function geomean(a: number, b: number): number {
  return Math.sqrt(a * b);
}

export function ChartView() {
  const [presetId, setPresetId] = useState(PRESETS[0].id);
  const [showLabels, setShowLabels] = useState(false);
  const [showEnvelopes, setShowEnvelopes] = useState(true);
  const [activeIndexId, setActiveIndexId] = useState<string>('none');
  const [sliderPos, setSliderPos] = useState(50);
  const [limits, setLimits] = useState<PropertyLimit[]>([]);
  const [aExp, setAExp] = useState(0.5);
  const [bExp, setBExp] = useState(1);
  const [lassoMode, setLassoMode] = useState(false);
  const [graphicalSelection, setGraphicalSelection] = useState<Set<string> | undefined>(undefined);
  const [activeExampleId, setActiveExampleId] = useState<string>('');

  const activeExample = WORKED_EXAMPLES.find((e) => e.id === activeExampleId);

  const loadExample = (exId: string) => {
    if (!exId) {
      setActiveExampleId('');
      return;
    }
    const ex = WORKED_EXAMPLES.find((e) => e.id === exId);
    if (!ex) return;
    setActiveExampleId(ex.id);
    setPresetId(ex.presetId);
    setActiveIndexId(ex.indexId);
    setSliderPos(50);
  };

  const preset = PRESETS.find((p) => p.id === presetId)!;
  const indicesForPreset: MaterialIndex[] = CHART_INDICES[preset.id] ?? [];

  const customIndex = useMemo<MaterialIndex | undefined>(() => {
    if (aExp > 0 && bExp > 0 && Number.isFinite(aExp) && Number.isFinite(bExp)) {
      return makeCustomIndex(aExp, bExp, preset.x, preset.y);
    }
    return undefined;
  }, [aExp, bExp, preset.x, preset.y]);

  const activeIndex: MaterialIndex | undefined =
    activeIndexId === 'custom'
      ? customIndex
      : indicesForPreset.find((i) => i.id === activeIndexId);

  // Single computation that produces: selection IDs, sorted list for panel,
  // index-line spec, and slider bounds.
  const sel = useMemo(() => {
    const validMaterials = materials.filter(
      (m) => m.properties[preset.x] && m.properties[preset.y],
    );

    // Compute index M for every material that has both axes populated.
    const indexValues = new Map<string, number>();
    if (activeIndex) {
      for (const m of validMaterials) {
        const xMid = geomean(m.properties[preset.x]!.min, m.properties[preset.x]!.max);
        const yMid = geomean(m.properties[preset.y]!.min, m.properties[preset.y]!.max);
        indexValues.set(m.id, activeIndex.computeM(xMid, yMid));
      }
    }

    // Slider position → cutoff M (log-scale mapping).
    let Mmin = 0;
    let Mmax = 0;
    let M = 0;
    if (activeIndex) {
      const positives = Array.from(indexValues.values()).filter((v) => Number.isFinite(v) && v > 0);
      Mmin = Math.min(...positives);
      Mmax = Math.max(...positives);
      M = Mmin > 0 ? Mmin * Math.pow(Mmax / Mmin, sliderPos / 100) : 0;
    }

    // Combine limit-pass + index-cutoff + graphical-selection into the final set.
    const passing = validMaterials.filter((m) => {
      if (!passesLimits(m, limits)) return false;
      if (activeIndex && (indexValues.get(m.id) ?? 0) < M) return false;
      if (graphicalSelection && !graphicalSelection.has(m.id)) return false;
      return true;
    });

    // Sort for the panel: by M descending if active index, otherwise by family then name.
    const items: SelectedItem[] = passing
      .map((m) => ({ material: m, M: indexValues.get(m.id) }))
      .sort((a, b) => {
        if (a.M !== undefined && b.M !== undefined) return b.M - a.M;
        if (a.material.family !== b.material.family)
          return a.material.family.localeCompare(b.material.family);
        return a.material.name.localeCompare(b.material.name);
      });

    const isFiltered =
      activeIndex !== undefined || limits.length > 0 || graphicalSelection !== undefined;

    return {
      selectedIds: isFiltered ? new Set(passing.map((m) => m.id)) : undefined,
      items,
      validCount: validMaterials.length,
      Mmin,
      Mmax,
      M,
      isFiltered,
    };
  }, [activeIndex, sliderPos, limits, preset, graphicalSelection]);

  const indexLine: IndexLineSpec | undefined = activeIndex
    ? { expr: activeIndex.expr, slope: activeIndex.slope, M: sel.M, lineY: activeIndex.lineY }
    : undefined;

  const onPresetChange = (id: string) => {
    setPresetId(id);
    setActiveIndexId('none');
    setSliderPos(50);
    setActiveExampleId('');
    // limits intentionally retained — they apply across presets.
  };

  return (
    <>
      <div className="examples-bar">
        <div className="control-group">
          <label htmlFor="example">Worked example:</label>
          <select
            id="example"
            value={activeExampleId}
            onChange={(e) => loadExample(e.target.value)}
          >
            <option value="">— none —</option>
            {WORKED_EXAMPLES.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.label} ({ex.chapter})
              </option>
            ))}
          </select>
        </div>
      </div>

      {activeExample && (
        <div className="example-card">
          <div className="ex-chapter">{activeExample.chapter}</div>
          <div className="ex-title">{activeExample.label}</div>
          <div className="ex-desc">{activeExample.description}</div>
        </div>
      )}

      <div className="controls">
        <div className="control-group">
          <label htmlFor="preset">Chart:</label>
          <select id="preset" value={presetId} onChange={(e) => onPresetChange(e.target.value)}>
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={showEnvelopes}
            onChange={(e) => setShowEnvelopes(e.target.checked)}
          />
          Family envelopes
        </label>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={showLabels}
            onChange={(e) => setShowLabels(e.target.checked)}
          />
          Material labels
        </label>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={lassoMode}
            onChange={(e) => setLassoMode(e.target.checked)}
          />
          Lasso select
        </label>

        {graphicalSelection && (
          <span className="selection-count">
            <strong>{graphicalSelection.size}</strong> in graphical selection
            <button
              className="btn-link"
              style={{ marginLeft: 8 }}
              onClick={() => setGraphicalSelection(undefined)}
            >
              clear
            </button>
          </span>
        )}
      </div>

      <div className="index-panel">
        <div className="index-row">
          <label htmlFor="index">Material index:</label>
          <select
            id="index"
            value={activeIndexId}
            onChange={(e) => {
              setActiveIndexId(e.target.value);
              setSliderPos(50);
              setActiveExampleId('');
            }}
          >
            <option value="none">— none —</option>
            {indicesForPreset.map((idx) => (
              <option key={idx.id} value={idx.id}>
                {idx.label} ({idx.expr})
              </option>
            ))}
            <option value="custom">Custom (M = y^a / x^b)…</option>
          </select>
          {activeIndex && (
            <span className="index-meta">
              slope <strong>{activeIndex.slope.toPrecision(3)}</strong>
              {activeIndex.description && <> · {activeIndex.description}</>}
            </span>
          )}
        </div>

        {activeIndexId === 'custom' && (
          <div className="index-row custom-exp-row">
            <span className="custom-form">
              M = <em>{PROPERTY_META[preset.y].symbol ?? PROPERTY_META[preset.y].label}</em><sup>a</sup>{' '}
              /{' '}
              <em>{PROPERTY_META[preset.x].symbol ?? PROPERTY_META[preset.x].label}</em><sup>b</sup>
            </span>
            <label>
              a =
              <input
                type="number"
                value={aExp}
                step={0.1}
                min={0.01}
                onChange={(e) =>
                  setAExp(Math.max(0.01, parseFloat(e.target.value) || 0.01))
                }
              />
            </label>
            <label>
              b =
              <input
                type="number"
                value={bExp}
                step={0.1}
                min={0.01}
                onChange={(e) =>
                  setBExp(Math.max(0.01, parseFloat(e.target.value) || 0.01))
                }
              />
            </label>
            <div className="quick-picks">
              <span className="qp-label">Quick:</span>
              <button onClick={() => { setAExp(1); setBExp(1); }}>tie (slope 1)</button>
              <button onClick={() => { setAExp(0.5); setBExp(1); }}>beam (slope 2)</button>
              <button onClick={() => { setAExp(1 / 3); setBExp(1); }}>panel (slope 3)</button>
            </div>
          </div>
        )}

        {activeIndex && (
          <>
            <div className="index-row slider-row">
              <label htmlFor="m-slider">
                Cutoff: <strong>{activeIndex.expr} ≥ {sel.M.toPrecision(3)}</strong>
              </label>
              <input
                id="m-slider"
                type="range"
                min={0}
                max={100}
                step={0.5}
                value={sliderPos}
                onChange={(e) => setSliderPos(parseFloat(e.target.value))}
              />
              <span className="slider-bounds">
                {sel.Mmin.toPrecision(2)} ↔ {sel.Mmax.toPrecision(2)}
              </span>
            </div>
            <p className="slider-hint">
              Materials with M ≥ cutoff stay vivid; the rest dim. Drag right to keep only top
              performers.
            </p>
          </>
        )}
      </div>

      <LimitsPanel limits={limits} onChange={setLimits} />

      <AshbyChart
        key={preset.id}
        xKey={preset.x}
        yKey={preset.y}
        showLabels={showLabels}
        showEnvelopes={showEnvelopes}
        indexLine={indexLine}
        selectedIds={sel.selectedIds}
        dragMode={lassoMode ? 'lasso' : 'zoom'}
        onLassoSelect={setGraphicalSelection}
        xRangeFixed={preset.xRange}
        yRangeFixed={preset.yRange}
      />

      <SelectedMaterialsPanel
        items={sel.items}
        totalCount={sel.validCount}
        indexExpr={activeIndex?.expr}
        xKey={preset.x}
        yKey={preset.y}
        isFiltered={sel.isFiltered}
      />

      <footer className="app-footer">
        <p>
          Three-stage selection: <strong>property limits</strong> (range overlap with material data) ∩{' '}
          <strong>material index cutoff</strong> (computed at each material's geometric center) →
          materials in the selected set are kept vivid; the rest dim to 8% opacity. Sources: Ashby
          Appendices A and C.
        </p>
      </footer>
    </>
  );
}
