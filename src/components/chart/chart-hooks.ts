import { createHooks } from '../../core/hooks.js';

/** The hook classes of the chart family (specs/CHART.md). */
export const chartHooks = createHooks('chart', [
  'header',
  'title',
  'view-toggle',
  'summary',
  'body',
  'plot',
  'empty',
  'table',
  'tooltip',
  'tooltip-title',
  'tooltip-swatch',
  'tooltip-label',
  'tooltip-value',
  'viewport',
  'selection',
  'references',
  'reference',
  'reference-line',
  'reference-band',
  'reference-label',
]);

export const barChartHooks = createHooks('bar-chart', ['bar']);

export const lineChartHooks = createHooks('line-chart', ['line', 'area', 'point']);

export const donutChartHooks = createHooks('donut-chart', ['slice', 'total']);

export const scatterChartHooks = createHooks('scatter-chart', ['point']);

export const calendarHeatmapHooks = createHooks('calendar-heatmap', [
  'cell',
  'month',
  'weekday',
  'legend',
  'legend-item',
  'legend-swatch',
  'legend-label',
]);

export const chartAxisHooks = createHooks('chart-axis', ['line', 'tick', 'label', 'grid']);

export const chartLegendHooks = createHooks('chart-legend', ['item', 'swatch', 'label']);

export const eventChartHooks = createHooks('event-chart', ['event']);
export const linkedChartHooks = createHooks('linked-line-chart', [
  'channel',
  'line',
  'comparison',
  'envelope',
  'cursor',
  'marker',
  'readout',
]);
