import { type RefObject } from 'react';
/** An element, or a ref whose element is stable. Hold late-mounting elements in state instead. */
export type InViewTarget = Element | RefObject<Element | null> | null | undefined;
export interface InViewOptions {
    /** False stops observing and returns false. Defaults to true. */
    readonly enabled?: boolean | undefined;
    /**
     * Also count the target as in view within this many heights (or widths) of its scrolling
     * container past the visible area's end, as React Aria's `scrollOffset` (1 is one full height).
     * Omit to report only actual visibility.
     */
    readonly scrollOffset?: number | undefined;
}
/**
 * Whether any part of `target` is visible in the viewport, after clipping by the scrolling
 * ancestors it sits in, for loading more content or rendering it lazily. False until the first
 * report, while disabled, and in a window without `IntersectionObserver`; the observer comes from
 * the element's own window.
 */
export declare function useInView(target: InViewTarget, { enabled, scrollOffset }?: InViewOptions): boolean;
//# sourceMappingURL=use-in-view.d.ts.map