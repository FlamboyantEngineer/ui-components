import { type LinearScale, type ScaleTick } from '../../utils/linear-scale.js';
import { type ChartBox, type ChartMargin } from './chart-layout.js';
import { type LineChartX, type LineXAxis } from './line-x-axis.js';
/** One value of a line chart's series. */
export interface LineChartPoint {
    /** Where the value sits along the x axis: an ISO 8601 date or date-time, or a number. */
    x: LineChartX;
    /** The value; one that is not a finite number breaks the line. */
    y: number;
}
/** A drawn series: its position among the chart's series and its points. */
export interface LineGeometrySeries {
    series: number;
    points: readonly LineChartPoint[];
}
export interface LineGeometryInput {
    /** The series drawn, without the hidden ones. */
    series: readonly LineGeometrySeries[];
    width: number;
    height: number;
    margin: ChartMargin;
    /** The value at the bottom edge. Defaults to a nice value at or below zero and the lowest value. */
    minValue?: number | undefined;
    /** The value at the top edge. Defaults to a nice value at or above zero and the highest value. */
    maxValue?: number | undefined;
    timeZone: string;
    locale: string;
    formatOptions?: Intl.NumberFormatOptions | undefined;
}
/** A drawn value. */
export interface LinePoint {
    key: string;
    series: number;
    /** Its position among its series' drawn values, in x order. */
    index: number;
    at: LineChartX;
    value: number;
    x: number;
    y: number;
}
/** One series' line through its values, the area under it and its points. */
export interface LinePath {
    series: number;
    line: string;
    area: string;
    points: LinePoint[];
}
export interface LineGeometry {
    lines: LinePath[];
    xAxis: LineXAxis;
    yTicks: Array<ScaleTick<number>>;
    plot: ChartBox;
}
/** The value axis, also used to measure tick labels before laying out paths. */
export declare function createLineValueScale(input: LineGeometryInput, plot: ChartBox): LinearScale;
/**
 * Lays series out in a box: x along a time or linear axis across the readable x values, and
 * values along a value axis (higher values higher up). Points whose x cannot be read are left out;
 * a value that is not a finite number breaks the line and the area, which fills toward zero or
 * the edge nearest it. Coordinates are rounded to two decimals.
 */
export declare function resolveLineGeometry(input: LineGeometryInput, valueScale?: LinearScale): LineGeometry;
//# sourceMappingURL=line-geometry.d.ts.map