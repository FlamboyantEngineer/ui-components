import { type RefObject } from 'react';
/** An element to observe: the element itself, a ref to it, or the element with the box to watch. */
export type ResizeObserverTarget = Element | RefObject<Element | null> | {
    readonly element: Element | null | undefined;
    readonly box?: ResizeObserverBoxOptions | undefined;
} | null | undefined;
/** The targets, or a function returning them that is called after every commit. */
export type ResizeObserverTargets = readonly ResizeObserverTarget[] | (() => readonly ResizeObserverTarget[]);
/**
 * Observes the size of committed elements with a `ResizeObserver` from each element's own window,
 * so content inside an iframe is observed there. Targets are resolved after every commit; a fresh
 * array or a new callback does not restart observations of unchanged elements. One observer is
 * shared per window and box, and an element can be watched in two boxes at once.
 */
export declare function useResizeObserver(targets: ResizeObserverTargets, onResize: ResizeObserverCallback): void;
//# sourceMappingURL=use-resize-observer.d.ts.map