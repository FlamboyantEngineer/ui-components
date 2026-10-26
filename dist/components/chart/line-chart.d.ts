import type { ReactNode, Ref } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { type ChartSeries, type ChartViewProps } from './chart.js';
import { type ChartHiddenKeysProps } from './chart-legend.js';
import { type LineChartPoint } from './line-geometry.js';
export type { LineChartPoint } from './line-geometry.js';
export type { LineChartX } from './line-x-axis.js';
/** `line` draws each series as a line; `area` also fills the space under it. */
export type LineChartVariant = 'line' | 'area';
/** A series of a line chart: its values, in any order of x. */
export interface LineChartSeries extends ChartSeries {
    points: readonly LineChartPoint[];
}
export interface LineChartProps extends BaseProps, AriaLabellingProps, ChartViewProps, ChartHiddenKeysProps {
    /** Visible title that names the chart. Without one, name it with `aria-label` or `aria-labelledby`. */
    label?: ReactNode;
    /** The series, in the order of their colour slots. Dates make a time axis; numbers a linear one. */
    series: readonly LineChartSeries[];
    /** Lines, or lines over filled areas. Defaults to `line`. */
    variant?: LineChartVariant | undefined;
    /** Drawing height, in pixels. Defaults to 240; the width follows the container. */
    height?: number | undefined;
    /** The value at the bottom edge. Defaults to a nice value at or below zero and the lowest value. */
    minValue?: number | undefined;
    /** The value at the top edge. Defaults to a nice value at or above zero and the highest value. */
    maxValue?: number | undefined;
    /** How values are formatted on the axis, in names, the tooltip and the table. */
    formatOptions?: Intl.NumberFormatOptions | undefined;
    /** The IANA time zone that reads dates and places date ticks. Defaults to the runtime's. */
    timeZone?: string | undefined;
    /** Heads the table's column of x values. Defaults to the provider's `chartCategory` string. */
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
 * A line chart of one or more series over dates (a time axis) or numbers (a linear axis), drawn as
 * lines or filled areas. Each point is a named, focusable value with a tooltip; the legend shows
 * and hides series, and the values can be shown as a table.
 */
export declare function LineChart({ label, series, variant, height, minValue, maxValue, formatOptions, timeZone, categoryLabel, summary, showSummary, showLegend, hiddenKeys, defaultHiddenKeys, onHiddenKeysChange, className, ref, ...rest }: LineChartProps): import("react").JSX.Element;
//# sourceMappingURL=line-chart.d.ts.map