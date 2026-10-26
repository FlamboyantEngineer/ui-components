import type { PdfTextContent, PdfViewport } from './pdf-engine.js';
import { type LoadedPdf } from './use-pdf-document.js';
import type { PdfPagesController } from './use-pdf-pages.js';
export interface UsePdfRotationOptions<V extends PdfViewport = PdfViewport, C extends PdfTextContent = PdfTextContent> {
    loaded: LoadedPdf<V, C> | null;
    pages: Pick<PdfPagesController, 'captureAnchor' | 'restoreAnchor'>;
}
export interface PdfRotationState<V extends PdfViewport = PdfViewport, C extends PdfTextContent = PdfTextContent> {
    /** The open document as the reader turned it. */
    view: LoadedPdf<V, C> | null;
    /** Turns every page a quarter turn clockwise (90) or counterclockwise (-90). */
    rotate(degrees: 90 | -90): void;
}
/** The document turned by `rotation` degrees clockwise: a quarter turn swaps each page's sides. */
export declare function rotatePdf<V extends PdfViewport, C extends PdfTextContent>(loaded: LoadedPdf<V, C>, rotation: number): LoadedPdf<V, C>;
/**
 * The reader's rotation of the pages, keeping their place across a turn. A new document starts
 * as the document itself sets each page.
 */
export declare function usePdfRotation<V extends PdfViewport, C extends PdfTextContent>({ loaded, pages, }: UsePdfRotationOptions<V, C>): PdfRotationState<V, C>;
//# sourceMappingURL=use-pdf-rotation.d.ts.map