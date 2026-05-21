import { useMemo } from 'react';
import { materials } from '../data/loadMaterials';
import { PROPERTY_META, type Material, type PropertyKey } from '../data/types';

export interface PropertyLimit {
  key: PropertyKey;
  min: number;
  max: number;
}

interface Props {
  limits: PropertyLimit[];
  onChange: (limits: PropertyLimit[]) => void;
}

interface PropertyDataRange {
  dataMin: number;
  dataMax: number;
}

// Compute the overall [min, max] range of every property across all materials,
// used to seed sensible defaults when a limit is first added.
function computeDataRanges(): Record<string, PropertyDataRange> {
  const out: Record<string, PropertyDataRange> = {};
  for (const m of materials) {
    for (const [k, r] of Object.entries(m.properties)) {
      if (!r) continue;
      if (!out[k]) {
        out[k] = { dataMin: r.min, dataMax: r.max };
      } else {
        out[k].dataMin = Math.min(out[k].dataMin, r.min);
        out[k].dataMax = Math.max(out[k].dataMax, r.max);
      }
    }
  }
  return out;
}

// Range-overlap test: a material satisfies a limit iff its [min, max] property
// range intersects the limit's [min, max] (Ashby's "could be used" semantics).
export function passesLimits(material: Material, limits: PropertyLimit[]): boolean {
  for (const lim of limits) {
    const r = material.properties[lim.key];
    if (!r) return false;
    if (r.max < lim.min || r.min > lim.max) return false;
  }
  return true;
}

export function LimitsPanel({ limits, onChange }: Props) {
  const dataRanges = useMemo(() => computeDataRanges(), []);
  const usedKeys = new Set(limits.map((l) => l.key));

  const availableProperties = (Object.keys(PROPERTY_META) as PropertyKey[])
    .filter((k) => !usedKeys.has(k) && dataRanges[k])
    .sort((a, b) => PROPERTY_META[a].label.localeCompare(PROPERTY_META[b].label));

  const addLimit = (key: PropertyKey) => {
    const range = dataRanges[key];
    if (!range) return;
    onChange([...limits, { key, min: range.dataMin, max: range.dataMax }]);
  };

  const removeLimit = (key: PropertyKey) => {
    onChange(limits.filter((l) => l.key !== key));
  };

  const updateLimit = (key: PropertyKey, patch: Partial<PropertyLimit>) => {
    onChange(limits.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  };

  return (
    <div className="limits-panel">
      <div className="limits-header">
        <h3>Property limits {limits.length > 0 && <span className="count-badge">{limits.length}</span>}</h3>
        {limits.length > 0 && (
          <button className="btn-link" onClick={() => onChange([])}>
            Clear all
          </button>
        )}
      </div>

      {limits.length === 0 ? (
        <p className="empty-note">
          No limits set. Filter the selection by adding min/max constraints on any property below.
        </p>
      ) : (
        <table className="limits-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Min</th>
              <th>Max</th>
              <th>Unit</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {limits.map((lim) => {
              const meta = PROPERTY_META[lim.key];
              const dr = dataRanges[lim.key];
              return (
                <tr key={lim.key}>
                  <td>
                    {meta.label}
                    {meta.symbol && <span className="symbol">{meta.symbol}</span>}
                  </td>
                  <td>
                    <input
                      type="number"
                      value={lim.min}
                      step="any"
                      onChange={(e) =>
                        updateLimit(lim.key, { min: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={lim.max}
                      step="any"
                      onChange={(e) =>
                        updateLimit(lim.key, { max: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </td>
                  <td className="unit-cell">
                    {meta.unit}
                    {dr && (
                      <div className="data-range">
                        data: {dr.dataMin.toPrecision(3)}–{dr.dataMax.toPrecision(3)}
                      </div>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn-remove"
                      onClick={() => removeLimit(lim.key)}
                      aria-label="Remove"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {availableProperties.length > 0 && (
        <select
          value=""
          className="add-limit-select"
          onChange={(e) => {
            if (e.target.value) addLimit(e.target.value as PropertyKey);
          }}
        >
          <option value="">+ Add property limit…</option>
          {availableProperties.map((k) => (
            <option key={k} value={k}>
              {PROPERTY_META[k].label} ({PROPERTY_META[k].unit})
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
