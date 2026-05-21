import { useMemo } from 'react';
import Plot from 'react-plotly.js';
import type { Annotations, Layout, PlotData, Shape } from 'plotly.js';
import { families, familyById, materials } from '../data/loadMaterials';
import { PROPERTY_META, type PropertyKey } from '../data/types';
import { convexHull, type Point } from '../lib/hull';

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
}: Props) {
  const xMeta = PROPERTY_META[xKey];
  const yMeta = PROPERTY_META[yKey];

  const valid = useMemo(
    () => materials.filter((m) => m.properties[xKey] && m.properties[yKey]),
    [xKey, yKey],
  );

  // Axis data range, used to extend the index line across the chart.
  const xRange = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    for (const m of valid) {
      const r = m.properties[xKey]!;
      if (r.min < lo) lo = r.min;
      if (r.max > hi) hi = r.max;
    }
    return { lo, hi };
  }, [valid, xKey]);

  const isDimmed = (id: string): boolean => {
    if (!selectedIds) return false;
    return !selectedIds.has(id);
  };

  // Family envelopes: convex hull of all member materials' bounding-box corners in log space.
  const envelopes: Partial<Shape>[] = useMemo(() => {
    if (!showEnvelopes) return [];
    return families.flatMap((f) => {
      const items = valid.filter((m) => m.family === f.id);
      if (items.length < 2) return [];

      const pts: Point[] = [];
      for (const m of items) {
        const xr = m.properties[xKey]!;
        const yr = m.properties[yKey]!;
        pts.push(
          { x: Math.log10(xr.min), y: Math.log10(yr.min) },
          { x: Math.log10(xr.min), y: Math.log10(yr.max) },
          { x: Math.log10(xr.max), y: Math.log10(yr.min) },
          { x: Math.log10(xr.max), y: Math.log10(yr.max) },
        );
      }

      const hull = convexHull(pts);
      if (hull.length < 3) return [];

      const path =
        hull
          .map((p, i) => `${i === 0 ? 'M' : 'L'} ${Math.pow(10, p.x)},${Math.pow(10, p.y)}`)
          .join(' ') + ' Z';

      return [
        {
          type: 'path',
          path,
          xref: 'x',
          yref: 'y',
          fillcolor: f.color,
          opacity: 0.10,
          line: { color: f.color, width: 0 },
          layer: 'below',
        } satisfies Partial<Shape>,
      ];
    });
  }, [valid, xKey, yKey, showEnvelopes]);

  // Material ellipses; opacity drops if the material is dimmed by the current selection.
  const ellipses: Partial<Shape>[] = useMemo(
    () =>
      valid.map((m) => {
        const color = familyById[m.family].color;
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
          fillcolor: color,
          opacity: dimmed ? 0.08 : 0.55,
          line: { color, width: dimmed ? 0 : 1 },
          layer: 'below',
        } satisfies Partial<Shape>;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [valid, xKey, yKey, selectedIds],
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
      line: { color: '#1a1a1a', width: 2, dash: 'dash' },
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
      text: `${indexLine.expr} = ${indexLine.M.toPrecision(3)}`,
      showarrow: false,
      bgcolor: 'rgba(255,255,255,0.92)',
      bordercolor: '#1a1a1a',
      borderwidth: 1,
      borderpad: 4,
      font: { size: 12, color: '#1a1a1a' },
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
          text: items.map((m) => m.short_name ?? m.name),
          textposition: 'top center',
          textfont: { size: 9, color: '#222' },
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

  const shapes: Partial<Shape>[] = [...envelopes, ...ellipses];
  if (indexLineShape) shapes.push(indexLineShape);

  const layout: Partial<Layout> = {
    title: { text: `${yMeta.label} vs ${xMeta.label}`, font: { size: 18 } },
    xaxis: {
      title: {
        text: `${xMeta.label}${xMeta.symbol ? ` (${xMeta.symbol})` : ''}  [${xMeta.unit}]`,
      },
      type: 'log',
      gridcolor: '#e5e5e5',
      zeroline: false,
      showspikes: true,
      spikemode: 'across',
      spikethickness: 1,
      spikecolor: '#aaa',
      spikedash: 'dot',
    },
    yaxis: {
      title: {
        text: `${yMeta.label}${yMeta.symbol ? ` (${yMeta.symbol})` : ''}  [${yMeta.unit}]`,
      },
      type: 'log',
      gridcolor: '#e5e5e5',
      zeroline: false,
      showspikes: true,
      spikemode: 'across',
      spikethickness: 1,
      spikecolor: '#aaa',
      spikedash: 'dot',
    },
    shapes,
    annotations: indexAnnotation ? [indexAnnotation] : [],
    showlegend: true,
    legend: { x: 1.02, y: 1, xanchor: 'left', yanchor: 'top' },
    margin: { l: 80, r: 220, t: 60, b: 70 },
    plot_bgcolor: '#fafafa',
    paper_bgcolor: 'white',
    hovermode: 'closest',
    dragmode: dragMode,
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
