import { type RefObject } from 'react';
import { type NearPages } from './use-near-pages.js';
export interface UsePdfPagesOptions {
    scrollerRef: RefObject<HTMLElement | null>;
    /** The open document; a new one starts at its first page. */
    document: object | null;
    pageCount: number;
}
/** A rectangle on a page in CSS pixels from the top-left corner of its bitmap. */
export interface PagePixelRect {
    left: number;
    top: number;
    width: number;
    height: number;
}
export interface PdfPagesController {
    /** Pages within a screen of the view, which render; `null` when every page renders. */
    nearPages: ReadonlySet<number> | null;
    /** The page that fills most of the view, zero-based. */
    currentPage: number;
    /** Every page element, by page index. */
    elements: NearPages['elements'];
    registerPage(pageIndex: number, element: HTMLElement | null): void;
    /**
     * Scrolls a page, or a rectangle on it, to where the first page sits when the view is at the top.
     */
    scrollToPage(pageIndex: number, rect?: PagePixelRect): void;
    /** Scrolls an element inside a page into the middle of the view unless it is fully visible. */
    revealElement(element: HTMLElement): void;
    /** Call from the scroller's scroll handler. */
    handleScroll(): void;
    /** Records the reader's position before the page sizes change. */
    captureAnchor(): void;
    /** Returns to the recorded position after the page sizes changed. */
    restoreAnchor(): void;
}
/**
 * The page elements of a viewer: which are near the view, which one the reader is on, scrolling to a
 * page or an element, and keeping the reader's place when the zoom changes.
 */
export declare function usePdfPages({ scrollerRef, document, pageCount, }: UsePdfPagesOptions): PdfPagesController;
//# sourceMappingURL=use-pdf-pages.d.ts.map