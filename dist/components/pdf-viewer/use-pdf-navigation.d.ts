import { type RefObject } from 'react';
import type { PdfTarget } from './pdf-destination.js';
import type { PdfTextContent, PdfViewport } from './pdf-engine.js';
import type { PdfPageRect } from './page-geometry.js';
import type { LoadedPdf } from './use-pdf-document.js';
import type { PdfPagesController } from './use-pdf-pages.js';
export interface UsePdfNavigationOptions {
    /** The page the caller wants the reader on, zero-based; `undefined` leaves the viewer in charge. */
    page?: number | undefined;
    onPageChange?: ((pageIndex: number) => void) | undefined;
    /** The page a document opens at when `page` is not set, zero-based. */
    defaultPage?: number | undefined;
    /** The open document; a new one opens at `defaultPage`. */
    document: object | null;
    /** A rectangle to bring into view, in points. */
    revealRect?: PdfPageRect | null | undefined;
    isReady: boolean;
    /** CSS pixels per point. */
    scale: number;
    pageCount: number;
    scrollerRef: RefObject<HTMLElement | null>;
    pages: Pick<PdfPagesController, 'currentPage' | 'elements' | 'scrollToPage'>;
}
export interface UsePageViewportsOptions<V extends PdfViewport = PdfViewport, C extends PdfTextContent = PdfTextContent> {
    loaded: LoadedPdf<V, C> | null;
    nearPages: ReadonlySet<number> | null;
    scale: number;
    onPageViewports?: ((viewports: ReadonlyMap<number, V>) => void) | undefined;
}
/**
 * Going to a page or a rectangle on request, once per request: a request waits until the document
 * has opened, its page is laid out and the viewer is shown, and is then carried out. The page the
 * reader is on is reported whenever it changes. `goTo` makes a request of the viewer's own.
 */
export declare function usePdfNavigation(options: UsePdfNavigationOptions): {
    goTo(target: PdfTarget): void;
};
/** Reports the viewports of the pages that render whenever that set or the zoom changes. */
export declare function usePageViewports<V extends PdfViewport, C extends PdfTextContent>({ loaded, nearPages, scale, onPageViewports, }: UsePageViewportsOptions<V, C>): void;
//# sourceMappingURL=use-pdf-navigation.d.ts.map