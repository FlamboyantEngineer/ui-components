import type { Orientation } from '../../core/props.js';
import { type BandScale } from '../../utils/band-scale.js';
import { type LinearScale } from '../../utils/linear-scale.js';
import { type ChartBox, type ChartMargin } from './chart-layout.js';
/** `grouped` sets a category's bars side by side; `stacked` piles them into one bar. */
export type BarChartLayout = 'grouped' | 'stacked';
/** A drawn series: its position among the chart's series and one value per category. */
export interface BarGeometrySeries {
    series: number;
    values: readonly number[];
}
export interface BarGeometryInput {
    categories: readonly string[];
    /** The series drawn, without the hidden ones. */
    series: readonly BarGeometrySeries[];
    layout: BarChartLayout;
    /** `vertical` bars rise from a bottom axis; `horizontal` bars grow from a left axis. */
    orientation: Orientation;
    width: number;
    height: number;
    margin: ChartMargin;
    /** BCP 47 locale of the value axis labels. */
    locale: string;
    /** How the value axis labels are formatted; by default with the tick step's decimals. */
    formatOptions?: Intl.NumberFormatOptions | undefined;
}
/** One drawn bar. */
export interface BarRect {
    key: string;
    series: number;
    /** The category's position. */
    index: number;
    value: number;
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface BarGeometry {
    bars: BarRect[];
    /** Values to positions along the value axis. */
    values: LinearScale;
    /** Categories to bands along the category axis. */
    bands: BandScale;
    plot: ChartBox;
}
/** The value axis, also used to measure tick labels before laying out bars. */
export declare function createBarValueScale(input: BarGeometryInput, plot: ChartBox): LinearScale;
/**
 * Lays bars out in a box: one band per category along the category axis, and each value from zero
 * (or from the top of the values stacked under it) along a nice value axis that always includes
 * zero. Grouped bars split their band between the drawn series. Values that are not finite numbers
 * draw no bar. Coordinates are rounded to two decimals.
 */
export declare function resolveBarGeometry(input: BarGeometryInput, valueScale?: LinearScale): BarGeometry;
//# sourceMappingURL=bar-geometry.d.ts.map