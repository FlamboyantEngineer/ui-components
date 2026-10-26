import { type RefObject } from 'react';
export interface BlockedFocusOptions {
    /** The region's root, which holds focus while the content is blocked. */
    rootRef: RefObject<HTMLElement | null>;
    /** The content that turns inert. */
    contentRef: RefObject<HTMLElement | null>;
    isBlocked: boolean;
}
/**
 * Keeps keyboard focus in place while the content is inert, where browsers would drop it to the
 * document body: focus inside the content moves to the root as blocking starts, and returns to the
 * element that had it once blocking ends, unless the reader has moved focus elsewhere meanwhile.
 */
export declare function useBlockedFocus({ rootRef, contentRef, isBlocked }: BlockedFocusOptions): void;
//# sourceMappingURL=use-blocked-focus.d.ts.map