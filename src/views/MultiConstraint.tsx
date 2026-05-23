import { useMemo, useState } from 'react';
import { CouplingChart } from '../components/CouplingChart';
import { CONSTRAINT_INDICES } from '../data/constraintIndices';
import { materials, familyById } from '../data/loadMaterials';
import type { Material } from '../data/types';

interface RankedRow {
  material: Material;
  I1: number;
  I2: number;
  minmax: number;
}

export function MultiConstraint({ whitelist }: { whitelist?: Set<string> }) {
  const [i1Id, setI1Id] = useState('tie-stiffness');
  const [i2Id, setI2Id] = useState('tie-strength');
  const [ccSliderPos, setCcSliderPos] = useState(50);
  const [showPareto, setShowPareto] = useState(true);
  const [showSelectionBox, setShowSelectionBox] = useState(true);
  const [showLabels, setShowLabels] = useState(false);

  const index1 = CONSTRAINT_INDICES.find((i) => i.id === i1Id) ?? CONSTRAINT_INDICES[0];
  const index2 = CONSTRAINT_INDICES.find((i) => i.id === i2Id) ?? CONSTRAINT_INDICES[1];

  // Sensible default Cc = median(I2) / median(I1), so the coupling line passes
  // through roughly the middle of the cloud. Slider maps log-linearly to
  // (default/100, default·100).
  const { Cc, CcMin, CcMax, defaultCc, rankedRows } = useMemo(() => {
    const rows: RankedRow[] = [];
    for (const m of materials.filter((m) => !whitelist || whitelist.has(m.id))) {
      const I1 = index1.computeI(m);
      const I2 = index2.computeI(m);
      if (
        I1 !== undefined &&
        I2 !== undefined &&
        Number.isFinite(I1) &&
        Number.isFinite(I2)
      ) {
        rows.push({ material: m, I1, I2, minmax: 0 });
      }
    }
    if (rows.length === 0) {
      return { Cc: 1, CcMin: 0.01, CcMax: 100, defaultCc: 1, rankedRows: [] };
    }
    const sorted1 = [...rows].map((r) => r.I1).sort((a, b) => a - b);
    const sorted2 = [...rows].map((r) => r.I2).sort((a, b) => a - b);
    const m1 = sorted1[Math.floor(sorted1.length / 2)];
    const m2 = sorted2[Math.floor(sorted2.length / 2)];
    const natural = m2 / m1;
    const cMin = natural / 100;
    const cMax = natural * 100;
    const c = cMin * Math.pow(cMax / cMin, ccSliderPos / 100);

    for (const r of rows) {
      r.minmax = Math.max(r.I1, r.I2 / c);
    }
    rows.sort((a, b) => a.minmax - b.minmax);

    return { Cc: c, CcMin: cMin, CcMax: cMax, defaultCc: natural, rankedRows: rows };
  }, [index1, index2, ccSliderPos, whitelist]);

  return (
    <>
      <section className="trade-off-section">
        <h2>1. Pick two competing constraints</h2>
        <p className="eco-help">
          Each constraint is encoded as a minimization-form material index — small value means
          this material is light to satisfy that constraint. Choose the two constraints that
          could both bind in your design (Ashby §9.2).
        </p>
        <div className="controls">
          <div className="control-group">
            <label htmlFor="i1">Constraint 1 (I₁, x-axis):</label>
            <select id="i1" value={i1Id} onChange={(e) => setI1Id(e.target.value)}>
              {CONSTRAINT_INDICES.map((idx) => (
                <option key={idx.id} value={idx.id}>
                  {idx.label} ({idx.expr})
                </option>
              ))}
            </select>
          </div>
          <div className="control-group">
            <label htmlFor="i2">Constraint 2 (I₂, y-axis):</label>
            <select id="i2" value={i2Id} onChange={(e) => setI2Id(e.target.value)}>
              {CONSTRAINT_INDICES.map((idx) => (
                <option key={idx.id} value={idx.id}>
                  {idx.label} ({idx.expr})
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="trade-off-section">
        <h2>2. Coupling constant Cc</h2>
        <p className="eco-help">
          The coupling constant <strong>Cc</strong> encodes the design geometry: it sets where
          the slope-1 coupling line sits in the (I₁, I₂) plane. The optimum material minimizes{' '}
          <strong>m̃ = max(I₁, I₂ / Cc)</strong>. Materials <em>above</em> the coupling line are
          constraint-2-limited; materials <em>below</em> are constraint-1-limited.
        </p>
        <div className="alpha-row">
          <label htmlFor="cc">
            Cc = <strong>{Cc.toPrecision(3)}</strong>{' '}
            <span className="alpha-unit">{index2.expr} per ({index1.expr})</span>
          </label>
          <input
            id="cc"
            type="range"
            min={0}
            max={100}
            step={0.5}
            value={ccSliderPos}
            onChange={(e) => setCcSliderPos(parseFloat(e.target.value))}
          />
          <span className="slider-bounds">
            {CcMin.toPrecision(2)} ↔ {CcMax.toPrecision(2)}
          </span>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={showSelectionBox}
              onChange={(e) => setShowSelectionBox(e.target.checked)}
            />
            Selection box
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={showPareto}
              onChange={(e) => setShowPareto(e.target.checked)}
            />
            Pareto front
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
          <button onClick={() => setCcSliderPos(15)}>← Small Cc (C2 binds)</button>
          <button onClick={() => setCcSliderPos(35)}>Lean C2</button>
          <button onClick={() => setCcSliderPos(50)}>Balanced</button>
          <button onClick={() => setCcSliderPos(65)}>Lean C1</button>
          <button onClick={() => setCcSliderPos(85)}>Large Cc (C1 binds) →</button>
        </div>
        <p className="phase-note">
          Default Cc = {defaultCc.toPrecision(2)} (median ratio of the data — a neutral starting
          point, not a physical value). For real design, set Cc from geometry: in Ashby's tie
          example, Cc = L*·S* / F_f* where L* is length, S* the stiffness target, F_f* the
          failure-load target. Small Cc ⇒ constraint 2 (y-axis) tends to bind; large Cc ⇒
          constraint 1 (x-axis) tends to bind.
        </p>
      </section>

      <CouplingChart
        index1={index1}
        index2={index2}
        Cc={Cc}
        showPareto={showPareto}
        showSelectionBox={showSelectionBox}
        showLabels={showLabels}
      />

      <section className="trade-off-section">
        <h2>3. Results</h2>
        <div className="totals-grid">
          <div className="total-card grand">
            <div className="total-label">Optimum (min m̃)</div>
            <div className="total-value">
              {rankedRows[0]?.material.name ?? '—'}
            </div>
            <div className="unit">
              m̃ = {rankedRows[0] ? rankedRows[0].minmax.toPrecision(3) : '—'}
            </div>
          </div>
          <div className="total-card">
            <div className="total-label">Active constraint at optimum</div>
            <div className="total-value">
              {rankedRows[0]
                ? rankedRows[0].I1 >= rankedRows[0].I2 / Cc
                  ? index1.label
                  : index2.label
                : '—'}
            </div>
          </div>
        </div>

        <div className="selected-panel">
          <div className="selected-header">
            <h3>
              Ranked by m̃ <span className="count-badge dark">{rankedRows.length}</span>
            </h3>
            <span className="sort-note">smallest m̃ at top · active constraint shown</span>
          </div>
          {rankedRows.length === 0 ? (
            <p className="empty-note">No materials have both indices defined.</p>
          ) : (
            <ol className="selected-list">
              {rankedRows.slice(0, 15).map((r, i) => {
                const family = familyById[r.material.family];
                const i1Active = r.I1 >= r.I2 / Cc;
                return (
                  <li key={r.material.id} className="selected-row">
                    <span className="rank">{i + 1}</span>
                    <span
                      className="family-chip small"
                      style={{ background: family.color }}
                      title={family.label}
                    />
                    <span className="material-name">{r.material.name}</span>
                    <span className="props">
                      <span className="prop">
                        <span className="prop-label">I₁</span> {r.I1.toPrecision(3)}
                      </span>
                      <span className="prop">
                        <span className="prop-label">I₂</span> {r.I2.toPrecision(3)}
                      </span>
                      <span className="prop">
                        <span className="prop-label">active</span> {i1Active ? '①' : '②'}
                      </span>
                    </span>
                    <span className="m-value" title="min-max metric">
                      m̃={r.minmax.toPrecision(3)}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
          {rankedRows.length > 15 && (
            <p className="phase-note" style={{ marginTop: 8 }}>
              Showing top 15 of {rankedRows.length} materials.
            </p>
          )}
        </div>
      </section>

      <footer className="app-footer">
        <p>
          The coupling-chart / min-max method is from Ashby, <em>Materials Selection in Mechanical Design</em>{' '}
          (6th ed., 2025) §9.2 and Fig 9.5 (right). When a single objective (here, mass) is
          governed by multiple constraints, each constraint defines its own performance equation
          and material index. The actual mass equals <strong>max(m_i)</strong> over the
          constraints. Plotting two such indices against each other and adding a slope-1{' '}
          <strong>coupling line</strong> (whose position is the dimensionless coupling constant
          Cc = L*·S*/F_f*) lets you read off the optimum as the material whose point first hits
          a rectangle tangent to the coupling line.
        </p>
      </footer>
    </>
  );
}
