import { type RefObject } from 'react';
/**
 * The box `useElementSize` reports:
 * - `content-box`: the content rectangle (the default);
 * - `border-box`: the border box, inline size as width;
 * - `client`: `clientWidth` × `clientHeight`, the padding box without scrollbars, which also changes
 *   when a scrollbar appears or disappears.
 */
export type ElementSizeBox = 'content-box' | 'border-box' | 'client';
export interface ElementSize {
    readonly width: number;
    readonly height: number;
}
export interface ElementSizeOptions {
    /** The box to measure. Defaults to `content-box`. */
    readonly box?: ElementSizeBox | undefined;
    /** Measure the element's parent instead. Defaults to false. */
    readonly parent?: boolean | undefined;
    /** False stops measuring and returns `null`. Defaults to true. */
    readonly enabled?: boolean | undefined;
}
/** An element, or a ref whose element is stable. Hold late-mounting elements in state instead. */
export type ElementSizeTarget = Element | RefObject<Element | null> | null | undefined;
/**
 * The size of `target` (or its parent), or `null` before the first measurement, while disabled,
 * and in a window without `ResizeObserver`. The observer and animation frames come from the
 * element's own window. The first report applies at once; later reports coalesce to one update per
 * animation frame. An unchanged size keeps the previous object, so the result is a stable effect
 * dependency. A replaced element starts unmeasured.
 */
export declare function useElementSize(target: ElementSizeTarget, { box, parent, enabled }?: ElementSizeOptions): ElementSize | null;
//# sourceMappingURL=use-element-size.d.ts.map