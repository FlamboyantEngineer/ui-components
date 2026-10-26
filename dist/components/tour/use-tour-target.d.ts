import { type RefObject } from 'react';
/** The element a step points at: a ref, or a CSS selector looked up when the step shows. */
export type TourTarget = RefObject<Element | null> | string;
/** The target's element, or null when the ref is empty or no element matches the selector. */
export declare function resolveTourTarget(target: TourTarget | undefined): Element | null;
/**
 * Looks up the shown step's target once the tour has rendered, and scrolls it into view. Until the
 * first lookup is done, `isResolved` is false, so the popover does not open at a stale place; on a
 * step change the previous target stands in until the lookup, before the page paints, so the
 * popover and its focus scope stay mounted from step to step.
 */
export declare function useTourTarget(target: TourTarget | undefined, isOpen: boolean): {
    element: Element | null;
    isResolved: boolean;
};
//# sourceMappingURL=use-tour-target.d.ts.map