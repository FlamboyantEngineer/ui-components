import { type ReactNode, type Ref } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Key, Size, Tone } from '../../core/props.js';
export type SegmentedBarSize = Extract<Size, 'sm' | 'md' | 'lg'>;
/** One named part of the whole. */
export interface SegmentedBarSegment {
    /** Identifies the segment among its siblings. */
    id: Key;
    /** Names the segment in the legend and the summary. */
    label: string;
    /** The segment's amount; values that are not finite, positive numbers count as 0. */
    value: number;
    /** What the segment stands for. Defaults to `neutral`. */
    tone?: Tone | undefined;
}
export type SegmentedBarShape = 'linear' | 'donut' | 'pie';
export interface SegmentedBarProps extends BaseProps, AriaLabellingProps {
    /** Linear track, donut ring or filled pie. Defaults to linear. */
    shape?: SegmentedBarShape | undefined;
    /** Fill the segments once on first visibility; the host stylesheet chooses the motion. Defaults to false. */
    animated?: boolean | undefined;
    /** The parts, in the order they are drawn. */
    segments: readonly SegmentedBarSegment[];
    /** Visible label. Without one, name the bar with `aria-label` or `aria-labelledby`. */
    label?: ReactNode;
    /** The whole the shares are of. Defaults to the sum of the segments, and is never below it. */
    total?: number | undefined;
    /** Show the total beside the label. Defaults to `true`. */
    showTotal?: boolean | undefined;
    /** Show the summary list as a visible legend. Defaults to `false`: only assistive technology reads it. */
    showLegend?: boolean | undefined;
    /** Track thickness. Defaults to `md`. */
    size?: SegmentedBarSize | undefined;
    /** How counts and the total are formatted, such as with a unit. */
    formatOptions?: Intl.NumberFormatOptions | undefined;
    /** The root element. */
    ref?: Ref<HTMLDivElement> | undefined;
}
/**
 * One bar split into proportional segments, such as passed, failed and skipped checks, with a
 * summary list of each segment's count and share that a legend can show.
 */
export declare function SegmentedBar({ segments, label, shape, animated, total, showTotal, showLegend, size, formatOptions, className, ...rest }: SegmentedBarProps): import("react").JSX.Element;
//# sourceMappingURL=segmented-bar.d.ts.map