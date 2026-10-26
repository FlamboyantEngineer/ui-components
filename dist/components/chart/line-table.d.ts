import type { ChartTable } from './chart.js';
import type { LineChartSeries } from './line-chart.js';
import type { LineXAxis } from './line-x-axis.js';
/**
 * Every series' values by coordinate, keeping the first point at a repeated coordinate. Each source
 * coordinate is read once, before the distinct coordinates are ordered.
 */
export declare function toLineTable(series: readonly LineChartSeries[], { xAxis, format, categoryLabel, }: {
    xAxis: LineXAxis;
    format: Intl.NumberFormat;
    categoryLabel: string;
}): ChartTable;
//# sourceMappingURL=line-table.d.ts.map