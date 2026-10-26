import type { ReactNode, Ref } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { type ChartSeries, type ChartViewProps } from './chart.js';
import { type ChartHiddenKeysProps } from './chart-legend.js';
/** One part of a donut chart's whole. */
export interface DonutChartSegment extends ChartSeries {
    /** The segment's amount; values that are not finite, positive numbers draw no slice. */
    value: number;
}
export interface DonutChartProps extends BaseProps, AriaLabellingProps, ChartViewProps, ChartHiddenKeysProps {
    /** Visible title that names the chart. Without one, name it with `aria-label` or `aria-labelledby`. */
    label?: ReactNode;
    /** The segments, clockwise from the top, in the order of their colour slots. */
    segments: readonly DonutChartSegment[];
    /** The ring's diameter, in pixels. Defaults to 160. */
    diameter?: number | undefined;
    /** How values and the total are formatted. */
    formatOptions?: Intl.NumberFormatOptions | undefined;
    /** Heads the table's column of segments. Defaults to the provider's `chartCategory` string. */
    categoryLabel?: string | undefined;
    /** Replaces the generated summary of the total and the largest segment. */
    summary?: string | undefined;
    /** Show the summary under the title. Defaults to `false`. */
    showSummary?: boolean | undefined;
    /** Show the legend. Defaults to `true`. */
    showLegend?: boolean | undefined;
    /** The root element. */
    ref?: Ref<HTMLDivElement> | undefined;
}
/**
 * A donut chart of the parts of a whole, with the total in the middle. Each slice is a named,
 * focusable value with a tooltip; the legend shows and hides segments, and the values can be shown
 * as a table.
 */
export declare function DonutChart({ label, segments, diameter, formatOptions, categoryLabel, summary, showSummary, showLegend, hiddenKeys, defaultHiddenKeys, onHiddenKeysChange, className, ...rest }: DonutChartProps): import("react").JSX.Element;
//# sourceMappingURL=donut-chart.d.ts.map