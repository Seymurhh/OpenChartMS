import { useEffect, useMemo, useState } from 'react';
import { TradeOffChart } from '../components/TradeOffChart';
import { materials, familyById } from '../data/loadMaterials';
import { PROPERTY_META, type Material, type PropertyKey } from '../data/types';
import { paretoFront } from '../lib/pareto';

const PARETO_PAGE_SIZE = 3;

// Properties that make sense as minimization objectives
const MINIMIZE_PROPERTIES: PropertyKey[] = [
  'density_kg_m3',
  'price_USD_kg',
  'embodied_energy_MJ_kg',
  'co2_footprint_kg_kg',
  'water_demand_L_kg',
  'thermal_expansion_uK',
  'electrical_resistivity_uohm_cm',
];

interface MaterialPoint {
  id: string;
  x: number;
  y: number;
  material: Material;
}

export function TradeOff() {
  const [xKey, setXKey] = useState<PropertyKey>('price_USD_kg');
  const [yKey, setYKey] = useState<PropertyKey>('density_kg_m3');
  const [alphaSliderPos, setAlphaSliderPos] = useState(50);
  const [showContours, setShowContours] = useState(true);
  const [showLabels, setShowLabels] = useState(false);
  const [baselineId, setBaselineId] = useState<string>('');
  const [paretoPage, setParetoPage] = useState(0);

  const xMeta = PROPERTY_META[xKey];
  const yMeta = PROPERTY_META[yKey];

  // Default α is the natural data scale = x-range / y-range.
  // Slider maps log-linearly across (default/1000, default*1000).
  const { alpha, alphaMin, alphaMax, defaultAlpha, points } = useMemo(() => {
    const pts: MaterialPoint[] = materials
      .filter((m) => m.properties[xKey] && m.properties[yKey])
      .map((m) => ({
        id: m.id,
        x: m.properties[xKey]!.min,
        y: m.properties[yKey]!.min,
        material: m,
      }));
    if (pts.length === 0) {
      return { alpha: 1, alphaMin: 0.001, alphaMax: 1000, defaultAlpha: 1, points: [] };
    }
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const dx = Math.max(...xs) - Math.min(...xs);
    const dy = Math.max(...ys) - Math.min(...ys);
    const natural = dx / dy > 0 ? dx / dy : 1;
    const aMin = natural / 1000;
    const aMax = natural * 1000;
    const a = aMin * Math.pow(aMax / aMin, alphaSliderPos / 100);
    return { alpha: a, alphaMin: aMin, alphaMax: aMax, defaultAlpha: natural, points: pts };
  }, [xKey, yKey, alphaSliderPos]);

  const { paretoMaterials, optimum, optimumZ } = useMemo(() => {
    const paretoIds = paretoFront(points);
    let best: MaterialPoint | undefined;
    let minZ = Infinity;
    for (const p of points) {
      const z = p.x + alpha * p.y;
      if (z < minZ) {
        minZ = z;
        best = p;
      }
    }
    const pareto = points.filter((p) => paretoIds.has(p.id)).sort((a, b) => a.x - b.x);
    return { paretoMaterials: pareto, optimum: best, optimumZ: minZ };
  }, [points, alpha]);

  const paretoPageCount = Math.max(1, Math.ceil(paretoMaterials.length / PARETO_PAGE_SIZE));
  const paretoPageItems = paretoMaterials.slice(
    paretoPage * PARETO_PAGE_SIZE,
    (paretoPage + 1) * PARETO_PAGE_SIZE,
  );
  const paretoGlobalStart = paretoPage * PARETO_PAGE_SIZE;

  // Reset to first page whenever the list changes (axis change, α change, etc.)
  useEffect(() => {
    setParetoPage(0);
  }, [paretoMaterials]);

  return (
    <>
      <section className="trade-off-section">
        <h2>1. Pick two objectives to minimize</h2>
        <p className="eco-help">
          The trade-off plot shows every material as a point at its best-case corner. The{' '}
          <strong>Pareto front</strong> is the subset for which no other material is
          simultaneously better on both axes — these are your candidate "best compromises". Both
          axes are log scale.
        </p>
        <div className="controls">
          <div className="control-group">
            <label htmlFor="x-axis">X axis (minimize):</label>
            <select
              id="x-axis"
              value={xKey}
              onChange={(e) => setXKey(e.target.value as PropertyKey)}
            >
              {MINIMIZE_PROPERTIES.map((k) => (
                <option key={k} value={k}>
                  {PROPERTY_META[k].label} ({PROPERTY_META[k].unit})
                </option>
              ))}
            </select>
          </div>
          <div className="control-group">
            <label htmlFor="y-axis">Y axis (minimize):</label>
            <select
              id="y-axis"
              value={yKey}
              onChange={(e) => setYKey(e.target.value as PropertyKey)}
            >
              {MINIMIZE_PROPERTIES.map((k) => (
                <option key={k} value={k}>
                  {PROPERTY_META[k].label} ({PROPERTY_META[k].unit})
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="trade-off-section">
        <h2>2. Exchange constant α</h2>
        <p className="eco-help">
          Penalty function <strong>Z = X + α·Y</strong>. α has units of{' '}
          <em>{xMeta.unit} per {yMeta.unit}</em> — how much an increase in Y costs you in units of X.
          The red iso-Z contour passes through the optimum material and is tangent to the Pareto
          front there.
        </p>
        <div className="alpha-row">
          <label htmlFor="alpha">
            α = <strong>{alpha.toPrecision(3)}</strong>{' '}
            <span className="alpha-unit">{xMeta.unit} / {yMeta.unit}</span>
          </label>
          <input
            id="alpha"
            type="range"
            min={0}
            max={100}
            step={0.5}
            value={alphaSliderPos}
            onChange={(e) => setAlphaSliderPos(parseFloat(e.target.value))}
          />
          <span className="slider-bounds">
            {alphaMin.toPrecision(2)} ↔ {alphaMax.toPrecision(2)}
          </span>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={showContours}
              onChange={(e) => setShowContours(e.target.checked)}
            />
            Penalty contours
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={showLabels}
              onChange={(e) => setShowLabels(e.target.checked)}
            />
            Material labels
          </label>
        </div>
        <div className="quick-picks" style={{ marginTop: 8 }}>
          <span className="qp-label">Tilt:</span>
          <button onClick={() => setAlphaSliderPos(15)}>
            ← Strongly favor {xMeta.symbol || 'X'}
          </button>
          <button onClick={() => setAlphaSliderPos(35)}>Favor {xMeta.symbol || 'X'}</button>
          <button onClick={() => setAlphaSliderPos(50)}>Balanced</button>
          <button onClick={() => setAlphaSliderPos(65)}>Favor {yMeta.symbol || 'Y'}</button>
          <button onClick={() => setAlphaSliderPos(85)}>
            Strongly favor {yMeta.symbol || 'Y'} →
          </button>
        </div>
        <p className="phase-note">
          Default α = {defaultAlpha.toPrecision(2)} (natural data scale: x-range / y-range).
          Slide left → low X (cheaper) matters more; slide right → low Y matters more. The optimum
          shifts along the Pareto front as α changes. For design-level mass–cost analyses, Ashby
          Table 9.2 gives exchange constants from ~$1/kg (cars) to ~$5,000/kg (spacecraft).
        </p>
      </section>

      <section className="trade-off-section">
        <h2>3. Baseline material (optional)</h2>
        <p className="eco-help">
          Pick an existing material to use as the reference point — the chart adds quadrant
          lines through it. <strong>Quadrant A</strong> (lower-left) holds substitutes that are
          better on <em>both</em> axes; quadrants B and C hold one-axis improvements; D is worse
          on both. Per Ashby §9.3 (Fig 9.9).
        </p>
        <div className="control-group">
          <label htmlFor="baseline">Baseline:</label>
          <select
            id="baseline"
            value={baselineId}
            onChange={(e) => setBaselineId(e.target.value)}
          >
            <option value="">— none —</option>
            {points
              .slice()
              .sort((a, b) => a.material.name.localeCompare(b.material.name))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.material.name}
                </option>
              ))}
          </select>
        </div>
      </section>

      <TradeOffChart
        xKey={xKey}
        yKey={yKey}
        alpha={alpha}
        showContours={showContours}
        baselineId={baselineId || undefined}
        showLabels={showLabels}
      />

      <section className="trade-off-section">
        <h2>4. Results</h2>
        <div className="totals-grid">
          <div className="total-card grand">
            <div className="total-label">Optimum (min Z)</div>
            <div className="total-value">
              {optimum?.material.name ?? '—'}
            </div>
            <div className="unit">Z = {Number.isFinite(optimumZ) ? optimumZ.toPrecision(3) : '—'} {xMeta.unit}</div>
          </div>
          <div className="total-card">
            <div className="total-label">Pareto-optimal materials</div>
            <div className="total-value">{paretoMaterials.length}</div>
            <div className="unit">of {points.length}</div>
          </div>
        </div>

        <div className="selected-panel">
          <div className="selected-header">
            <h3>
              Pareto-front materials{' '}
              <span className="count-badge dark">{paretoMaterials.length}</span>
            </h3>
            <div className="selected-header-right">
              <span className="sort-note">non-dominated · ranked by {xMeta.label}</span>
              {paretoPageCount > 1 && (
                <div className="pagination">
                  <button
                    className="page-btn"
                    onClick={() => setParetoPage((p) => p - 1)}
                    disabled={paretoPage === 0}
                    aria-label="Previous page"
                  >
                    ‹
                  </button>
                  <span className="page-info">
                    {paretoGlobalStart + 1}–
                    {Math.min(paretoGlobalStart + PARETO_PAGE_SIZE, paretoMaterials.length)} of{' '}
                    {paretoMaterials.length}
                  </span>
                  <button
                    className="page-btn"
                    onClick={() => setParetoPage((p) => p + 1)}
                    disabled={paretoPage >= paretoPageCount - 1}
                    aria-label="Next page"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          </div>
          {paretoMaterials.length === 0 ? (
            <p className="empty-note">No materials available for the chosen axes.</p>
          ) : (
            <ol className="selected-list">
              {paretoPageItems.map((p, i) => {
                const family = familyById[p.material.family];
                const Z = p.x + alpha * p.y;
                return (
                  <li key={p.id} className="selected-row">
                    <span className="rank">{paretoGlobalStart + i + 1}</span>
                    <span
                      className="family-chip small"
                      style={{ background: family.color }}
                      title={family.label}
                    />
                    <span className="material-name">{p.material.name}</span>
                    <span className="props">
                      <span className="prop">
                        <span className="prop-label">{xMeta.symbol || 'x'}</span>{' '}
                        {p.x.toPrecision(3)} {xMeta.unit}
                      </span>
                      <span className="prop">
                        <span className="prop-label">{yMeta.symbol || 'y'}</span>{' '}
                        {p.y.toPrecision(3)} {yMeta.unit}
                      </span>
                    </span>
                    <span className="m-value" title="Z = X + α·Y">
                      Z={Z.toPrecision(3)}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </section>

      <footer className="app-footer">
        <p>
          The trade-off / Pareto method is from Ashby, <em>Materials Selection in Mechanical Design</em>{' '}
          (6th ed., 2025) Chapter 9.3. Each material is plotted at the optimistic corner of its
          property range. The Pareto front (dotted line) is the subset of materials for which no
          other is simultaneously better on both axes. The penalty function{' '}
          <strong>Z = X + α·Y</strong> aggregates both objectives; the material minimising Z is
          the optimum for that exchange constant α. Iso-Z contours are straight lines on linear
          scales — on log-log axes they appear curved.
        </p>
      </footer>
    </>
  );
}
