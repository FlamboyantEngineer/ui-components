import type { SegmentedBarSegment } from './segmented-bar.js';
/** A segment's bounded amount, share and starting percentage of the whole. */
export interface SegmentedPart {
    segment: SegmentedBarSegment;
    value: number;
    share: number;
    start: number;
}
/** The whole and each segment's geometry, preserving shares when the sum overflows. */
export declare function resolveSegmentedBar(segments: readonly SegmentedBarSegment[], total?: number): {
    total: number;
    segments: SegmentedPart[];
};
/** Unitless geometry quantities let the host choose its own sequential animation timing. */
export declare function toSegmentProperties({ share, start }: SegmentedPart): {
    [x: string]: string;
};
//# sourceMappingURL=segmented-layout.d.ts.map