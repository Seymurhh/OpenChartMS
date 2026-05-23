import { useMemo } from 'react';
import Plot from 'react-plotly.js';
import type { Annotations, Layout, PlotData, Shape } from 'plotly.js';
import { families, materials } from '../data/loadMaterials';
import type { Material } from '../data/types';
import type { ConstraintIndex } from '../data/constraintIndices';
import { paretoFront, paretoFrontOrdered, type ParetoPoint } from '../lib/pareto';
import { AXIS_STYLE, HOVER_LABEL, LEGEND_STYLE, PAPER_BG, PLOT_BG } from '../lib/chartStyle';

interface Props {
  index1: ConstraintIndex;
  index2: ConstraintIndex;
  Cc: number; // coupling constant: optimum is min over materials of max(I1, I2/Cc)
  showPareto: boolean;
  showSelectionBox: boolean;
  showLabels?: boolean;
}

interface MaterialPoint extends ParetoPoint {
  material: Material;
  minmax: number; // max(I1, I2/Cc)
}

export function CouplingChart({
  index1,
  index2,
  Cc,
  showPareto,
  showSelectionBox,
  showLabels = false,
}: Props) {
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
  }, [points, paretoIds, index1, index2, showLabels]);

  // Optimum overlay — a guaranteed-visible red star at the optimum material's
  // position, drawn as a trace (annotations can fall behind legend/quadrant pills
  // depending on where the optimum lands).
  const optimumTrace: Partial<PlotData> | null = useMemo(() => {
    if (!optimum.point) return null;
    return {
      type: 'scatter',
      mode: 'text+markers',
      name: '★ Optimum (min m̃)',
      x: [optimum.point.x],
      y: [optimum.point.y],
      text: [`<b>${optimum.point.material.short_name ?? optimum.point.material.name}</b>`],
      textposition: 'top right',
      textfont: { size: 12, color: '#c00', family: 'Inter, sans-serif' },
      marker: {
        color: '#c00',
        size: 22,
        symbol: 'star',
        line: { color: 'white', width: 2.5 },
      },
      hovertemplate:
        `<b>Optimum (min m̃)</b><br>${optimum.point.material.name}<br>m̃ = ${optimum.mm.toPrecision(3)}<extra></extra>`,
      showlegend: true,
    };
  }, [optimum]);

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

  // Optimum + reference annotations. Order matters: later entries draw on top, so
  // the optimum annotation is placed LAST to ensure it sits above the quadrant
  // pills and any selection-box overlay.
  //
  // IMPORTANT: On Plotly log axes, annotation x/y with xref/yref='x'/'y' are
  // treated as log₁₀ values (not actual data values), causing the arrow tip to
  // land at 10^(data_value) instead of the intended position. To avoid this,
  // we convert the optimum's data coordinates to paper (0-1) fractions and use
  // xref/yref='paper' — these are unambiguous regardless of axis type.
  const annotations: Partial<Annotations>[] = useMemo(() => {
    if (!optimum.point || !xRange || !yRange) return [];

    // Paper-space position of the optimum point (0=left/bottom, 1=right/top).
    const xPaper =
      (Math.log10(optimum.point.x) - xRange[0]) / (xRange[1] - xRange[0]);
    const yPaper =
      (Math.log10(optimum.point.y) - yRange[0]) / (yRange[1] - yRange[0]);

    return [
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
      // Quadrant labels — which constraint is active in each half-plane (Ashby §9.2).
      // Above the coupling line: I₂ > Cc·I₁ ⇒ m̃ = I₂/Cc ⇒ constraint 2 binds.
      // Below the coupling line: I₂ < Cc·I₁ ⇒ m̃ = I₁  ⇒ constraint 1 binds.
      {
        x: 0.03,
        y: 0.97,
        xref: 'paper',
        yref: 'paper',
        text: `<b>Constraint 2 binds</b><br><span style="font-size:10px">I₂ &gt; Cc·I₁  ⇒  m̃ = I₂ / Cc</span>`,
        showarrow: false,
        bgcolor: 'rgba(255,255,255,0.82)',
        bordercolor: '#8A8A84',
        borderwidth: 1,
        borderpad: 5,
        font: { size: 11, color: '#52524E', family: 'Inter, sans-serif' },
        xanchor: 'left',
        yanchor: 'top',
        align: 'left',
      },
      {
        x: 0.97,
        y: 0.35,
        xref: 'paper',
        yref: 'paper',
        text: `<b>Constraint 1 binds</b><br><span style="font-size:10px">I₂ &lt; Cc·I₁  ⇒  m̃ = I₁</span>`,
        showarrow: false,
        bgcolor: 'rgba(255,255,255,0.82)',
        bordercolor: '#8A8A84',
        borderwidth: 1,
        borderpad: 5,
        font: { size: 11, color: '#52524E', family: 'Inter, sans-serif' },
        xanchor: 'right',
        yanchor: 'top',
        align: 'left',
      },
      // Optimum callout — last so it draws above quadrant pills.
      // xref/yref='paper' avoids Plotly's log-axis annotation coordinate bug.
      {
        x: xPaper,
        y: yPaper,
        xref: 'paper',
        yref: 'paper',
        ax: 100,
        ay: -90,
        axref: 'pixel',
        ayref: 'pixel',
        text:
          `<b>Optimum (min m̃)</b><br>${optimum.point.material.short_name ?? optimum.point.material.name}<br>` +
          `m̃ = ${optimum.mm.toPrecision(3)}`,
        showarrow: true,
        arrowhead: 4,
        arrowsize: 1.3,
        arrowwidth: 2,
        arrowcolor: '#c00',
        bgcolor: '#ffffff',
        bordercolor: '#c00',
        borderwidth: 2,
        borderpad: 7,
        font: { size: 12, color: '#1a1a1a', family: 'Inter, sans-serif' },
        align: 'left',
      },
    ];
  }, [optimum, Cc, xRange, yRange]);

  const allShapes: Partial<Shape>[] = [];
  if (selectionBoxShape) allShapes.push(selectionBoxShape);
  if (couplingLineShape) allShapes.push(couplingLineShape);

  const baseData: Partial<PlotData>[] = paretoTrace
    ? [paretoTrace, ...familyTraces]
    : familyTraces;
  const data: Partial<PlotData>[] = optimumTrace ? [...baseData, optimumTrace] : baseData;

  const layout: Partial<Layout> = {
    title: {
      text: `Coupling chart: ${index2.label} vs ${index1.label}`,
      font: { size: 16, color: '#2a2a26', family: 'Inter, sans-serif' },
    },
    xaxis: {
      ...AXIS_STYLE,
      title: { text: `I₁ = ${index1.expr}  (${index1.label})  →  better is smaller`, font: { color: '#52524E', size: 13 } },
      type: 'log',
      range: xRange,
    },
    yaxis: {
      ...AXIS_STYLE,
      title: { text: `I₂ = ${index2.expr}  (${index2.label})  ↑  better is smaller`, font: { color: '#52524E', size: 13 } },
      type: 'log',
      range: yRange,
    },
    shapes: allShapes,
    annotations,
    showlegend: true,
    legend: LEGEND_STYLE,
    margin: { l: 100, r: 220, t: 60, b: 80 },
    plot_bgcolor: PLOT_BG,
    paper_bgcolor: PAPER_BG,
    hovermode: 'closest',
    hoverlabel: HOVER_LABEL,
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
