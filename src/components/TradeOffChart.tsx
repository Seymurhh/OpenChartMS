import { useMemo } from 'react';
import Plot from 'react-plotly.js';
import type { Annotations, Layout, PlotData, Shape } from 'plotly.js';
import { families, materials } from '../data/loadMaterials';
import { PROPERTY_META, type Material, type PropertyKey } from '../data/types';
import { paretoFront, paretoFrontOrdered, type ParetoPoint } from '../lib/pareto';
import { AXIS_STYLE, HOVER_LABEL, LEGEND_STYLE, PAPER_BG, PLOT_BG } from '../lib/chartStyle';

interface Props {
  xKey: PropertyKey;
  yKey: PropertyKey;
  alpha: number; // exchange constant: Z = x + alpha * y
  showContours: boolean;
  baselineId?: string; // when set, draws quadrant lines through the baseline's coords
  showLabels?: boolean;
}

interface MaterialPoint extends ParetoPoint {
  material: Material;
}

export function TradeOffChart({
  xKey,
  yKey,
  alpha,
  showContours,
  baselineId,
  showLabels = false,
}: Props) {
  const xMeta = PROPERTY_META[xKey];
  const yMeta = PROPERTY_META[yKey];

  // Use the "best corner" of each material's range (min x, min y) — the
  // optimistic point that says "this material could be this good".
  const points: MaterialPoint[] = useMemo(
    () =>
      materials
        .filter((m) => m.properties[xKey] && m.properties[yKey])
        .map((m) => ({
          id: m.id,
          x: m.properties[xKey]!.min,
          y: m.properties[yKey]!.min,
          material: m,
        })),
    [xKey, yKey],
  );

  const paretoIds = useMemo(() => paretoFront(points), [points]);
  const paretoLine = useMemo(() => paretoFrontOrdered(points), [points]);

  // Optimum: material minimizing Z = x + alpha * y.
  const optimum = useMemo(() => {
    let best: MaterialPoint | undefined;
    let minZ = Infinity;
    for (const p of points) {
      const z = p.x + alpha * p.y;
      if (z < minZ) {
        minZ = z;
        best = p;
      }
    }
    return { point: best, Z: minZ };
  }, [points, alpha]);

  // One scatter trace per family; Pareto-optimal markers are larger and outlined.
  const familyTraces: Partial<PlotData>[] = useMemo(() => {
    return families.map((f) => {
      const items = points.filter((p) => p.material.family === f.id);
      return {
        type: 'scatter',
        mode: showLabels ? 'text+markers' : 'markers',
        name: f.label,
        x: items.map((p) => p.x),
        y: items.map((p) => p.y),
        text: items.map((p) =>
          showLabels ? (p.material.short_name ?? p.material.name) : '',
        ),
        textposition: 'top center',
        textfont: { size: 9, color: '#2a2a26', family: 'Inter, sans-serif' },
        customdata: items.map((p) => [
          p.material.name,
          paretoIds.has(p.id) ? '★ Pareto-optimal' : '',
          p.x + alpha * p.y,
        ]),
        marker: {
          color: f.color,
          size: items.map((p) => (paretoIds.has(p.id) ? 13 : 8)),
          line: {
            color: items.map((p) => (paretoIds.has(p.id) ? '#1a1a1a' : 'white')),
            width: items.map((p) => (paretoIds.has(p.id) ? 2 : 1.5)),
          },
        },
        hovertemplate:
          '<b>%{customdata[0]}</b>  %{customdata[1]}<br>' +
          `${xMeta.label}: %{x:.3g} ${xMeta.unit}<br>` +
          `${yMeta.label}: %{y:.3g} ${yMeta.unit}<br>` +
          `Z = %{customdata[2]:.3g}` +
          `<extra>${f.label}</extra>`,
      };
    });
  }, [points, paretoIds, alpha, xMeta, yMeta, showLabels]);

  // Pareto front polyline (drawn before the markers so it sits underneath).
  const paretoTrace: Partial<PlotData> = useMemo(
    () => ({
      type: 'scatter',
      mode: 'lines',
      name: 'Pareto front',
      x: paretoLine.map((p) => p.x),
      y: paretoLine.map((p) => p.y),
      line: { color: '#1a1a1a', width: 2, dash: 'dot' },
      hoverinfo: 'skip',
      showlegend: true,
    }),
    [paretoLine],
  );

  // Iso-Z contours. Z = x + alpha*y. Sampled across the data x-range so they
  // render as smooth curves on log-log axes.
  const isoZShapes: Partial<Shape>[] = useMemo(() => {
    if (!showContours || points.length === 0 || !Number.isFinite(optimum.Z)) return [];

    const xs = points.map((p) => p.x);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);

    const Zs = [optimum.Z, optimum.Z * 1.5, optimum.Z * 2.5, optimum.Z * 5];

    const out: Partial<Shape>[] = [];
    for (let i = 0; i < Zs.length; i++) {
      const Z = Zs[i];
      const pts: [number, number][] = [];
      const lo = Math.log10(xMin * 0.5);
      const hi = Math.log10(xMax * 2);
      const N = 80;
      for (let k = 0; k <= N; k++) {
        const t = k / N;
        const x = Math.pow(10, lo + t * (hi - lo));
        const y = (Z - x) / alpha;
        if (y > 0 && Number.isFinite(y)) {
          pts.push([x, y]);
        }
      }
      if (pts.length < 2) continue;
      const path = pts.map(([x, y], j) => `${j === 0 ? 'M' : 'L'} ${x},${y}`).join(' ');
      out.push({
        type: 'path',
        path,
        xref: 'x',
        yref: 'y',
        line: {
          color: i === 0 ? '#c00' : '#aaa',
          width: i === 0 ? 2 : 1,
          dash: i === 0 ? 'solid' : 'dot',
        },
        layer: 'below',
      } satisfies Partial<Shape>);
    }
    return out;
  }, [showContours, points, optimum, alpha]);

  // Optimum annotation. axref/ayref must be 'pixel' explicitly: Plotly's default
  // for axref equals xref, so on log axes ax=80 would be interpreted as data and
  // push the annotation off-chart.
  const annotations: Partial<Annotations>[] = useMemo(() => {
    if (!optimum.point) return [];
    return [
      {
        x: optimum.point.x,
        y: optimum.point.y,
        xref: 'x',
        yref: 'y',
        ax: 80,
        ay: -60,
        axref: 'pixel',
        ayref: 'pixel',
        text: `<b>Optimum</b><br>${optimum.point.material.short_name ?? optimum.point.material.name}<br>Z = ${optimum.Z.toPrecision(3)}`,
        showarrow: true,
        arrowhead: 4,
        arrowsize: 1.2,
        bgcolor: 'rgba(255,255,255,0.95)',
        bordercolor: '#c00',
        borderwidth: 1.5,
        borderpad: 6,
        font: { size: 11, color: '#1a1a1a' },
        align: 'left',
      },
    ];
  }, [optimum]);

  // Baseline material: find its (x0, y0) and add quadrant lines through it.
  const baseline = useMemo(
    () => (baselineId ? points.find((p) => p.id === baselineId) : undefined),
    [baselineId, points],
  );

  // Quadrant divider shapes when a baseline material is set.
  const baselineShapes: Partial<Shape>[] = useMemo(() => {
    if (!baseline || points.length === 0) return [];
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const xLo = Math.min(...xs) * 0.4;
    const xHi = Math.max(...xs) * 2.5;
    const yLo = Math.min(...ys) * 0.4;
    const yHi = Math.max(...ys) * 2.5;
    return [
      {
        type: 'line',
        xref: 'x',
        yref: 'y',
        x0: baseline.x,
        x1: baseline.x,
        y0: yLo,
        y1: yHi,
        line: { color: '#1a1a1a', width: 1, dash: 'dot' },
        layer: 'below',
      } satisfies Partial<Shape>,
      {
        type: 'line',
        xref: 'x',
        yref: 'y',
        x0: xLo,
        x1: xHi,
        y0: baseline.y,
        y1: baseline.y,
        line: { color: '#1a1a1a', width: 1, dash: 'dot' },
        layer: 'below',
      } satisfies Partial<Shape>,
    ];
  }, [baseline, points]);

  // Quadrant labels (A/B/C/D per Ashby Fig 9.9): A is lower-left of baseline = better on both.
  const baselineAnnotations: Partial<Annotations>[] = useMemo(() => {
    if (!baseline || points.length === 0) return [];
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const xLo = Math.min(...xs) * 0.6;
    const xHi = Math.max(...xs) * 1.5;
    const yLo = Math.min(...ys) * 0.6;
    const yHi = Math.max(...ys) * 1.5;
    const label = (
      x: number,
      y: number,
      letter: string,
      title: string,
      colour: string,
    ): Partial<Annotations> => ({
      x,
      y,
      xref: 'x',
      yref: 'y',
      text: `<b>${letter}</b>: ${title}`,
      showarrow: false,
      bgcolor: 'rgba(255,255,255,0.85)',
      bordercolor: colour,
      borderwidth: 1,
      borderpad: 3,
      font: { size: 10, color: colour },
    });
    return [
      label(Math.sqrt(xLo * baseline.x), Math.sqrt(yLo * baseline.y), 'A', 'better on both', '#2a7a4a'),
      label(Math.sqrt(xHi * baseline.x), Math.sqrt(yLo * baseline.y), 'B', 'cheaper but heavier', '#888'),
      label(Math.sqrt(xLo * baseline.x), Math.sqrt(yHi * baseline.y), 'C', 'lighter but pricier', '#888'),
      label(Math.sqrt(xHi * baseline.x), Math.sqrt(yHi * baseline.y), 'D', 'worse on both', '#c00'),
      // Mark the baseline material itself
      {
        x: baseline.x,
        y: baseline.y,
        xref: 'x',
        yref: 'y',
        ax: 80,
        ay: -60,
        axref: 'pixel',
        ayref: 'pixel',
        text: `<b>Baseline</b><br>${baseline.material.short_name ?? baseline.material.name}`,
        showarrow: true,
        arrowhead: 2,
        arrowsize: 1,
        bgcolor: 'rgba(255,255,255,0.92)',
        bordercolor: '#1a1a1a',
        borderwidth: 1.5,
        borderpad: 6,
        font: { size: 11, color: '#1a1a1a' },
      },
    ];
  }, [baseline, points]);

  // Explicit axis ranges to keep auto-zoom pinned to data bounds.
  const xRange = useMemo<[number, number] | undefined>(() => {
    if (points.length === 0) return undefined;
    const xs = points.map((p) => p.x);
    return [Math.log10(Math.min(...xs) * 0.5), Math.log10(Math.max(...xs) * 2)];
  }, [points]);

  const yRange = useMemo<[number, number] | undefined>(() => {
    if (points.length === 0) return undefined;
    const ys = points.map((p) => p.y);
    return [Math.log10(Math.min(...ys) * 0.5), Math.log10(Math.max(...ys) * 2)];
  }, [points]);

  const layout: Partial<Layout> = {
    title: {
      text: `${yMeta.label} vs ${xMeta.label} — trade-off`,
      font: { size: 16, color: '#2a2a26', family: 'Inter, sans-serif' },
    },
    xaxis: {
      ...AXIS_STYLE,
      title: {
        text: `${xMeta.label}${xMeta.symbol ? ` (${xMeta.symbol})` : ''}  [${xMeta.unit}]  →  larger (worse)`,
        font: { color: '#52524E', size: 13 },
      },
      type: 'log',
      range: xRange,
    },
    yaxis: {
      ...AXIS_STYLE,
      title: {
        text: `${yMeta.label}${yMeta.symbol ? ` (${yMeta.symbol})` : ''}  [${yMeta.unit}]  ↑  larger (worse)`,
        font: { color: '#52524E', size: 13 },
      },
      type: 'log',
      range: yRange,
    },
    shapes: [...baselineShapes, ...isoZShapes],
    annotations: [...annotations, ...baselineAnnotations],
    showlegend: true,
    legend: LEGEND_STYLE,
    margin: { l: 90, r: 220, t: 60, b: 80 },
    plot_bgcolor: PLOT_BG,
    paper_bgcolor: PAPER_BG,
    hovermode: 'closest',
    hoverlabel: HOVER_LABEL,
  };

  return (
    <Plot
      data={[paretoTrace, ...familyTraces]}
      layout={layout}
      config={{
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        toImageButtonOptions: { format: 'png', filename: 'openchartms-tradeoff', scale: 2 },
      }}
      style={{ width: '100%', height: '720px' }}
      useResizeHandler
    />
  );
}
