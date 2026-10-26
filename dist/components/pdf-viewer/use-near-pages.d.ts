import { type RefObject } from 'react';
export interface NearPages {
    /** Every registered page element, by page index. */
    elements: RefObject<Map<number, HTMLElement>>;
    /** Pages within a screen of the view; `null` when the platform cannot tell, so every page renders. */
    nearPages: ReadonlySet<number> | null;
    registerPage(pageIndex: number, element: HTMLElement | null): void;
}
/** Tracks which pages are near the view with an `IntersectionObserver` rooted at the scroller. */
export declare function useNearPages(scrollerRef: RefObject<HTMLElement | null>): NearPages;
//# sourceMappingURL=use-near-pages.d.ts.map