import { type PdfTarget } from './pdf-destination.js';
import type { PdfLinkService, PdfTextContent, PdfViewport } from './pdf-engine.js';
import type { LoadedPdf } from './use-pdf-document.js';
import type { PdfPagesController } from './use-pdf-pages.js';
export interface UsePdfLinksOptions<V extends PdfViewport = PdfViewport, C extends PdfTextContent = PdfTextContent> {
    /** The open document as the reader turned it. */
    view: LoadedPdf<V, C> | null;
    /** A destination the document defines, gone to each time it changes. */
    destination?: string | null | undefined;
    goTo(target: PdfTarget): void;
    pages: Pick<PdfPagesController, 'currentPage' | 'scrollToPage'>;
}
export interface PdfLinks {
    /** Follows the document's links. */
    linkService: PdfLinkService;
    /** Sends the reader to a named or explicit destination of the open document. */
    followDestination(destination: unknown): void;
}
/**
 * Following the document's own links, outline and destinations: each is resolved against the open
 * document and carried out as a navigation request. `destination` is gone to when it changes and
 * when a document opens with it set.
 */
export declare function usePdfLinks<V extends PdfViewport, C extends PdfTextContent>(options: UsePdfLinksOptions<V, C>): PdfLinks;
//# sourceMappingURL=use-pdf-links.d.ts.map