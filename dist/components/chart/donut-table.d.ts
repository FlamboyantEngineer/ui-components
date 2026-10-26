import type { ChartTable } from './chart.js';
import type { DonutChartSegment } from './donut-chart.js';
export interface DonutFormats {
    value: Intl.NumberFormat;
    share: Intl.NumberFormat;
}
/** Every segment's value and share of the whole, hidden ones included, in linear passes. */
export declare function toDonutTable(segments: readonly DonutChartSegment[], { formats, headings }: {
    formats: DonutFormats;
    headings: readonly string[];
}): ChartTable;
//# sourceMappingURL=donut-table.d.ts.map