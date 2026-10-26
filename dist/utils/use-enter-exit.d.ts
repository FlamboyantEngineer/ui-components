import { type RefObject } from 'react';
export interface EnterExitState {
    /** Render the element: true while open and through its exit animations. */
    isMounted: boolean;
    /** The element has just appeared and its enter animations are running; publish `data-entering`. */
    isEntering: boolean;
    /** The element is closing and its exit animations are running; publish `data-exiting`. */
    isExiting: boolean;
}
/**
 * Keeps an element mounted through its exit and reports when it is entering or exiting, so a
 * stylesheet can animate `data-entering` and `data-exiting` as it does for React Aria overlays.
 * Each phase lasts until the CSS animations and transitions running on the element finish; with
 * none, it ends before the browser paints.
 */
export declare function useEnterExit(ref: RefObject<Element | null>, isOpen: boolean): EnterExitState;
//# sourceMappingURL=use-enter-exit.d.ts.map