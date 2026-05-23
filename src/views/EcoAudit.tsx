import { useMemo, useState } from 'react';
import Plot from 'react-plotly.js';
import type { Layout, PlotData } from 'plotly.js';
import { materials, familyById } from '../data/loadMaterials';
import type { Material, Range } from '../data/types';
import { AXIS_STYLE, HOVER_LABEL, LEGEND_STYLE, PAPER_BG, PLOT_BG } from '../lib/chartStyle';

interface BOMRow {
  id: string;
  materialId: string;
  mass_kg: number;
}

type Metric = 'energy' | 'co2';

type TransportMode = 'sea' | 'rail' | 'truck' | 'air';

// Per Ashby Table 15.4 — embodied energy of freight (MJ per tonne·km) and
// well-to-wheel CO₂ (kg per tonne·km). Order-of-magnitude for teaching.
const TRANSPORT_FACTORS: Record<
  TransportMode,
  { label: string; mj_t_km: number; co2_t_km: number }
> = {
  sea: { label: 'Ocean freight', mj_t_km: 0.16, co2_t_km: 0.011 },
  rail: { label: 'Rail (electric)', mj_t_km: 0.25, co2_t_km: 0.022 },
  truck: { label: 'Truck (diesel)', mj_t_km: 0.94, co2_t_km: 0.067 },
  air: { label: 'Air freight', mj_t_km: 23, co2_t_km: 1.6 },
};

interface UsePreset {
  id: string;
  label: string;
  energy: number;
  co2: number;
}

// Use-phase presets — typical lifetime energy + CO₂ for common products.
// Sources: Ashby Ch.15 worked examples + standard fuel/grid emission factors.
const USE_PRESETS: UsePreset[] = [
  { id: 'none', label: 'None (static product)', energy: 0, co2: 0 },
  {
    id: 'car',
    label: 'Small car · 180,000 km · 8 L/100 km gasoline',
    energy: 518000,
    co2: 33400,
  },
  {
    id: 'hvac',
    label: 'Building HVAC · 1 kW · 8 h/day · 20 yr',
    energy: 210000,
    co2: 23000,
  },
  {
    id: 'fridge',
    label: 'Refrigerator · 300 W · continuous · 10 yr',
    energy: 94600,
    co2: 10500,
  },
  {
    id: 'computer',
    label: 'Computer · 100 W · 4 h/day · 5 yr',
    energy: 2630,
    co2: 290,
  },
];

const matById: Record<string, Material> = Object.fromEntries(
  materials.map((m) => [m.id, m]),
);

// ecoMaterials is computed inside the component so it can react to the whitelist prop.

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

export function EcoAudit({ whitelist }: { whitelist?: Set<string> }) {
  const [bom, setBom] = useState<BOMRow[]>(initialBOM);
  const [mfgEnergyPerKg, setMfgEnergyPerKg] = useState<number>(15); // MJ/kg, typical shaping
  const [mfgCO2PerKg, setMfgCO2PerKg] = useState<number>(1.0); // kg CO₂ / kg
  const [transportDistance_km, setTransportDistance] = useState<number>(0);
  const [transportMode, setTransportMode] = useState<TransportMode>('truck');
  const [useEnergy, setUseEnergy] = useState<number>(0);
  const [useCO2, setUseCO2] = useState<number>(0);
  const [usePresetId, setUsePresetId] = useState<string>('none');
  const [recycleEnabled, setRecycleEnabled] = useState(true);
  const [metric, setMetric] = useState<Metric>('energy');

  const ecoMaterials = useMemo(
    () =>
      materials
        .filter(
          (m) =>
            m.properties.embodied_energy_MJ_kg !== undefined &&
            (!whitelist || whitelist.has(m.id)),
        )
        .sort((a, b) => {
          if (a.family !== b.family) return a.family.localeCompare(b.family);
          return a.name.localeCompare(b.name);
        }),
    [whitelist],
  );

  const totalMass_kg = useMemo(() => bom.reduce((s, r) => s + r.mass_kg, 0), [bom]);

  const manufacture = useMemo(
    () => ({
      energy: totalMass_kg * mfgEnergyPerKg,
      co2: totalMass_kg * mfgCO2PerKg,
    }),
    [totalMass_kg, mfgEnergyPerKg, mfgCO2PerKg],
  );

  const transport = useMemo(() => {
    const f = TRANSPORT_FACTORS[transportMode];
    const t_km = (totalMass_kg / 1000) * transportDistance_km;
    return {
      energy: t_km * f.mj_t_km,
      co2: t_km * f.co2_t_km,
    };
  }, [totalMass_kg, transportDistance_km, transportMode]);

  const applyUsePreset = (id: string) => {
    setUsePresetId(id);
    const preset = USE_PRESETS.find((p) => p.id === id);
    if (preset) {
      setUseEnergy(preset.energy);
      setUseCO2(preset.co2);
    }
  };

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
      manufacture: { energy: manufacture.energy, co2: manufacture.co2 },
      transport: { energy: transport.energy, co2: transport.co2 },
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
  }, [breakdown, useEnergy, useCO2, manufacture, transport]);

  const grandTotal =
    metric === 'energy'
      ? totals.materials.energy +
        totals.manufacture.energy +
        totals.transport.energy +
        totals.use.energy +
        totals.eol.energy
      : totals.materials.co2 +
        totals.manufacture.co2 +
        totals.transport.co2 +
        totals.use.co2 +
        totals.eol.co2;

  const unit = metric === 'energy' ? 'MJ' : 'kg CO₂';

  // Stacked bar chart: 5 phases on x, BOM components stacked in materials/EoL.
  // Aggregate "global" phases (manufacture/transport/use) get one trace each.
  const traces = useMemo<Partial<PlotData>[]>(() => {
    const phases = ['Materials', 'Manufacture', 'Transport', 'Use', 'End-of-Life'];

    const componentTraces: Partial<PlotData>[] = breakdown.map((c) => {
      const color = familyById[c.material.family].color;
      const mat = metric === 'energy' ? c.materials_energy : c.materials_co2;
      const eol = metric === 'energy' ? c.eol_energy : c.eol_co2;
      return {
        type: 'bar',
        name: c.material.short_name ?? c.material.name,
        x: phases,
        y: [mat, 0, 0, 0, eol],
        marker: { color },
        hovertemplate: `<b>%{fullData.name}</b><br>%{x}: %{y:.3g} ${unit}<extra></extra>`,
      };
    });

    const mfgVal = metric === 'energy' ? manufacture.energy : manufacture.co2;
    if (mfgVal !== 0) {
      componentTraces.push({
        type: 'bar',
        name: 'Manufacture',
        x: phases,
        y: [0, mfgVal, 0, 0, 0],
        marker: { color: '#8A6E3E' },
        hovertemplate: `<b>Manufacture</b><br>%{y:.3g} ${unit}<extra></extra>`,
      });
    }

    const trpVal = metric === 'energy' ? transport.energy : transport.co2;
    if (trpVal !== 0) {
      componentTraces.push({
        type: 'bar',
        name: 'Transport',
        x: phases,
        y: [0, 0, trpVal, 0, 0],
        marker: { color: '#6B8E9F' },
        hovertemplate: `<b>Transport</b><br>%{y:.3g} ${unit}<extra></extra>`,
      });
    }

    const usePhaseValue = metric === 'energy' ? useEnergy : useCO2;
    if (usePhaseValue !== 0) {
      componentTraces.push({
        type: 'bar',
        name: 'Use phase',
        x: phases,
        y: [0, 0, 0, usePhaseValue, 0],
        marker: { color: '#555' },
        hovertemplate: `<b>Use phase</b><br>%{y:.3g} ${unit}<extra></extra>`,
      });
    }

    return componentTraces;
  }, [breakdown, metric, useEnergy, useCO2, manufacture, transport, unit]);

  const layout: Partial<Layout> = {
    title: { text: `Life-cycle ${metric === 'energy' ? 'energy' : 'CO₂'} by phase`, font: { size: 16, color: '#2a2a26', family: 'Inter, sans-serif' } },
    barmode: 'relative',
    xaxis: {
      ...AXIS_STYLE,
      title: { text: 'Lifecycle phase', font: { color: '#52524E', size: 13 } },
    },
    yaxis: {
      ...AXIS_STYLE,
      title: { text: `${metric === 'energy' ? 'Energy' : 'CO₂'} (${unit})`, font: { color: '#52524E', size: 13 } },
      zeroline: true,
      zerolinecolor: '#C0BFB6',
    },
    showlegend: true,
    legend: LEGEND_STYLE,
    margin: { l: 80, r: 200, t: 60, b: 60 },
    plot_bgcolor: PLOT_BG,
    paper_bgcolor: PAPER_BG,
    hoverlabel: HOVER_LABEL,
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
        <h2>2. Manufacture phase</h2>
        <p className="eco-help">
          Energy spent shaping the raw material into finished components (casting, machining,
          molding, etc.). Typical defaults from Ashby Table 15.2: ~15 MJ/kg for casting and
          molding, 5–10 MJ/kg for forging, 30+ MJ/kg for CNC machining of metals.
        </p>
        <div className="use-phase-grid">
          <label>
            Manufacturing energy (MJ/kg of BOM)
            <input
              type="number"
              min={0}
              step={0.5}
              value={mfgEnergyPerKg}
              onChange={(e) => setMfgEnergyPerKg(Math.max(0, parseFloat(e.target.value) || 0))}
            />
          </label>
          <label>
            Manufacturing CO₂ (kg/kg of BOM)
            <input
              type="number"
              min={0}
              step={0.1}
              value={mfgCO2PerKg}
              onChange={(e) => setMfgCO2PerKg(Math.max(0, parseFloat(e.target.value) || 0))}
            />
          </label>
        </div>
        <p className="phase-note">
          Total mass = {totalMass_kg.toFixed(2)} kg ⇒ manufacture ={' '}
          {fmt(manufacture.energy)} MJ, {fmt(manufacture.co2)} kg CO₂.
        </p>
      </section>

      <section className="eco-section">
        <h2>3. Transport phase</h2>
        <p className="eco-help">
          Energy and CO₂ for shipping the finished product. Per Ashby Table 15.4: sea ≈ 0.16,
          rail ≈ 0.25, truck ≈ 0.94, air ≈ 23 MJ per tonne·km. Air freight is two orders of
          magnitude worse than sea — picking the mode dominates the result.
        </p>
        <div className="use-phase-grid">
          <label>
            Distance (km)
            <input
              type="number"
              min={0}
              value={transportDistance_km}
              onChange={(e) =>
                setTransportDistance(Math.max(0, parseFloat(e.target.value) || 0))
              }
            />
          </label>
          <label>
            Mode
            <select
              value={transportMode}
              onChange={(e) => setTransportMode(e.target.value as TransportMode)}
            >
              {(Object.keys(TRANSPORT_FACTORS) as TransportMode[]).map((m) => (
                <option key={m} value={m}>
                  {TRANSPORT_FACTORS[m].label} · {TRANSPORT_FACTORS[m].mj_t_km} MJ/(t·km)
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="phase-note">
          {totalMass_kg.toFixed(2)} kg × {transportDistance_km.toLocaleString()} km ={' '}
          {((totalMass_kg / 1000) * transportDistance_km).toFixed(3)} t·km ⇒ transport ={' '}
          {fmt(transport.energy)} MJ, {fmt(transport.co2)} kg CO₂.
        </p>
      </section>

      <section className="eco-section">
        <h2>4. Use phase</h2>
        <p className="eco-help">
          Energy and CO₂ consumed across the product's service lifetime. Pick a preset for a
          typical product, or enter totals directly.
        </p>
        <div className="controls" style={{ marginTop: 0, marginBottom: 12 }}>
          <div className="control-group">
            <label htmlFor="use-preset">Use-phase preset:</label>
            <select
              id="use-preset"
              value={usePresetId}
              onChange={(e) => applyUsePreset(e.target.value)}
            >
              {USE_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="use-phase-grid">
          <label>
            Energy over lifetime (MJ)
            <input
              type="number"
              min={0}
              value={useEnergy}
              onChange={(e) => {
                setUseEnergy(Math.max(0, parseFloat(e.target.value) || 0));
                setUsePresetId('');
              }}
            />
          </label>
          <label>
            CO₂ over lifetime (kg)
            <input
              type="number"
              min={0}
              value={useCO2}
              onChange={(e) => {
                setUseCO2(Math.max(0, parseFloat(e.target.value) || 0));
                setUsePresetId('');
              }}
            />
          </label>
        </div>
      </section>

      <section className="eco-section">
        <h2>5. End-of-Life</h2>
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
        <h2>6. Results</h2>
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
            <div className="total-label">Manufacture</div>
            <div className="total-value">
              {fmt(metric === 'energy' ? totals.manufacture.energy : totals.manufacture.co2)} <span className="unit">{unit}</span>
            </div>
          </div>
          <div className="total-card">
            <div className="total-label">Transport</div>
            <div className="total-value">
              {fmt(metric === 'energy' ? totals.transport.energy : totals.transport.co2)} <span className="unit">{unit}</span>
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
          in Mechanical Design</em> (6th ed., 2025), Chapter 15. All five lifecycle phases are now
          modelled: <em>materials production</em> (mass × embodied energy from the material data),
          <em>manufacture</em> (mass × shaping energy intensity, Table 15.2), <em>transport</em>{' '}
          (tonne-km × mode factor, Table 15.4), <em>use</em> (lifetime totals or presets from
          Ch. 15 worked examples), and <em>end-of-life</em> recycle credit (mass × recycle fraction
          × avoided virgin-production energy, Eq 15.6). The relative dominance of phases is the
          teaching takeaway: for static products, materials usually win; for cars and appliances,
          the use phase dwarfs everything else.
        </p>
      </footer>
    </>
  );
}
