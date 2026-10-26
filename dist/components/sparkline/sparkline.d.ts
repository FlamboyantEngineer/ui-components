import { type Ref } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { type SparklineMarker } from './sparkline-geometry.js';
export type { SparklineMarker } from './sparkline-geometry.js';
/** `line` draws the values as a line; `area` also fills the space under it. */
export type SparklineVariant = 'line' | 'area';
export interface SparklineProps extends BaseProps, AriaLabellingProps {
    /** The series, in order. Values that are not finite numbers leave gaps. */
    values: readonly number[];
    /** Line or filled area. Defaults to `line`. */
    variant?: SparklineVariant | undefined;
    /** The values to mark with a dot: the lowest, the highest and the last. */
    markers?: readonly SparklineMarker[] | undefined;
    /** The value at the bottom edge, to compare sparklines on one scale. Defaults to the lowest value. */
    minValue?: number | undefined;
    /** The value at the top edge. Defaults to the highest value. */
    maxValue?: number | undefined;
    /** Drawing width, in pixels. Defaults to 80. */
    width?: number | undefined;
    /** Drawing height, in pixels. Defaults to 24. */
    height?: number | undefined;
    /** How the values in the accessible summary are formatted. */
    formatOptions?: Intl.NumberFormatOptions | undefined;
    /** The `<svg>` element. */
    ref?: Ref<SVGSVGElement> | undefined;
}
/**
 * A word-sized drawing of a series of numbers with no axes, such as a week of daily counts, named
 * by its label and described by its lowest, highest and last values.
 */
export declare function Sparkline({ values, variant, markers, minValue, maxValue, width, height, formatOptions, className, 'aria-describedby': describedBy, ...rest }: SparklineProps): import("react").JSX.Element;
//# sourceMappingURL=sparkline.d.ts.map