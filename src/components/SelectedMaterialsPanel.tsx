import { useState, useEffect } from 'react';
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

const PAGE_SIZE = 20;

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

  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(items.length / PAGE_SIZE);
  const pageItems = items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset to first page whenever the item list changes (filter applied etc.)
  useEffect(() => { setPage(0); }, [items]);

  const globalStart = page * PAGE_SIZE;

  return (
    <div className="selected-panel">
      <div className="selected-header">
        <h3>
          {isFiltered ? 'Selected materials' : 'Materials in this chart'}
          <span className="count-badge dark">
            {items.length} {isFiltered && `/ ${totalCount}`}
          </span>
        </h3>
        <div className="selected-header-right">
          {indexExpr && (
            <span className="sort-note">sorted by <em>{indexExpr}</em> (highest first)</span>
          )}
          {pageCount > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                onClick={() => setPage(p => p - 1)}
                disabled={page === 0}
                aria-label="Previous page"
              >
                ‹
              </button>
              <span className="page-info">
                {globalStart + 1}–{Math.min(globalStart + PAGE_SIZE, items.length)} of {items.length}
              </span>
              <button
                className="page-btn"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= pageCount - 1}
                aria-label="Next page"
              >
                ›
              </button>
            </div>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="empty-note">No materials match the current filters.</p>
      ) : (
        <ol className="selected-list">
          {pageItems.map(({ material, M }, i) => {
            const family = familyById[material.family];
            const xr = material.properties[xKey];
            const yr = material.properties[yKey];
            return (
              <li key={material.id} className="selected-row">
                <span className="rank">{globalStart + i + 1}</span>
                <span
                  className="family-chip small"
                  style={{ background: family.color }}
                  title={family.label}
                />
                <span className="material-name">{material.name}</span>
                <span className="props">
                  {xr && (
                    <span className="prop">
                      <span className="prop-label">{xMeta.symbol || xMeta.label}</span>{' '}
                      {fmtRange(xr.min, xr.max)} {xMeta.unit}
                    </span>
                  )}
                  {yr && (
                    <span className="prop">
                      <span className="prop-label">{yMeta.symbol || yMeta.label}</span>{' '}
                      {fmtRange(yr.min, yr.max)} {yMeta.unit}
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
