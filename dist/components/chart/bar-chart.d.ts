import type { ReactNode, Ref } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Orientation } from '../../core/props.js';
import { type BarChartLayout } from './bar-geometry.js';
import { type ChartSeries, type ChartViewProps } from './chart.js';
import { type ChartHiddenKeysProps } from './chart-legend.js';
export type { BarChartLayout } from './bar-geometry.js';
/** A series of a bar chart: one value per category, in the order of the categories. */
export interface BarChartSeries extends ChartSeries {
    /** Values that are not finite numbers draw no bar. */
    values: readonly number[];
}
export interface BarChartProps extends BaseProps, AriaLabellingProps, ChartViewProps, ChartHiddenKeysProps {
    /** Visible title that names the chart. Without one, name it with `aria-label` or `aria-labelledby`. */
    label?: ReactNode;
    /** The categories along the category axis, each named once. */
    categories: readonly string[];
    /** The series, in the order of their colour slots. */
    series: readonly BarChartSeries[];
    /** `grouped` bars side by side or `stacked` into one bar per category. Defaults to `grouped`. */
    layout?: BarChartLayout | undefined;
    /** `vertical` bars rise from the bottom; `horizontal` bars grow from the left. Defaults to `vertical`. */
    orientation?: Orientation | undefined;
    /** Drawing height, in pixels. Defaults to 240; the width follows the container. */
    height?: number | undefined;
    /** How values are formatted on the axis, in names, the tooltip and the table. */
    formatOptions?: Intl.NumberFormatOptions | undefined;
    /** Heads the table's column of categories. Defaults to the provider's `chartCategory` string. */
    categoryLabel?: string | undefined;
    /** Replaces the generated summary of the values. */
    summary?: string | undefined;
    /** Show the summary under the title. Defaults to `false`. */
    showSummary?: boolean | undefined;
    /** Show the legend. Defaults to `true` when there is more than one series. */
    showLegend?: boolean | undefined;
    /** The root element. */
    ref?: Ref<HTMLDivElement> | undefined;
}
/**
 * A bar chart of one or more series over categories, grouped or stacked, vertical or horizontal,
 * on a value axis that starts at zero. Each bar is a named, focusable value with a tooltip; the
 * legend shows and hides series, and the values can be shown as a table.
 */
export declare function BarChart({ label, categories, series, layout, orientation, height, formatOptions, categoryLabel, summary, showSummary, showLegend, hiddenKeys, defaultHiddenKeys, onHiddenKeysChange, className, ref, ...rest }: BarChartProps): import("react").JSX.Element;
//# sourceMappingURL=bar-chart.d.ts.map