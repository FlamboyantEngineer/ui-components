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
  'references',
  'reference',
  'reference-line',
  'reference-band',
  'reference-label',
]);

export const barChartHooks = createHooks('bar-chart', ['bar']);

export const lineChartHooks = createHooks('line-chart', ['line', 'area', 'point']);

export const donutChartHooks = createHooks('donut-chart', ['slice', 'total']);

export const chartAxisHooks = createHooks('chart-axis', ['line', 'tick', 'label', 'grid']);

export const chartLegendHooks = createHooks('chart-legend', ['item', 'swatch', 'label']);
