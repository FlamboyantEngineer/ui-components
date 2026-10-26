import { type RefObject } from 'react';
/** An element to focus: a ref, or a function asked for the element when focus moves. */
export type FocusTarget = RefObject<HTMLElement | null> | (() => HTMLElement | null | undefined);
export interface FocusReturnOptions {
    /** The container whose removal returns focus. */
    containerRef: RefObject<HTMLElement | null>;
    /** The caller's choice of where focus goes when the container leaves the page. */
    finalFocus?: FocusTarget | undefined;
    /** Where focus goes when the caller chose nothing; `null` leaves it to React Aria. */
    fallback: Element | null;
}
/** The element a focus target names now, if it is still in the document. */
export declare function resolveFocusTarget(target: FocusTarget | undefined): HTMLElement | null;
/**
 * When the container leaves the page, moves focus to `finalFocus`, else to `fallback`, provided
 * focus was still inside the container or on the body, so a reader who moved elsewhere keeps their
 * place. It runs while the container is removed, before React Aria's own restoration, which then
 * stands down.
 */
export declare function useFocusReturn({ containerRef, finalFocus, fallback }: FocusReturnOptions): void;
//# sourceMappingURL=focus-target.d.ts.map