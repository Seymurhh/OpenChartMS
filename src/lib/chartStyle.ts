// Shared Plotly axis + chart styling so every tab looks consistent and matches
// the Ashby textbook print aesthetic (cream background, thin dotted gridlines,
// faint minor decade subdivisions behind shapes and traces).

export const PLOT_BG = '#F8F7F2';
export const PAPER_BG = '#F8F7F2';
export const FRAME_COLOR = '#8A8A84';
export const TICK_TEXT = '#52524E';

// Major gridlines: very faint dark grey, dotted, thin. Lives behind every shape
// because Plotly draws axes before any shape/trace.
const MAJOR_GRID_COLOR = 'rgba(60, 60, 55, 0.18)';
const MINOR_GRID_COLOR = 'rgba(60, 60, 55, 0.08)';

// Spread into any xaxis/yaxis Plotly layout object. Caller still sets `title`,
// `type`, `range`, and direction-specific labels.
export const AXIS_STYLE = {
  gridcolor: MAJOR_GRID_COLOR,
  gridwidth: 0.5,
  griddash: 'dot' as const,
  showline: true,
  linecolor: FRAME_COLOR,
  linewidth: 1,
  mirror: 'ticks' as const,
  tickcolor: FRAME_COLOR,
  tickfont: { color: TICK_TEXT, size: 11, family: 'Inter, sans-serif' },
  zeroline: false,
  // minor: decade subdivisions on log axes; ignored harmlessly on linear axes.
  minor: {
    showgrid: true,
    gridcolor: MINOR_GRID_COLOR,
    gridwidth: 0.3,
    griddash: 'dot' as const,
  },
};

export const HOVER_LABEL = {
  bgcolor: '#FFFFFF',
  bordercolor: '#D8D7CF',
  font: { color: '#1A1A18', size: 12, family: 'Inter, sans-serif' },
};

export const LEGEND_STYLE = {
  x: 1.02,
  y: 1,
  xanchor: 'left' as const,
  yanchor: 'top' as const,
  font: { color: TICK_TEXT, size: 12, family: 'Inter, sans-serif' },
  bgcolor: 'rgba(255,255,255,0.85)',
  bordercolor: '#D8D7CF',
  borderwidth: 1,
};
