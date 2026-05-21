import { familyById } from '../data/loadMaterials';
import type { Material, PropertyKey } from '../data/types';
import { PROPERTY_META } from '../data/types';

export interface SelectedItem {
  material: Material;
  M?: number;
}

interface Props {
  items: SelectedItem[];
  totalCount: number;
  indexExpr?: string;
  xKey: PropertyKey;
  yKey: PropertyKey;
  isFiltered: boolean;
}

function fmtRange(min: number, max: number): string {
  const p = (v: number) =>
    Math.abs(v) >= 1000 || Math.abs(v) < 0.01 ? v.toExponential(1) : v.toPrecision(3);
  return min === max ? p(min) : `${p(min)}–${p(max)}`;
}

export function SelectedMaterialsPanel({
  items,
  totalCount,
  indexExpr,
  xKey,
  yKey,
  isFiltered,
}: Props) {
  const xMeta = PROPERTY_META[xKey];
  const yMeta = PROPERTY_META[yKey];

  return (
    <div className="selected-panel">
      <div className="selected-header">
        <h3>
          {isFiltered ? 'Selected materials' : 'Materials in this chart'}
          <span className="count-badge dark">
            {items.length} {isFiltered && `/ ${totalCount}`}
          </span>
        </h3>
        {indexExpr && (
          <span className="sort-note">
            sorted by <em>{indexExpr}</em> (highest first)
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="empty-note">No materials match the current filters.</p>
      ) : (
        <ol className="selected-list">
          {items.map(({ material, M }, i) => {
            const family = familyById[material.family];
            const xr = material.properties[xKey];
            const yr = material.properties[yKey];
            return (
              <li key={material.id} className="selected-row">
                <span className="rank">{i + 1}</span>
                <span
                  className="family-chip small"
                  style={{ background: family.color }}
                  title={family.label}
                />
                <span className="material-name">{material.name}</span>
                <span className="props">
                  {xr && (
                    <span className="prop">
                      <span className="prop-label">{xMeta.symbol || xMeta.label}</span> {fmtRange(xr.min, xr.max)} {xMeta.unit}
                    </span>
                  )}
                  {yr && (
                    <span className="prop">
                      <span className="prop-label">{yMeta.symbol || yMeta.label}</span> {fmtRange(yr.min, yr.max)} {yMeta.unit}
                    </span>
                  )}
                </span>
                {M !== undefined && Number.isFinite(M) && (
                  <span className="m-value" title="Material index value">
                    {M.toPrecision(3)}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
