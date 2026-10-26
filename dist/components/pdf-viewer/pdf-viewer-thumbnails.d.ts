import type { PdfTextContent, PdfViewport } from './pdf-engine.js';
import { type LoadedPdf } from './use-pdf-document.js';
export interface PdfViewerThumbnailsProps<V extends PdfViewport = PdfViewport, C extends PdfTextContent = PdfTextContent> {
    /** The open document as the reader turned it. */
    view: LoadedPdf<V, C>;
    currentPage: number;
    onPageChange(pageIndex: number): void;
}
/** The pages as thumbnails, the current one selected; choosing one goes to its page. */
export declare function PdfViewerThumbnails<V extends PdfViewport, C extends PdfTextContent>({ view, currentPage, onPageChange, }: PdfViewerThumbnailsProps<V, C>): import("react").JSX.Element;
//# sourceMappingURL=pdf-viewer-thumbnails.d.ts.map