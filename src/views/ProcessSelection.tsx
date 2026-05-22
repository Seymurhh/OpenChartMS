import { useMemo, useState } from 'react';
import Plot from 'react-plotly.js';
import type { Layout, PlotData } from 'plotly.js';
import {
  PROCESSES,
  PROCESS_FAMILY_LABEL,
  SHAPE_CLASS_LABEL,
  processUnitCost,
  processUnitCostBreakdown,
  type ShapeClass,
} from '../data/processes';
import { materials, familyById } from '../data/loadMaterials';
import type { Material, FamilyId } from '../data/types';
import { AXIS_STYLE, HOVER_LABEL, LEGEND_STYLE, PAPER_BG, PLOT_BG } from '../lib/chartStyle';

function midRange(r: { min: number; max: number } | undefined): number {
  if (!r) return NaN;
  return Math.sqrt(r.min * r.max);
}

const PROCESS_PALETTE = [
  '#E63946', '#264653', '#2A9D8F', '#F4A261', '#A663CC',
  '#43AA8B', '#E9C46A', '#6A994E', '#6495ED', '#FF7F50',
];

const SHAPE_OPTIONS: ShapeClass[] = ['solid-3D', 'hollow-3D', 'sheet', 'prismatic', 'complex'];

export function ProcessSelection() {
  const [materialId, setMaterialId] = useState<string>('low-carbon-steel');
  const [section_mm, setSection] = useState(5);
  const [tolerance_mm, setTolerance] = useState(0.5);
  const [roughness_um, setRoughness] = useState(25); // permissive Ra ceiling
  const [mass_kg, setMass] = useState(1);
  const [partShape, setPartShape] = useState<ShapeClass>('solid-3D');
  const [utilization, setUtilization] = useState(0.5);
  const [logBatchMin, setLogBatchMin] = useState(0); // 10^0 = 1
  const [logBatchMax, setLogBatchMax] = useState(6); // 10^6 = 1M

  const material = materials.find((m) => m.id === materialId);
  const familyId: FamilyId | undefined = material?.family;
  const materialPrice = midRange(material?.properties.price_USD_kg);

  // Screening: which processes are feasible for the current spec?
  // Per Ashby §7.3: a process passes only if EVERY attribute (family, shape,
  // section, tolerance, surface finish) is satisfied. One miss = elimination.
  const feasibility = useMemo(() => {
    const rows = PROCESSES.map((p) => {
      const reasons: string[] = [];
      let ok = true;
      if (familyId && !p.compatibleFamilies.includes(familyId)) {
        reasons.push(`incompatible with ${familyById[familyId].label}`);
        ok = false;
      }
      if (!p.shapes.includes(partShape)) {
        reasons.push(`cannot make ${SHAPE_CLASS_LABEL[partShape]} shapes`);
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
      if (
        p.surfaceRoughness_um !== undefined &&
        roughness_um < p.surfaceRoughness_um
      ) {
        reasons.push(
          `typical Ra ${p.surfaceRoughness_um} µm > spec ${roughness_um} µm`,
        );
        ok = false;
      }
      return { p, ok, reasons };
    });
    rows.sort((a, b) => (a.ok === b.ok ? a.p.name.localeCompare(b.p.name) : a.ok ? -1 : 1));
    return rows;
  }, [familyId, partShape, section_mm, tolerance_mm, roughness_um]);

  const feasibleProcesses = feasibility.filter((r) => r.ok).map((r) => r.p);

  // Cost curves: per-part cost vs batch size, log-log, one curve per feasible
  // process. We also build the LOWER ENVELOPE — at each batch size, the cheapest
  // feasible process — which is the actual teaching tool of Ashby Fig 7.6.
  const { costTraces, envelopeTrace } = useMemo(() => {
    if (!Number.isFinite(materialPrice)) {
      return { costTraces: [] as Partial<PlotData>[], envelopeTrace: null as Partial<PlotData> | null };
    }
    const bMinLog = Math.min(logBatchMin, logBatchMax);
    const bMaxLog = Math.max(logBatchMin, logBatchMax);
    const N = 80;

    // Shared x-axis (batch sizes) so the envelope can be computed column-wise.
    const batches: number[] = [];
    for (let k = 0; k <= N; k++) {
      const t = k / N;
      batches.push(Math.pow(10, bMinLog + t * (bMaxLog - bMinLog)));
    }

    const traces: Partial<PlotData>[] = feasibleProcesses.map((p, i) => {
      const ys: number[] = [];
      const breakdown: Array<[number, number, number]> = [];
      for (const batch of batches) {
        if (batch < p.batchMin || batch > p.batchMax) {
          ys.push(NaN);
          breakdown.push([NaN, NaN, NaN]);
        } else {
          const b = processUnitCostBreakdown(p, batch, mass_kg, materialPrice, utilization);
          ys.push(b.total);
          breakdown.push([b.material, b.tooling, b.capital]);
        }
      }
      return {
        type: 'scatter',
        mode: 'lines',
        name: p.name,
        x: batches,
        y: ys,
        customdata: breakdown,
        line: { color: PROCESS_PALETTE[i % PROCESS_PALETTE.length], width: 2 },
        hovertemplate:
          `<b>${p.name}</b><br>` +
          `Batch: %{x:.0f}<br>` +
          `<b>Unit cost: $%{y:.2f}</b><br>` +
          `  · Material: $%{customdata[0]:.2f}<br>` +
          `  · Tooling/part: $%{customdata[1]:.2f}<br>` +
          `  · Capital/part: $%{customdata[2]:.2f}` +
          `<extra></extra>`,
      } satisfies Partial<PlotData>;
    });

    // Per-batch lower envelope across all feasible processes.
    const envY: number[] = batches.map((batch) => {
      let best = Infinity;
      for (const p of feasibleProcesses) {
        if (batch < p.batchMin || batch > p.batchMax) continue;
        const c = processUnitCost(p, batch, mass_kg, materialPrice, utilization);
        if (c < best) best = c;
      }
      return Number.isFinite(best) ? best : NaN;
    });

    const env: Partial<PlotData> = {
      type: 'scatter',
      mode: 'lines',
      name: 'Lower envelope (cheapest at each batch)',
      x: batches,
      y: envY,
      line: { color: '#1a1a1a', width: 4 },
      hovertemplate:
        `<b>Cheapest available</b><br>Batch: %{x:.0f}<br>Unit cost: $%{y:.2f}<extra></extra>`,
    };

    return { costTraces: traces, envelopeTrace: env };
  }, [feasibleProcesses, mass_kg, materialPrice, logBatchMin, logBatchMax, utilization]);

  const layout: Partial<Layout> = {
    title: { text: 'Process cost vs batch size', font: { size: 16, color: '#2a2a26', family: 'Inter, sans-serif' } },
    xaxis: {
      ...AXIS_STYLE,
      title: { text: 'Batch size (units)', font: { color: '#52524E', size: 13 } },
      type: 'log',
    },
    yaxis: {
      ...AXIS_STYLE,
      title: { text: 'Unit cost (USD/part)', font: { color: '#52524E', size: 13 } },
      type: 'log',
    },
    showlegend: true,
    legend: LEGEND_STYLE,
    margin: { l: 80, r: 240, t: 50, b: 70 },
    plot_bgcolor: PLOT_BG,
    paper_bgcolor: PAPER_BG,
    hovermode: 'closest',
    hoverlabel: HOVER_LABEL,
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
            <label htmlFor="shape">Shape class:</label>
            <select
              id="shape"
              value={partShape}
              onChange={(e) => setPartShape(e.target.value as ShapeClass)}
            >
              {SHAPE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {SHAPE_CLASS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
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
            <label htmlFor="rough">Max Ra (µm):</label>
            <input
              id="rough"
              type="number"
              min={0.05}
              step={0.1}
              value={roughness_um}
              onChange={(e) => setRoughness(Math.max(0.05, parseFloat(e.target.value) || 0))}
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
          <div className="control-group">
            <label htmlFor="util">Utilization:</label>
            <input
              id="util"
              type="number"
              min={0.05}
              max={1}
              step={0.05}
              value={utilization}
              onChange={(e) =>
                setUtilization(Math.min(1, Math.max(0.05, parseFloat(e.target.value) || 0.05)))
              }
              style={{ width: 100 }}
            />
          </div>
        </div>
      </section>

      <section className="trade-off-section">
        <h2>2. Screening result</h2>
        <p className="eco-help">
          A process passes screening when EVERY attribute is satisfied: material family,
          shape class, section thickness, tolerance, and surface finish. One mismatch
          eliminates the process. See Ashby §7.3 ("shape classification matrix") and Fig 7.4.
        </p>
        <table className="limits-table">
          <thead>
            <tr>
              <th>Process</th>
              <th>Family</th>
              <th>Pass?</th>
              <th>Shapes</th>
              <th>Section range (mm)</th>
              <th>Tol min (mm)</th>
              <th>Ra (µm)</th>
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
                <td style={{ fontSize: 12 }}>
                  {p.shapes.map((s) => SHAPE_CLASS_LABEL[s]).join(', ')}
                </td>
                <td>
                  {p.sectionMin_mm}–{p.sectionMax_mm}
                </td>
                <td>±{p.toleranceMin_mm}</td>
                <td>{p.surfaceRoughness_um ?? '—'}</td>
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
            data={envelopeTrace ? [...costTraces, envelopeTrace] : costTraces}
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
          (6th ed., 2025) Ch. 7. Screening uses the process-attribute matrix from §7.3:
          material family, <strong>shape class</strong> (Fig 7.1), section thickness, tolerance
          floor, and surface-finish ceiling. Ranking uses the unit-cost model of §7.6,{' '}
          <em>C = m·Cm + C_tool/n + C_cap·t_cycle/(n·η)</em>, with utilization η user-tunable.
          Tooling-heavy processes (die casting, injection molding) cross over flexible
          processes (machining, AM) at higher batch sizes; the heavy black <em>lower envelope</em>{' '}
          traces the cheapest available process at each batch — the actual ranking output of
          Fig 7.6. Process attribute values are order-of-magnitude defaults; adjust for your
          specific machine and site.
        </p>
      </footer>
    </>
  );
}
