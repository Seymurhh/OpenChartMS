import { useMemo, useState } from 'react';
import Plot from 'react-plotly.js';
import type { Layout, PlotData } from 'plotly.js';
import { PROCESSES, PROCESS_FAMILY_LABEL, processUnitCost } from '../data/processes';
import { materials, familyById } from '../data/loadMaterials';
import type { Material, FamilyId } from '../data/types';

function midRange(r: { min: number; max: number } | undefined): number {
  if (!r) return NaN;
  return Math.sqrt(r.min * r.max);
}

const PROCESS_PALETTE = [
  '#E63946', '#264653', '#2A9D8F', '#F4A261', '#A663CC',
  '#43AA8B', '#E9C46A', '#6A994E', '#6495ED', '#FF7F50',
];

export function ProcessSelection() {
  const [materialId, setMaterialId] = useState<string>('low-carbon-steel');
  const [section_mm, setSection] = useState(5);
  const [tolerance_mm, setTolerance] = useState(0.5);
  const [mass_kg, setMass] = useState(1);
  const [logBatchMin, setLogBatchMin] = useState(0); // 10^0 = 1
  const [logBatchMax, setLogBatchMax] = useState(6); // 10^6 = 1M

  const material = materials.find((m) => m.id === materialId);
  const familyId: FamilyId | undefined = material?.family;
  const materialPrice = midRange(material?.properties.price_USD_kg);

  // Screening: which processes are feasible for the current spec?
  const feasibility = useMemo(() => {
    const rows = PROCESSES.map((p) => {
      const reasons: string[] = [];
      let ok = true;
      if (familyId && !p.compatibleFamilies.includes(familyId)) {
        reasons.push(`incompatible with ${familyById[familyId].label}`);
        ok = false;
      }
      if (section_mm < p.sectionMin_mm) {
        reasons.push(`min section ${p.sectionMin_mm} mm > spec ${section_mm} mm`);
        ok = false;
      }
      if (section_mm > p.sectionMax_mm) {
        reasons.push(`max section ${p.sectionMax_mm} mm < spec ${section_mm} mm`);
        ok = false;
      }
      if (tolerance_mm < p.toleranceMin_mm) {
        reasons.push(`tolerance floor ${p.toleranceMin_mm} mm > spec ${tolerance_mm} mm`);
        ok = false;
      }
      return { p, ok, reasons };
    });
    rows.sort((a, b) => (a.ok === b.ok ? a.p.name.localeCompare(b.p.name) : a.ok ? -1 : 1));
    return rows;
  }, [familyId, section_mm, tolerance_mm]);

  const feasibleProcesses = feasibility.filter((r) => r.ok).map((r) => r.p);

  // Cost curves: per-part cost vs batch size, log-log, one curve per feasible process.
  const costTraces: Partial<PlotData>[] = useMemo(() => {
    if (!Number.isFinite(materialPrice)) return [];
    const bMinLog = Math.min(logBatchMin, logBatchMax);
    const bMaxLog = Math.max(logBatchMin, logBatchMax);
    const N = 40;
    return feasibleProcesses.map((p, i) => {
      const xs: number[] = [];
      const ys: number[] = [];
      for (let k = 0; k <= N; k++) {
        const t = k / N;
        const batch = Math.pow(10, bMinLog + t * (bMaxLog - bMinLog));
        // Only show within process's own batch range, otherwise NaN to break the line
        if (batch < p.batchMin || batch > p.batchMax) {
          xs.push(batch);
          ys.push(NaN);
        } else {
          xs.push(batch);
          ys.push(processUnitCost(p, batch, mass_kg, materialPrice));
        }
      }
      return {
        type: 'scatter',
        mode: 'lines',
        name: p.name,
        x: xs,
        y: ys,
        line: { color: PROCESS_PALETTE[i % PROCESS_PALETTE.length], width: 2 },
        hovertemplate: `<b>${p.name}</b><br>Batch: %{x:.0f}<br>Unit cost: $%{y:.2f}<extra></extra>`,
      } satisfies Partial<PlotData>;
    });
  }, [feasibleProcesses, mass_kg, materialPrice, logBatchMin, logBatchMax]);

  const layout: Partial<Layout> = {
    title: { text: 'Process cost vs batch size', font: { size: 16 } },
    xaxis: { title: { text: 'Batch size (units)' }, type: 'log', gridcolor: '#e5e5e5' },
    yaxis: { title: { text: 'Unit cost (USD/part)' }, type: 'log', gridcolor: '#e5e5e5' },
    showlegend: true,
    legend: { x: 1.02, y: 1, xanchor: 'left', yanchor: 'top' },
    margin: { l: 80, r: 240, t: 50, b: 70 },
    plot_bgcolor: '#fafafa',
    paper_bgcolor: 'white',
    hovermode: 'closest',
  };

  return (
    <>
      <section className="trade-off-section">
        <h2>1. Specify the part</h2>
        <div className="controls">
          <div className="control-group">
            <label htmlFor="material">Material:</label>
            <select
              id="material"
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
            >
              {[...materials]
                .sort((a: Material, b: Material) => a.family.localeCompare(b.family) || a.name.localeCompare(b.name))
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
        <div className="controls">
          <div className="control-group">
            <label htmlFor="sect">Section thickness (mm):</label>
            <input
              id="sect"
              type="number"
              min={0.01}
              step={0.1}
              value={section_mm}
              onChange={(e) => setSection(Math.max(0.01, parseFloat(e.target.value) || 0))}
              style={{ width: 100 }}
            />
          </div>
          <div className="control-group">
            <label htmlFor="tol">Tolerance (mm):</label>
            <input
              id="tol"
              type="number"
              min={0.001}
              step={0.01}
              value={tolerance_mm}
              onChange={(e) => setTolerance(Math.max(0.001, parseFloat(e.target.value) || 0))}
              style={{ width: 100 }}
            />
          </div>
          <div className="control-group">
            <label htmlFor="mass">Part mass (kg):</label>
            <input
              id="mass"
              type="number"
              min={0.01}
              step={0.1}
              value={mass_kg}
              onChange={(e) => setMass(Math.max(0.01, parseFloat(e.target.value) || 0))}
              style={{ width: 100 }}
            />
          </div>
        </div>
      </section>

      <section className="trade-off-section">
        <h2>2. Screening result</h2>
        <p className="eco-help">
          A process passes screening when the material family is compatible AND the part's
          section and tolerance fit inside the process's attribute range. See Ashby §7.3.
        </p>
        <table className="limits-table">
          <thead>
            <tr>
              <th>Process</th>
              <th>Family</th>
              <th>Pass?</th>
              <th>Section range (mm)</th>
              <th>Tol min (mm)</th>
              <th>Batch range</th>
              <th>Reasons</th>
            </tr>
          </thead>
          <tbody>
            {feasibility.map(({ p, ok, reasons }) => (
              <tr key={p.id} style={{ opacity: ok ? 1 : 0.5 }}>
                <td>{p.name}</td>
                <td>{PROCESS_FAMILY_LABEL[p.family]}</td>
                <td>
                  <span
                    className="family-chip"
                    style={{
                      background: ok ? '#2a7a4a' : '#c00',
                      fontSize: 11,
                    }}
                  >
                    {ok ? '✓ pass' : '✗ fail'}
                  </span>
                </td>
                <td>
                  {p.sectionMin_mm}–{p.sectionMax_mm}
                </td>
                <td>±{p.toleranceMin_mm}</td>
                <td>
                  {p.batchMin}–{p.batchMax.toLocaleString()}
                </td>
                <td style={{ fontSize: 12, color: '#888' }}>
                  {reasons.join('; ') || (ok ? p.description : '')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {feasibleProcesses.length > 0 && (
        <section className="trade-off-section">
          <h2>3. Cost vs batch size</h2>
          <p className="eco-help">
            Each feasible process's per-part cost <em>C = m·Cm + C_tooling/n +
              C_capital·t_cycle/(n·utilization)</em>. Tooling-heavy processes (die casting,
            injection molding) cross over flexible processes (machining, AM) at higher batch
            sizes. The lower envelope across all curves is the cost-optimal process at each
            batch size.
          </p>
          <div className="alpha-row">
            <label>
              Batch range: 10<sup>{logBatchMin}</sup> – 10<sup>{logBatchMax}</sup>
            </label>
            <input
              type="range"
              min={0}
              max={4}
              step={1}
              value={logBatchMin}
              onChange={(e) => setLogBatchMin(parseInt(e.target.value, 10))}
              style={{ flex: 1, maxWidth: 200 }}
            />
            <input
              type="range"
              min={2}
              max={8}
              step={1}
              value={logBatchMax}
              onChange={(e) => setLogBatchMax(parseInt(e.target.value, 10))}
              style={{ flex: 1, maxWidth: 200 }}
            />
          </div>
          <Plot
            data={costTraces}
            layout={layout}
            config={{ responsive: true, displaylogo: false }}
            style={{ width: '100%', height: '500px' }}
            useResizeHandler
          />
        </section>
      )}

      <footer className="app-footer">
        <p>
          Process selection follows Ashby <em>Materials Selection in Mechanical Design</em>{' '}
          (6th ed., 2025) Ch. 7. Screening uses a process-attribute matrix (material family,
          section, tolerance). Ranking uses a unit-cost model with material, tooling, and
          capital terms. Tooling-heavy processes win at high volume; flexible processes win at
          low volume — the curves cross at the <em>economic batch size</em>. Process attribute
          values here are order-of-magnitude defaults from Table 7.4 — adjust for your specific
          machine/site.
        </p>
      </footer>
    </>
  );
}
