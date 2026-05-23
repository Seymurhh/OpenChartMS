import { useEffect, useMemo, useState } from 'react';
import Plot from 'react-plotly.js';
import type { Annotations, Layout, PlotData, Shape } from 'plotly.js';
import { families, materials } from '../data/loadMaterials';
import { PROPERTY_META, type FamilyId, type PropertyKey } from '../data/types';
import { AXIS_STYLE, HOVER_LABEL, LEGEND_STYLE, PAPER_BG, PLOT_BG } from '../lib/chartStyle';

interface Point { x: number; y: number; }

export interface IndexLineSpec {
  expr: string;
  slope: number;
  M: number;
  lineY: (x: number, M: number) => number;
}

type DragMode = 'zoom' | 'pan' | 'select' | 'lasso';

interface Props {
  xKey: PropertyKey;
  yKey: PropertyKey;
  showLabels?: boolean;
  showEnvelopes?: boolean;
  indexLine?: IndexLineSpec;
  selectedIds?: Set<string>; // when present, materials NOT in this set are dimmed
  dragMode?: DragMode;
  onLassoSelect?: (ids: Set<string> | undefined) => void;
  /** Fixed initial axis view in linear scale, e.g. [10, 25000]. If omitted, computed from data. */
  xRangeFixed?: [number, number];
  yRangeFixed?: [number, number];
  /** If provided, only materials whose id is in this set are rendered. */
  materialWhitelist?: Set<string>;
}

function geomean(a: number, b: number): number {
  return Math.sqrt(a * b);
}

export function AshbyChart({
  xKey,
  yKey,
  showLabels = false,
  showEnvelopes = true,
  indexLine,
  selectedIds,
  dragMode = 'zoom',
  onLassoSelect,
  xRangeFixed,
  yRangeFixed,
  materialWhitelist,
}: Props) {
  const xMeta = PROPERTY_META[xKey];
  const yMeta = PROPERTY_META[yKey];

  // Track which families have been toggled off via legend click. Plotly hides the
  // family's scatter trace by default, but the ellipses and envelopes are shapes,
  // not traces — so we filter them here. Reset whenever the chart preset changes.
  const [hiddenFamilies, setHiddenFamilies] = useState<Set<FamilyId>>(new Set());
  useEffect(() => {
    setHiddenFamilies(new Set());
  }, [xKey, yKey]);

  const valid = useMemo(
    () => materials.filter(
      (m) =>
        m.properties[xKey] &&
        m.properties[yKey] &&
        (!materialWhitelist || materialWhitelist.has(m.id)),
    ),
    [xKey, yKey, materialWhitelist],
  );

  // Data ranges for both axes — used to lock the view and extend the index line.
  const xRange = useMemo(() => {
    let lo = Infinity, hi = -Infinity;
    for (const m of valid) {
      const r = m.properties[xKey]!;
      if (r.min < lo) lo = r.min;
      if (r.max > hi) hi = r.max;
    }
    return { lo, hi };
  }, [valid, xKey]);

  const yRange = useMemo(() => {
    let lo = Infinity, hi = -Infinity;
    for (const m of valid) {
      const r = m.properties[yKey]!;
      if (r.min < lo) lo = r.min;
      if (r.max > hi) hi = r.max;
    }
    return { lo, hi };
  }, [valid, yKey]);

  const isDimmed = (id: string): boolean => {
    if (!selectedIds) return false;
    return !selectedIds.has(id);
  };

  // Family envelopes: PCA-oriented ellipse fitted in log-log space.
  // Using PCA (rather than convex hull) gives the organic "Ashby bubble" look — the
  // major axis follows the natural data correlation, so elongated families like metals
  // produce a proper slanted oval instead of a distorted wedge.
  const envelopeData = useMemo(() => {
    const shapes: Partial<Shape>[] = [];
    const labels: Partial<Annotations>[] = [];
    if (!showEnvelopes) return { shapes, labels };

    for (const f of families) {
      if (hiddenFamilies.has(f.id)) continue;
      const items = valid.filter((m) => m.family === f.id);
      if (items.length < 2) continue;

      // Geometric midpoints in log space — used for PCA orientation.
      const mids: Point[] = items.map((m) => ({
        x: Math.log10(geomean(m.properties[xKey]!.min, m.properties[xKey]!.max)),
        y: Math.log10(geomean(m.properties[yKey]!.min, m.properties[yKey]!.max)),
      }));

      // All four corners of each material's property range — used to size the ellipse
      // so it actually encloses the full spread, not just the midpoints.
      const corners: Point[] = [];
      for (const m of items) {
        const xr = m.properties[xKey]!;
        const yr = m.properties[yKey]!;
        corners.push(
          { x: Math.log10(xr.min), y: Math.log10(yr.min) },
          { x: Math.log10(xr.min), y: Math.log10(yr.max) },
          { x: Math.log10(xr.max), y: Math.log10(yr.min) },
          { x: Math.log10(xr.max), y: Math.log10(yr.max) },
        );
      }

      // PCA on midpoints: compute centroid and 2×2 covariance.
      const n = mids.length;
      const cx = mids.reduce((s: number, p: Point) => s + p.x, 0) / n;
      const cy = mids.reduce((s: number, p: Point) => s + p.y, 0) / n;
      let sxx = 0, sxy = 0, syy = 0;
      for (const p of mids) {
        const dx = p.x - cx, dy = p.y - cy;
        sxx += dx * dx; sxy += dx * dy; syy += dy * dy;
      }
      sxx /= n; sxy /= n; syy /= n;

      // Eigendecomposition of the 2×2 symmetric covariance matrix.
      const trace = sxx + syy;
      const disc = Math.sqrt(Math.max(0, trace * trace / 4 - (sxx * syy - sxy * sxy)));
      const lambda1 = trace / 2 + disc;
      const theta = Math.atan2(lambda1 - sxx, sxy || 1e-10);
      const cosT = Math.cos(theta), sinT = Math.sin(theta);

      // Scale the ellipse so it encloses all property-range corners (not just midpoints).
      let maxA = 0, maxB = 0;
      for (const p of corners) {
        const dx = p.x - cx, dy = p.y - cy;
        const u = Math.abs(dx * cosT + dy * sinT);   // extent along major axis
        const v = Math.abs(-dx * sinT + dy * cosT);  // extent along minor axis
        if (u > maxA) maxA = u;
        if (v > maxB) maxB = v;
      }

      const pad = 1.20; // 20 % breathing room around all data
      const a = maxA * pad;
      const b = Math.max(maxB * pad, a * 0.12, 0.06); // minimum thickness
      if (a <= 0) continue;

      // Sample 48 evenly-spaced points on the rotated ellipse, convert to linear scale.
      const N = 48;
      const segs: string[] = [];
      for (let i = 0; i <= N; i++) {
        const t = (2 * Math.PI * i) / N;
        const lx = cx + a * Math.cos(t) * cosT - b * Math.sin(t) * sinT;
        const ly = cy + a * Math.cos(t) * sinT + b * Math.sin(t) * cosT;
        segs.push(`${Math.pow(10, lx)},${Math.pow(10, ly)}`);
      }
      const path = `M ${segs[0]} ` + segs.slice(1).map((s: string) => `L ${s}`).join(' ') + ' Z';

      shapes.push({
        type: 'path',
        path,
        xref: 'x',
        yref: 'y',
        fillcolor: f.color,
        opacity: 0.18,
        line: { color: f.color, width: 1.2 },
        layer: 'below',
      } satisfies Partial<Shape>);

      labels.push({
        x: Math.pow(10, cx),
        y: Math.pow(10, cy),
        xref: 'x',
        yref: 'y',
        text: `<b>${f.label}</b>`,
        showarrow: false,
        font: { size: 14, color: f.color, family: 'Inter, sans-serif' },
      });
    }

    return { shapes, labels };
  }, [valid, xKey, yKey, showEnvelopes, hiddenFamilies]);

  // Material ellipses — white fill with family-colored border (textbook style).
  // Hidden families are dropped entirely so the legend-click toggle clears both
  // markers AND ellipses.
  const ellipses: Partial<Shape>[] = useMemo(
    () =>
      valid
        .filter((m) => !hiddenFamilies.has(m.family))
        .map((m) => {
        const xr = m.properties[xKey]!;
        const yr = m.properties[yKey]!;
        const dimmed = isDimmed(m.id);
        return {
          type: 'circle',
          xref: 'x',
          yref: 'y',
          x0: xr.min,
          x1: xr.max,
          y0: yr.min,
          y1: yr.max,
          fillcolor: dimmed ? 'rgba(220,218,210,0.08)' : 'rgba(255,255,255,0.88)',
          opacity: 1,
          line: { color: dimmed ? 'rgba(180,178,170,0.2)' : '#2a2a26', width: dimmed ? 0.5 : 1 },
          layer: 'below',
        } satisfies Partial<Shape>;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [valid, xKey, yKey, selectedIds, hiddenFamilies],
  );

  // Iso-M index line, dashed, drawn above ellipses.
  const indexLineShape: Partial<Shape> | null = useMemo(() => {
    if (!indexLine || !Number.isFinite(xRange.lo) || !Number.isFinite(xRange.hi)) return null;
    // Pad endpoints a little outside the data range so the line crosses the full plot.
    const xLo = xRange.lo * 0.5;
    const xHi = xRange.hi * 2;
    return {
      type: 'line',
      xref: 'x',
      yref: 'y',
      x0: xLo,
      y0: indexLine.lineY(xLo, indexLine.M),
      x1: xHi,
      y1: indexLine.lineY(xHi, indexLine.M),
      line: { color: '#2558C8', width: 2, dash: 'dash' },
      layer: 'above',
    } satisfies Partial<Shape>;
  }, [indexLine, xRange]);

  const indexAnnotation: Partial<Annotations> | null = useMemo(() => {
    if (!indexLine || !Number.isFinite(xRange.lo) || !Number.isFinite(xRange.hi)) return null;
    const xMid = geomean(xRange.lo, xRange.hi);
    return {
      x: xMid,
      y: indexLine.lineY(xMid, indexLine.M),
      xref: 'x',
      yref: 'y',
      text: `<b>${indexLine.expr} ≥ ${indexLine.M.toPrecision(3)}</b><br><span style="font-size:10px">↑ selected region</span>`,
      showarrow: false,
      bgcolor: 'rgba(255,255,255,0.92)',
      bordercolor: '#2558C8',
      borderwidth: 1,
      borderpad: 5,
      font: { size: 12, color: '#2558C8', family: 'Inter, sans-serif' },
      xanchor: 'left',
      yanchor: 'bottom',
    };
  }, [indexLine, xRange]);

  // One scatter trace per family; clickable legend; markers at geometric center.
  const traces = useMemo<Partial<PlotData>[]>(
    () =>
      families.map((f) => {
        const items = valid.filter((m) => m.family === f.id);
        return {
          type: 'scatter',
          mode: showLabels ? 'text+markers' : 'markers',
          name: f.label,
          x: items.map((m) => geomean(m.properties[xKey]!.min, m.properties[xKey]!.max)),
          y: items.map((m) => geomean(m.properties[yKey]!.min, m.properties[yKey]!.max)),
          // Only show label text for non-dimmed materials to prevent overlap when filtering.
          text: items.map((m) => (showLabels && !isDimmed(m.id)) ? (m.short_name ?? m.name) : ''),
          textposition: 'top center',
          textfont: { size: 9, color: '#2a2a26', family: 'Inter, sans-serif' },
          customdata: items.map((m) => [
            m.id,
            m.name,
            m.properties[xKey]!.min,
            m.properties[xKey]!.max,
            m.properties[yKey]!.min,
            m.properties[yKey]!.max,
          ]),
          marker: {
            color: f.color,
            size: 7,
            line: { color: 'white', width: 1.5 },
            opacity: items.map((m) => (isDimmed(m.id) ? 0.15 : 1)),
          },
          hovertemplate:
            '<b>%{customdata[1]}</b><br>' +
            `${xMeta.label}: %{customdata[2]:.3g} – %{customdata[3]:.3g} ${xMeta.unit}<br>` +
            `${yMeta.label}: %{customdata[4]:.3g} – %{customdata[5]:.3g} ${yMeta.unit}` +
            `<extra>${f.label}</extra>`,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [valid, xKey, yKey, xMeta, yMeta, showLabels, selectedIds],
  );

  const shapes: Partial<Shape>[] = [...envelopeData.shapes, ...ellipses];
  if (indexLineShape) shapes.push(indexLineShape);

  const allAnnotations: Partial<Annotations>[] = [
    ...envelopeData.labels,
    ...(indexAnnotation ? [indexAnnotation] : []),
  ];

  const layout: Partial<Layout> = {
    title: {
      text: `${yMeta.label} vs ${xMeta.label}`,
      font: { size: 16, color: '#2a2a26', family: 'Inter, sans-serif' },
    },
    xaxis: {
      ...AXIS_STYLE,
      title: {
        text: `${xMeta.label}${xMeta.symbol ? ` (${xMeta.symbol})` : ''}  [${xMeta.unit}]`,
        font: { color: '#52524E', size: 13, family: 'Inter, sans-serif' },
      },
      type: 'log',
      range: xRangeFixed
        ? [Math.log10(xRangeFixed[0]), Math.log10(xRangeFixed[1])]
        : [Math.log10(xRange.lo) - 0.5, Math.log10(xRange.hi) + 0.5],
      autorange: false,
      showspikes: true,
      spikemode: 'across',
      spikethickness: 1,
      spikecolor: '#C0BFB6',
      spikedash: 'dot',
    },
    yaxis: {
      ...AXIS_STYLE,
      title: {
        text: `${yMeta.label}${yMeta.symbol ? ` (${yMeta.symbol})` : ''}  [${yMeta.unit}]`,
        font: { color: '#52524E', size: 13, family: 'Inter, sans-serif' },
      },
      type: 'log',
      range: yRangeFixed
        ? [Math.log10(yRangeFixed[0]), Math.log10(yRangeFixed[1])]
        : [Math.log10(yRange.lo) - 0.5, Math.log10(yRange.hi) + 0.5],
      autorange: false,
      showspikes: true,
      spikemode: 'across',
      spikethickness: 1,
      spikecolor: '#C0BFB6',
      spikedash: 'dot',
    },
    shapes,
    annotations: allAnnotations,
    showlegend: true,
    legend: LEGEND_STYLE,
    margin: { l: 80, r: 220, t: 60, b: 70 },
    plot_bgcolor: PLOT_BG,
    paper_bgcolor: PAPER_BG,
    hovermode: 'closest',
    dragmode: dragMode,
    hoverlabel: HOVER_LABEL,
    // Preserve zoom/pan when slider or filter changes; only reset when the chart type changes.
    uirevision: `${xKey}-${yKey}`,
    transition: { duration: 250, easing: 'cubic-in-out' },
  };

  return (
    <Plot
      data={traces}
      layout={layout}
      config={{
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        toImageButtonOptions: { format: 'png', filename: 'openchartms', scale: 2 },
      }}
      style={{ width: '100%', height: '720px' }}
      useResizeHandler
      onLegendClick={(event) => {
        const f = families[event.curveNumber];
        if (!f) return true;
        setHiddenFamilies((prev) => {
          const next = new Set(prev);
          if (next.has(f.id)) next.delete(f.id);
          else next.add(f.id);
          return next;
        });
        return true; // let Plotly also toggle the trace marker visibility
      }}
      onLegendDoubleClick={(event) => {
        // Plotly's default double-click "isolates" — show only this family.
        // Mirror that: hide every other family.
        const f = families[event.curveNumber];
        if (!f) return true;
        setHiddenFamilies((prev) => {
          const visibleCount = families.length - prev.size;
          const onlyThisVisible = visibleCount === 1 && !prev.has(f.id);
          if (onlyThisVisible) return new Set();
          const next = new Set<FamilyId>();
          for (const other of families) if (other.id !== f.id) next.add(other.id);
          return next;
        });
        return true;
      }}
      onSelected={(event) => {
        if (!onLassoSelect) return;
        if (!event || !event.points || event.points.length === 0) {
          onLassoSelect(undefined);
          return;
        }
        const ids = new Set<string>();
        for (const p of event.points) {
          const cd = (p as unknown as { customdata?: unknown[] }).customdata;
          if (Array.isArray(cd) && typeof cd[0] === 'string') {
            ids.add(cd[0]);
          }
        }
        onLassoSelect(ids.size > 0 ? ids : undefined);
      }}
      onDeselect={() => {
        if (onLassoSelect) onLassoSelect(undefined);
      }}
    />
  );
}
