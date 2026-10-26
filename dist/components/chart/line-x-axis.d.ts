import { type ScaleTick } from '../../utils/linear-scale.js';
/** Where a value sits along a line chart's x axis: an ISO 8601 date or date-time, or a number. */
export type LineChartX = string | number;
export interface LineXAxisOptions {
    /** Every x value drawn. */
    values: readonly LineChartX[];
    /** The positions the lowest and highest values map to. */
    range: readonly [number, number];
    /** About how many ticks to make. */
    tickCount: number;
    timeZone: string;
    locale: string;
}
export interface LineXAxis {
    /** The x value as a sortable number (epoch milliseconds for dates); `NaN` when unreadable. */
    read(value: LineChartX): number;
    /** The position of an x value. */
    map(value: LineChartX): number;
    /** The x value as text: a medium date (with the time for a date-time), or a number. */
    format(value: LineChartX): string;
    ticks: Array<ScaleTick<LineChartX>>;
}
/**
 * The x axis of a line chart. Text values make a time axis read in `timeZone`, ticked on calendar
 * boundaries; numbers make a linear axis. The kind follows the first value; values of the other
 * kind are unreadable.
 */
export declare function createLineXAxis(options: LineXAxisOptions): LineXAxis;
//# sourceMappingURL=line-x-axis.d.ts.map