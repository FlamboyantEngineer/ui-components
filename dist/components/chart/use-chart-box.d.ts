import { type Ref, type RefCallback } from 'react';
export interface ChartFrame {
    /** The drawing width: the frame's measured width, or 480 pixels before it is measured. */
    width: number;
    /** The frame element, once mounted. */
    element: HTMLDivElement | null;
    /** The ref to put on the frame, which also hands it to the caller's ref. */
    frameRef: RefCallback<HTMLDivElement>;
}
/** The chart frame's element and width, which the drawing follows. */
export declare function useChartFrame(ref: Ref<HTMLDivElement> | undefined): ChartFrame;
/**
 * The margin that fits the widest of `labels` beside an axis, measured in the frame's font, or
 * estimated from the longest label where text cannot be measured.
 */
export declare function useLabelMargin(element: Element | null, labels: readonly string[]): number;
//# sourceMappingURL=use-chart-box.d.ts.map