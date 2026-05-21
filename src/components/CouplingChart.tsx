import { useMemo } from 'react';
import Plot from 'react-plotly.js';
import type { Annotations, Layout, PlotData, Shape } from 'plotly.js';
import { families, materials } from '../data/loadMaterials';
import type { Material } from '../data/types';
import type { ConstraintIndex } from '../data/constraintIndices';
import { paretoFront, paretoFrontOrdered, type ParetoPoint } from '../lib/pareto';

interface Props {
  index1: ConstraintIndex;
  index2: ConstraintIndex;
  Cc: number; // coupling constant: optimum is min over materials of max(I1, I2/Cc)
  showPareto: boolean;
  showSelectionBox: boolean;
}

interface MaterialPoint extends ParetoPoint {
  material: Material;
  minmax: number; // max(I1, I2/Cc)
}

export function CouplingChart({ index1, index2, Cc, showPareto, showSelectionBox }: Props) {
  const points: MaterialPoint[] = useMemo(() => {
    return materials
      .map((m) => {
        const I1 = index1.computeI(m);
        const I2 = index2.computeI(m);
        if (I1 === undefined || I2 === undefined || !Number.isFinite(I1) || !Number.isFinite(I2)) {
          return null;
        }
        return {
          id: m.id,
          material: m,
          x: I1,
          y: I2,
          minmax: Math.max(I1, I2 / Cc),
        };
      })
      .filter((p): p is MaterialPoint => p !== null);
  }, [index1, index2, Cc]);

  const paretoIds = useMemo(() => paretoFront(points), [points]);
  const paretoLine = useMemo(() => paretoFrontOrdered(points), [points]);

  // Optimum: material minimizing min-max metric m̃ = max(I1, I2/Cc).
  const optimum = useMemo(() => {
    let best: MaterialPoint | undefined;
    let minMM = Infinity;
    for (const p of points) {
      if (p.minmax < minMM) {
        minMM = p.minmax;
        best = p;
      }
    }
    return { point: best, mm: minMM };
  }, [points]);

  // Coupling line: I2 = Cc · I1 (slope 1 on log-log, vertical offset log Cc).
  const couplingLineShape: Partial<Shape> | null = useMemo(() => {
    if (points.length === 0) return null;
    const xs = points.map((p) => p.x);
    const lo = Math.min(...xs) * 0.3;
    const hi = Math.max(...xs) * 3;
    return {
      type: 'line',
      xref: 'x',
      yref: 'y',
      x0: lo,
      y0: Cc * lo,
      x1: hi,
      y1: Cc * hi,
      line: { color: '#c00', width: 2, dash: 'dash' },
      layer: 'above',
    } satisfies Partial<Shape>;
  }, [points, Cc]);

  // Selection box: rectangle from (0,0) to (m̃, m̃ · Cc), with corner on the
  // coupling line at the optimum's min-max level. Materials inside are "as good
  // as or better than the optimum on each constraint individually".
  const selectionBoxShape: Partial<Shape> | null = useMemo(() => {
    if (!showSelectionBox || !optimum.point || !Number.isFinite(optimum.mm)) return null;
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const xLo = Math.min(...xs) * 0.3;
    const yLo = Math.min(...ys) * 0.3;
    return {
      type: 'rect',
      xref: 'x',
      yref: 'y',
      x0: xLo,
      y0: yLo,
      x1: optimum.mm,
      y1: optimum.mm * Cc,
      fillcolor: 'rgba(255, 0, 0, 0.06)',
      line: { color: '#c00', width: 1, dash: 'dot' },
      layer: 'below',
    } satisfies Partial<Shape>;
  }, [showSelectionBox, optimum, points, Cc]);

  // Per-family scatter; Pareto-optimal markers are larger.
  const familyTraces: Partial<PlotData>[] = useMemo(() => {
    return families.map((f) => {
      const items = points.filter((p) => p.material.family === f.id);
      return {
        type: 'scatter',
        mode: 'markers',
        name: f.label,
        x: items.map((p) => p.x),
        y: items.map((p) => p.y),
        customdata: items.map((p) => [
          p.material.name,
          paretoIds.has(p.id) ? '★ Pareto-optimal' : '',
          p.minmax,
          p.x,
          p.y,
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
          `${index1.expr}: %{customdata[3]:.3g}<br>` +
          `${index2.expr}: %{customdata[4]:.3g}<br>` +
          `m̃ = max(I₁, I₂/Cc) = %{customdata[2]:.3g}` +
          `<extra>${f.label}</extra>`,
      };
    });
  }, [points, paretoIds, index1, index2]);

  // Optional Pareto-front polyline (lower-left non-dominated subset).
  const paretoTrace: Partial<PlotData> | null = useMemo(() => {
    if (!showPareto || paretoLine.length < 2) return null;
    return {
      type: 'scatter',
      mode: 'lines',
      name: 'Pareto front',
      x: paretoLine.map((p) => p.x),
      y: paretoLine.map((p) => p.y),
      line: { color: '#1a1a1a', width: 2, dash: 'dot' },
      hoverinfo: 'skip',
      showlegend: true,
    };
  }, [showPareto, paretoLine]);

  // Optimum annotation. axref/ayref MUST be set to 'pixel' explicitly: Plotly's
  // default for axref is the same as xref, which on log axes treats ax as a data
  // value (not a pixel offset) and pushes the annotation light-years off-chart.
  const annotations: Partial<Annotations>[] = useMemo(() => {
    if (!optimum.point) return [];
    return [
      {
        x: optimum.point.x,
        y: optimum.point.y,
        xref: 'x',
        yref: 'y',
        ax: 70,
        ay: -60,
        axref: 'pixel',
        ayref: 'pixel',
        text:
          `<b>Optimum (min m̃)</b><br>${optimum.point.material.short_name ?? optimum.point.material.name}<br>` +
          `m̃ = ${optimum.mm.toPrecision(3)}`,
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
      // Coupling-line label, anchored to paper coords so it can't push out the axes.
      {
        x: 0.98,
        y: 0.02,
        xref: 'paper',
        yref: 'paper',
        text: `Coupling line  ·  Cc = ${Cc.toPrecision(3)}`,
        showarrow: false,
        bgcolor: 'rgba(255,255,255,0.92)',
        bordercolor: '#c00',
        borderwidth: 1,
        borderpad: 4,
        font: { size: 11, color: '#c00' },
        xanchor: 'right',
        yanchor: 'bottom',
      },
    ];
  }, [optimum, Cc]);

  // Explicit axis ranges from data bounds (log10 units, since axis type='log').
  // Without this, Plotly's auto-range can be pulled out by shape/annotation positions.
  const xRange = useMemo<[number, number] | undefined>(() => {
    if (points.length === 0) return undefined;
    const xs = points.map((p) => p.x);
    return [Math.log10(Math.min(...xs) * 0.3), Math.log10(Math.max(...xs) * 3)];
  }, [points]);

  const yRange = useMemo<[number, number] | undefined>(() => {
    if (points.length === 0) return undefined;
    const ys = points.map((p) => p.y);
    return [Math.log10(Math.min(...ys) * 0.3), Math.log10(Math.max(...ys) * 3)];
  }, [points]);

  const allShapes: Partial<Shape>[] = [];
  if (selectionBoxShape) allShapes.push(selectionBoxShape);
  if (couplingLineShape) allShapes.push(couplingLineShape);

  const data: Partial<PlotData>[] = paretoTrace ? [paretoTrace, ...familyTraces] : familyTraces;

  const layout: Partial<Layout> = {
    title: {
      text: `Coupling chart: ${index2.label} vs ${index1.label}`,
      font: { size: 16 },
    },
    xaxis: {
      title: { text: `I₁ = ${index1.expr}  (${index1.label})  →  better is smaller` },
      type: 'log',
      range: xRange,
      gridcolor: '#e5e5e5',
      zeroline: false,
    },
    yaxis: {
      title: { text: `I₂ = ${index2.expr}  (${index2.label})  ↑  better is smaller` },
      type: 'log',
      range: yRange,
      gridcolor: '#e5e5e5',
      zeroline: false,
    },
    shapes: allShapes,
    annotations,
    showlegend: true,
    legend: { x: 1.02, y: 1, xanchor: 'left', yanchor: 'top' },
    margin: { l: 100, r: 220, t: 60, b: 80 },
    plot_bgcolor: '#fafafa',
    paper_bgcolor: 'white',
    hovermode: 'closest',
  };

  return (
    <Plot
      data={data}
      layout={layout}
      config={{
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        toImageButtonOptions: { format: 'png', filename: 'openchartms-coupling', scale: 2 },
      }}
      style={{ width: '100%', height: '720px' }}
      useResizeHandler
    />
  );
}
