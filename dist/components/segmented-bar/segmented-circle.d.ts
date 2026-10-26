import type { CSSProperties, Ref } from 'react';
import type { SegmentedBarShape } from './segmented-bar.js';
import { type SegmentedPart } from './segmented-layout.js';
import type { SegmentedAnimationState } from './use-segmented-animation.js';
/** The same shares around a full circle; a pie's thicker stroke reaches its center. */
export declare function SegmentedCircle({ shape, segments, animationState, style, ref, }: {
    shape: Exclude<SegmentedBarShape, 'linear'>;
    segments: readonly SegmentedPart[];
    animationState: SegmentedAnimationState;
    style: CSSProperties;
    ref: Ref<SVGSVGElement>;
}): import("react").JSX.Element;
//# sourceMappingURL=segmented-circle.d.ts.map