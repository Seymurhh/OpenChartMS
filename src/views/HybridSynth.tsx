import { useMemo, useState } from 'react';
import Plot from 'react-plotly.js';
import type { Layout, PlotData, Shape } from 'plotly.js';
import { families, familyById, materials } from '../data/loadMaterials';
import { PROPERTY_META, type Material } from '../data/types';
import {
  voigtComposite,
  reussComposite,
  openCellFoam,
  closedCellFoam,
  sandwichPanel,
  type HybridResult,
} from '../lib/hybrid';

type HybridKind = 'composite' | 'foam-open' | 'foam-closed' | 'sandwich';

function geomean(a: number, b: number): number {
  return Math.sqrt(a * b);
}

const ELIGIBLE = materials.filter(
  (m) => m.properties.youngs_modulus_GPa && m.properties.density_kg_m3,
);

const FAMILY_COLOR = (m: Material): string => familyById[m.family].color;

// Build a sweep of f ∈ [0, 1] for composites, ρ̄ ∈ [0.01, 0.5] for foams, t/c ∈ [0.02, 0.4] for sandwiches.
function sweep(kind: HybridKind, m1: Material, m2: Material): HybridResult[] {
  const N = 40;
  const out: HybridResult[] = [];
  if (kind === 'composite') {
    for (let i = 0; i <= N; i++) {
      const f = i / N;
      const v = voigtComposite(m1, m2, f);
      if (v) out.push(v);
    }
    for (let i = 0; i <= N; i++) {
      const f = i / N;
      const r = reussComposite(m1, m2, f);
      if (r) out.push(r);
    }
  } else if (kind === 'foam-open' || kind === 'foam-closed') {
    for (let i = 1; i <= N; i++) {
      const rho = 0.01 + (0.6 - 0.01) * (i / N);
      const fn = kind === 'foam-open' ? openCellFoam : closedCellFoam;
      const v = fn(m1, rho);
      if (v) out.push(v);
    }
  } else {
    for (let i = 1; i <= N; i++) {
      const t = 0.02 + (0.4 - 0.02) * (i / N);
      const v = sandwichPanel(m1, m2, t);
      if (v) out.push(v);
    }
  }
  return out;
}

export function HybridSynth() {
  const [kind, setKind] = useState<HybridKind>('composite');
  const [m1Id, setM1Id] = useState('cfrp');
  const [m2Id, setM2Id] = useState('epoxy');
  const [fSlider, setFSlider] = useState(50); // 0..100, used for f, ρ̄, or t/c depending on kind

  const m1 = ELIGIBLE.find((m) => m.id === m1Id) ?? ELIGIBLE[0];
  const m2 = ELIGIBLE.find((m) => m.id === m2Id) ?? ELIGIBLE[0];

  // Map slider position to the parameter range for the current hybrid kind.
  const param = useMemo(() => {
    if (kind === 'composite') return fSlider / 100; // f
    if (kind === 'sandwich') return 0.02 + (0.4 - 0.02) * (fSlider / 100); // t/c
    return 0.01 + (0.6 - 0.01) * (fSlider / 100); // ρ̄
  }, [kind, fSlider]);

  const current = useMemo<HybridResult[]>(() => {
    if (kind === 'composite') {
      const v = voigtComposite(m1, m2, param);
      const r = reussComposite(m1, m2, param);
      return [v, r].filter((x): x is HybridResult => x !== null);
    }
    if (kind === 'foam-open') {
      const v = openCellFoam(m1, param);
      return v ? [v] : [];
    }
    if (kind === 'foam-closed') {
      const v = closedCellFoam(m1, param);
      return v ? [v] : [];
    }
    if (kind === 'sandwich') {
      const v = sandwichPanel(m1, m2, param);
      return v ? [v] : [];
    }
    return [];
  }, [kind, m1, m2, param]);

  const sweepPoints = useMemo(() => sweep(kind, m1, m2), [kind, m1, m2]);

  // Family-colored ellipses for context (same look as Material charts E–ρ).
  const ellipses: Partial<Shape>[] = useMemo(
    () =>
      ELIGIBLE.map((m) => {
        const r = m.properties.density_kg_m3!;
        const e = m.properties.youngs_modulus_GPa!;
        const color = FAMILY_COLOR(m);
        return {
          type: 'circle',
          xref: 'x',
          yref: 'y',
          x0: r.min,
          x1: r.max,
          y0: e.min,
          y1: e.max,
          fillcolor: color,
          opacity: 0.25,
          line: { color, width: 0.5 },
          layer: 'below',
        } satisfies Partial<Shape>;
      }),
    [],
  );

  const familyTraces: Partial<PlotData>[] = useMemo(
    () =>
      families.map((f) => {
        const items = ELIGIBLE.filter((m) => m.family === f.id);
        return {
          type: 'scatter',
          mode: 'markers',
          name: f.label,
          x: items.map((m) =>
            geomean(m.properties.density_kg_m3!.min, m.properties.density_kg_m3!.max),
          ),
          y: items.map((m) =>
            geomean(m.properties.youngs_modulus_GPa!.min, m.properties.youngs_modulus_GPa!.max),
          ),
          text: items.map((m) => m.short_name ?? m.name),
          marker: { color: f.color, size: 6, line: { color: 'white', width: 1 } },
          hovertemplate: '<b>%{text}</b><br>ρ=%{x:.3g} kg/m³<br>E=%{y:.3g} GPa<extra></extra>',
        };
      }),
    [],
  );

  // Sweep trace (Voigt curve, Reuss curve, foam scaling line, etc.)
  const sweepTraces: Partial<PlotData>[] = useMemo(() => {
    const out: Partial<PlotData>[] = [];
    if (kind === 'composite') {
      const voigt = sweepPoints.filter((p) => p.kind === 'composite-voigt');
      const reuss = sweepPoints.filter((p) => p.kind === 'composite-reuss');
      out.push({
        type: 'scatter',
        mode: 'lines',
        name: 'Voigt bound',
        x: voigt.map((p) => p.rho_kg_m3),
        y: voigt.map((p) => p.E_GPa),
        line: { color: '#1a1a1a', width: 2 },
        hoverinfo: 'skip',
      });
      out.push({
        type: 'scatter',
        mode: 'lines',
        name: 'Reuss bound',
        x: reuss.map((p) => p.rho_kg_m3),
        y: reuss.map((p) => p.E_GPa),
        line: { color: '#1a1a1a', width: 2, dash: 'dash' },
        hoverinfo: 'skip',
      });
    } else {
      out.push({
        type: 'scatter',
        mode: 'lines',
        name: kind === 'sandwich' ? 'Sandwich sweep' : 'Foam scaling',
        x: sweepPoints.map((p) => p.rho_kg_m3),
        y: sweepPoints.map((p) => p.E_GPa),
        line: { color: '#1a1a1a', width: 2 },
        hoverinfo: 'skip',
      });
    }
    return out;
  }, [kind, sweepPoints]);

  // Current hybrid point(s) — one or two markers depending on kind
  const currentTrace: Partial<PlotData> = useMemo(
    () => ({
      type: 'scatter',
      mode: 'text+markers',
      name: 'Current hybrid',
      x: current.map((p) => p.rho_kg_m3),
      y: current.map((p) => p.E_GPa),
      text: current.map((p) => p.label),
      textposition: 'top right',
      textfont: { size: 10, color: '#c00' },
      marker: {
        color: '#c00',
        size: 14,
        symbol: 'diamond',
        line: { color: 'white', width: 2 },
      },
      hovertemplate: '%{text}<br>ρ=%{x:.3g} kg/m³<br>E=%{y:.3g} GPa<extra>Hybrid</extra>',
    }),
    [current],
  );

  const layout: Partial<Layout> = {
    title: { text: 'Hybrid synthesizer · E vs ρ', font: { size: 18 } },
    xaxis: { title: { text: 'Density ρ [kg/m³]' }, type: 'log', gridcolor: '#e5e5e5' },
    yaxis: { title: { text: "Young's modulus E [GPa]" }, type: 'log', gridcolor: '#e5e5e5' },
    shapes: ellipses,
    showlegend: true,
    legend: { x: 1.02, y: 1, xanchor: 'left', yanchor: 'top' },
    margin: { l: 80, r: 220, t: 60, b: 70 },
    plot_bgcolor: '#fafafa',
    paper_bgcolor: 'white',
    hovermode: 'closest',
  };

  const needsTwoMaterials = kind === 'composite' || kind === 'sandwich';
  const xMeta = PROPERTY_META.density_kg_m3;
  const yMeta = PROPERTY_META.youngs_modulus_GPa;
  void xMeta;
  void yMeta;

  const paramLabel = () => {
    if (kind === 'composite') return `f (volume fraction of ${m1.short_name ?? m1.name})`;
    if (kind === 'sandwich') return `t/c (face thickness fraction)`;
    return 'ρ̄ (relative density)';
  };

  return (
    <>
      <section className="trade-off-section">
        <h2>1. Pick the hybrid family</h2>
        <p className="eco-help">
          A hybrid combines two materials (and possibly empty space) at microstructural scale to
          fill holes in property space (Ashby Ch. 13). Each family has its own scaling law on
          the E vs ρ chart.
        </p>
        <div className="controls">
          {(['composite', 'foam-open', 'foam-closed', 'sandwich'] as const).map((k) => (
            <label key={k} className="checkbox">
              <input
                type="radio"
                name="hybrid-kind"
                checked={kind === k}
                onChange={() => setKind(k)}
              />
              {k === 'composite' && 'Composite (Voigt/Reuss bounds)'}
              {k === 'foam-open' && 'Open-cell foam (E*∝ρ̄²)'}
              {k === 'foam-closed' && 'Closed-cell foam (Gibson–Ashby)'}
              {k === 'sandwich' && 'Sandwich panel'}
            </label>
          ))}
        </div>
      </section>

      <section className="trade-off-section">
        <h2>2. Pick components</h2>
        <div className="controls">
          <div className="control-group">
            <label htmlFor="m1">
              {kind === 'sandwich' ? 'Face material:' : kind.startsWith('foam') ? 'Solid material:' : 'Material 1:'}
            </label>
            <select id="m1" value={m1Id} onChange={(e) => setM1Id(e.target.value)}>
              {ELIGIBLE.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          {needsTwoMaterials && (
            <div className="control-group">
              <label htmlFor="m2">{kind === 'sandwich' ? 'Core material:' : 'Material 2:'}</label>
              <select id="m2" value={m2Id} onChange={(e) => setM2Id(e.target.value)}>
                {ELIGIBLE.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </section>

      <section className="trade-off-section">
        <h2>3. Set the parameter</h2>
        <div className="alpha-row">
          <label htmlFor="param">
            {paramLabel()} = <strong>{param.toFixed(3)}</strong>
          </label>
          <input
            id="param"
            type="range"
            min={0}
            max={100}
            step={1}
            value={fSlider}
            onChange={(e) => setFSlider(parseFloat(e.target.value))}
          />
        </div>
        <p className="phase-note">
          {kind === 'composite' && 'f = 0 ⇒ pure material 2; f = 1 ⇒ pure material 1. Voigt is the upper bound (aligned fibers); Reuss is the lower bound (transverse loading).'}
          {kind === 'foam-open' && 'ρ̄ = ρ_foam / ρ_solid. Lower relative density ⇒ lighter and softer. E*/E_s ≈ ρ̄² (bend-dominated cell walls).'}
          {kind === 'foam-closed' && 'Closed-cell foams are stiffer than open-cell at the same ρ̄ because cell faces also carry stretch loads.'}
          {kind === 'sandwich' && 'Faces are stiff but heavy; core is light but compliant. Thicker faces ⇒ more stiffness AND more mass.'}
        </p>
      </section>

      <Plot
        data={[...familyTraces, ...sweepTraces, currentTrace]}
        layout={layout}
        config={{ responsive: true, displaylogo: false }}
        style={{ width: '100%', height: '640px' }}
        useResizeHandler
      />

      <section className="trade-off-section">
        <h2>4. Hybrid properties</h2>
        <div className="totals-grid">
          {current.map((c) => (
            <div key={c.kind} className="total-card grand">
              <div className="total-label">{c.kind.replace(/-/g, ' ')}</div>
              <div className="total-value">
                E = {c.E_GPa.toPrecision(3)} <span className="unit">GPa</span>
              </div>
              <div className="unit">ρ = {c.rho_kg_m3.toPrecision(3)} kg/m³</div>
              <div className="unit" style={{ marginTop: 8 }}>{c.detail}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="app-footer">
        <p>
          Hybrid synthesis follows Ashby <em>Materials Selection in Mechanical Design</em> (6th
          ed., 2025) Ch. 13. Voigt and Reuss bound continuous-fiber composites; the Gibson–Ashby
          law captures foam scaling; sandwich panels achieve high bending stiffness per mass via
          face/core decoupling. The red diamond is the current hybrid; the line traces the locus
          as the parameter sweeps.
        </p>
      </footer>
    </>
  );
}
