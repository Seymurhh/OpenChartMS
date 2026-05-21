import { useMemo, useState } from 'react';
import Plot from 'react-plotly.js';
import type { Layout, PlotData } from 'plotly.js';
import { materials, familyById } from '../data/loadMaterials';
import type { Material, Range } from '../data/types';

interface BOMRow {
  id: string;
  materialId: string;
  mass_kg: number;
}

type Metric = 'energy' | 'co2';

const matById: Record<string, Material> = Object.fromEntries(
  materials.map((m) => [m.id, m]),
);

// Only materials with embodied-energy data are eligible for the BOM dropdown.
const ecoMaterials = materials
  .filter((m) => m.properties.embodied_energy_MJ_kg !== undefined)
  .sort((a, b) => {
    if (a.family !== b.family) return a.family.localeCompare(b.family);
    return a.name.localeCompare(b.name);
  });

const initialBOM: BOMRow[] = [
  { id: 'r1', materialId: 'low-carbon-steel', mass_kg: 8 },
  { id: 'r2', materialId: 'aluminum-alloys', mass_kg: 2 },
  { id: 'r3', materialId: 'polyethylene', mass_kg: 1 },
];

function genId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function mid(r?: Range): number {
  return r ? (r.min + r.max) / 2 : 0;
}

function fmt(n: number): string {
  const abs = Math.abs(n);
  if (abs === 0) return '0';
  if (abs >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (abs >= 10) return n.toFixed(1);
  if (abs >= 1) return n.toFixed(2);
  if (abs >= 0.01) return n.toFixed(3);
  return n.toExponential(2);
}

interface ComponentImpact {
  row: BOMRow;
  material: Material;
  materials_energy: number;
  materials_co2: number;
  eol_energy: number;
  eol_co2: number;
}

export function EcoAudit() {
  const [bom, setBom] = useState<BOMRow[]>(initialBOM);
  const [useEnergy, setUseEnergy] = useState<number>(0);
  const [useCO2, setUseCO2] = useState<number>(0);
  const [recycleEnabled, setRecycleEnabled] = useState(true);
  const [metric, setMetric] = useState<Metric>('energy');

  const addRow = () =>
    setBom([...bom, { id: genId(), materialId: ecoMaterials[0].id, mass_kg: 1 }]);
  const removeRow = (id: string) => setBom(bom.filter((r) => r.id !== id));
  const updateRow = (id: string, patch: Partial<BOMRow>) =>
    setBom(bom.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  // Per-component impact breakdown.
  // Materials phase: mass × embodied_energy (or co2).
  // EoL credit (negative impact): if recycled, the production energy avoided minus
  // the energy spent on recycling. Following Ashby Ch.15: credit = mass × frac × (ee - re).
  // Materials that lack recycle_energy data get 0 credit but still subtract avoided production.
  const breakdown: ComponentImpact[] = useMemo(() => {
    return bom
      .map<ComponentImpact | null>((row) => {
        const m = matById[row.materialId];
        if (!m) return null;
        const ee = mid(m.properties.embodied_energy_MJ_kg);
        const co2 = mid(m.properties.co2_footprint_kg_kg);
        const rf = mid(m.properties.recycle_fraction);
        const re = mid(m.properties.recycle_energy_MJ_kg);
        const rc = mid(m.properties.recycle_co2_kg_kg);

        const matsEnergy = row.mass_kg * ee;
        const matsCO2 = row.mass_kg * co2;

        const eolEnergy = recycleEnabled && rf > 0 ? -row.mass_kg * rf * Math.max(ee - re, 0) : 0;
        const eolCO2 = recycleEnabled && rf > 0 ? -row.mass_kg * rf * Math.max(co2 - rc, 0) : 0;

        return {
          row,
          material: m,
          materials_energy: matsEnergy,
          materials_co2: matsCO2,
          eol_energy: eolEnergy,
          eol_co2: eolCO2,
        };
      })
      .filter((x): x is ComponentImpact => x !== null);
  }, [bom, recycleEnabled]);

  const totals = useMemo(() => {
    const t = {
      materials: { energy: 0, co2: 0 },
      use: { energy: useEnergy, co2: useCO2 },
      eol: { energy: 0, co2: 0 },
    };
    for (const c of breakdown) {
      t.materials.energy += c.materials_energy;
      t.materials.co2 += c.materials_co2;
      t.eol.energy += c.eol_energy;
      t.eol.co2 += c.eol_co2;
    }
    return t;
  }, [breakdown, useEnergy, useCO2]);

  const grandTotal =
    metric === 'energy'
      ? totals.materials.energy + totals.use.energy + totals.eol.energy
      : totals.materials.co2 + totals.use.co2 + totals.eol.co2;

  const unit = metric === 'energy' ? 'MJ' : 'kg CO₂';

  // Stacked bar chart: phases on x, components stacked. Use phase is one trace.
  const traces = useMemo<Partial<PlotData>[]>(() => {
    const phases = ['Materials', 'Use', 'End-of-Life'];

    const componentTraces: Partial<PlotData>[] = breakdown.map((c) => {
      const color = familyById[c.material.family].color;
      const mat = metric === 'energy' ? c.materials_energy : c.materials_co2;
      const eol = metric === 'energy' ? c.eol_energy : c.eol_co2;
      return {
        type: 'bar',
        name: c.material.short_name ?? c.material.name,
        x: phases,
        y: [mat, 0, eol],
        marker: { color },
        hovertemplate: `<b>%{fullData.name}</b><br>%{x}: %{y:.3g} ${unit}<extra></extra>`,
      };
    });

    const usePhaseValue = metric === 'energy' ? useEnergy : useCO2;
    if (usePhaseValue !== 0) {
      componentTraces.push({
        type: 'bar',
        name: 'Use phase',
        x: phases,
        y: [0, usePhaseValue, 0],
        marker: { color: '#555' },
        hovertemplate: `<b>Use phase</b><br>%{y:.3g} ${unit}<extra></extra>`,
      });
    }

    return componentTraces;
  }, [breakdown, metric, useEnergy, useCO2, unit]);

  const layout: Partial<Layout> = {
    title: { text: `Life-cycle ${metric === 'energy' ? 'energy' : 'CO₂'} by phase`, font: { size: 16 } },
    barmode: 'relative',
    xaxis: { title: { text: 'Lifecycle phase' } },
    yaxis: { title: { text: `${metric === 'energy' ? 'Energy' : 'CO₂'} (${unit})` }, zeroline: true, zerolinecolor: '#999' },
    showlegend: true,
    legend: { x: 1.02, y: 1, xanchor: 'left' },
    margin: { l: 80, r: 200, t: 60, b: 60 },
    plot_bgcolor: '#fafafa',
    paper_bgcolor: 'white',
  };

  return (
    <>
      <section className="eco-section">
        <h2>1. Bill of Materials</h2>
        <p className="eco-help">Add each component of your product with its mass.</p>
        <table className="bom-table">
          <thead>
            <tr>
              <th>Material</th>
              <th>Family</th>
              <th style={{ width: '120px' }}>Mass (kg)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {bom.map((row) => {
              const m = matById[row.materialId];
              return (
                <tr key={row.id}>
                  <td>
                    <select
                      value={row.materialId}
                      onChange={(e) => updateRow(row.id, { materialId: e.target.value })}
                    >
                      {ecoMaterials.map((mat) => (
                        <option key={mat.id} value={mat.id}>
                          {mat.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span
                      className="family-chip"
                      style={{ background: m ? familyById[m.family].color : '#ccc' }}
                    >
                      {m ? familyById[m.family].label : '—'}
                    </span>
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      value={row.mass_kg}
                      onChange={(e) =>
                        updateRow(row.id, { mass_kg: Math.max(0, parseFloat(e.target.value) || 0) })
                      }
                    />
                  </td>
                  <td>
                    <button className="btn-remove" onClick={() => removeRow(row.id)} aria-label="Remove">
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <button className="btn-add" onClick={addRow}>
          + Add component
        </button>
      </section>

      <section className="eco-section">
        <h2>2. Use phase</h2>
        <p className="eco-help">
          Energy and CO₂ consumed across the product's service lifetime. Enter totals (e.g., for a car:
          fuel energy × kilometres driven over lifetime).
        </p>
        <div className="use-phase-grid">
          <label>
            Energy over lifetime (MJ)
            <input
              type="number"
              min={0}
              value={useEnergy}
              onChange={(e) => setUseEnergy(Math.max(0, parseFloat(e.target.value) || 0))}
            />
          </label>
          <label>
            CO₂ over lifetime (kg)
            <input
              type="number"
              min={0}
              value={useCO2}
              onChange={(e) => setUseCO2(Math.max(0, parseFloat(e.target.value) || 0))}
            />
          </label>
        </div>
      </section>

      <section className="eco-section">
        <h2>3. End-of-Life</h2>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={recycleEnabled}
            onChange={(e) => setRecycleEnabled(e.target.checked)}
          />
          Apply recycle credit
        </label>
        <p className="eco-help">
          When enabled, EoL phase shows a negative impact equal to{' '}
          <em>mass × recycle_fraction × (production – recycle energy)</em> for each component, the
          virgin-material energy saved by recycling (Ashby Ch.15).
        </p>
      </section>

      <section className="eco-section">
        <h2>4. Results</h2>
        <div className="controls" style={{ marginTop: 0 }}>
          <div className="control-group">
            <label htmlFor="metric">Metric:</label>
            <select id="metric" value={metric} onChange={(e) => setMetric(e.target.value as Metric)}>
              <option value="energy">Embodied energy (MJ)</option>
              <option value="co2">Carbon footprint (kg CO₂)</option>
            </select>
          </div>
        </div>

        <div className="totals-grid">
          <div className="total-card">
            <div className="total-label">Materials</div>
            <div className="total-value">
              {fmt(metric === 'energy' ? totals.materials.energy : totals.materials.co2)} <span className="unit">{unit}</span>
            </div>
          </div>
          <div className="total-card">
            <div className="total-label">Use</div>
            <div className="total-value">
              {fmt(metric === 'energy' ? totals.use.energy : totals.use.co2)} <span className="unit">{unit}</span>
            </div>
          </div>
          <div className="total-card">
            <div className="total-label">End-of-Life</div>
            <div className="total-value eol">
              {fmt(metric === 'energy' ? totals.eol.energy : totals.eol.co2)} <span className="unit">{unit}</span>
            </div>
          </div>
          <div className="total-card grand">
            <div className="total-label">Net total</div>
            <div className="total-value">
              {fmt(grandTotal)} <span className="unit">{unit}</span>
            </div>
          </div>
        </div>

        <Plot
          data={traces}
          layout={layout}
          config={{ responsive: true, displaylogo: false }}
          style={{ width: '100%', height: '420px' }}
          useResizeHandler
        />
      </section>

      <footer className="app-footer">
        <p>
          Eco-Audit follows the bill-of-materials method described in Ashby, <em>Materials Selection
          in Mechanical Design</em> (6th ed., 2025), Chapter 15. Phase 4 MVP simplifies to three
          phases: <em>materials production</em>, <em>use</em>, <em>end-of-life</em>. Manufacturing
          and transport phases will be added when process-energy data is available.
        </p>
      </footer>
    </>
  );
}
