import type { Ref } from 'react';
import type { BaseProps } from '../../core/props.js';
import type { ScaleInterval, ScaleTick } from '../../utils/linear-scale.js';
/** The edge of the drawing an axis runs along. */
export type ChartAxisPosition = 'bottom' | 'left';
export interface ChartAxisProps extends BaseProps {
    /** `bottom` runs along x under the drawing; `left` runs along y beside it. */
    position: ChartAxisPosition;
    /** The marks to label, from a library scale's `ticks()`. */
    ticks: ReadonlyArray<ScaleTick<string | number>>;
    /** Where the axis line sits across its direction: the y of a bottom axis, the x of a left axis. */
    offset: number;
    /** The two ends of the axis line along its direction. */
    range: ScaleInterval;
    /** Draws a grid line from each tick across the drawing, this long (up or to the right). */
    gridLength?: number | undefined;
    /** The `<g>` element. */
    ref?: Ref<SVGGElement> | undefined;
}
/**
 * An SVG axis from a scale's ticks: a line along one edge of the drawing, a mark and a label at
 * each tick, and optional grid lines across the drawing. It is decorative: a chart names its
 * values and lists them in its table.
 */
export declare function ChartAxis({ position, ticks, offset, range, gridLength, className, ...rest }: ChartAxisProps): import("react").JSX.Element;
//# sourceMappingURL=chart-axis.d.ts.map