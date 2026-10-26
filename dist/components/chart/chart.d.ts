import { type ReactNode, type Ref } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Key, Tone } from '../../core/props.js';
/** `chart` shows the drawing; `table` shows the values as a table instead. */
export type ChartView = 'chart' | 'table';
/** One named set of values, drawn in the colour slot of its position among the chart's series. */
export interface ChartSeries {
    /** Identifies the series among its siblings. */
    id: Key;
    /** Names the series in the legend, the tooltip, the table and each value's name. */
    label: string;
    /** What the series stands for, such as `success` for passed checks. Unset, its position decides. */
    tone?: Tone | undefined;
}
/** A chart's values as a table: column headings, then rows whose first cell names the row. */
export interface ChartTable {
    columns: readonly string[];
    rows: ReadonlyArray<readonly string[]>;
}
/** The view state of a chart, controlled or not. */
export interface ChartViewProps {
    /** The view shown, controlled. */
    view?: ChartView | undefined;
    /** The view shown at first, uncontrolled. Defaults to `chart`. */
    defaultView?: ChartView | undefined;
    /** Called with the view the reader switches to. */
    onViewChange?: ((view: ChartView) => void) | undefined;
}
export interface ChartProps extends BaseProps, AriaLabellingProps, ChartViewProps {
    /** Visible title that names the chart. Without one, name it with `aria-label` or `aria-labelledby`. */
    label?: ReactNode;
    /** Text that describes what the chart shows, such as its range of values. */
    summary: string;
    /** Show the summary under the title. Defaults to `false`: only assistive technology reads it. */
    showSummary?: boolean | undefined;
    /** The values the table view lists. */
    table: ChartTable;
    /** A legend shown above the drawing, such as a `ChartLegend`. */
    legend?: ReactNode;
    /** The drawing. */
    children?: ReactNode;
    /** The root element. */
    ref?: Ref<HTMLDivElement> | undefined;
}
/**
 * The accessible frame of a chart: a named figure described by a text summary, with a legend, the
 * drawing, and a toggle that shows the values as a table instead. Bar, line and donut charts render
 * it around their drawings; a host wraps its own drawing in it the same way.
 */
export declare function Chart({ label, summary, showSummary, table, legend, view, defaultView, onViewChange, children, className, 'aria-describedby': describedBy, ...rest }: ChartProps): import("react").JSX.Element;
//# sourceMappingURL=chart.d.ts.map