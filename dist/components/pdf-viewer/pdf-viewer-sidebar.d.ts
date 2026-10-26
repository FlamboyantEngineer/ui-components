import type { PdfTextContent, PdfViewport } from './pdf-engine.js';
import type { LoadedPdf } from './use-pdf-document.js';
export interface PdfViewerSidebarProps<V extends PdfViewport = PdfViewport, C extends PdfTextContent = PdfTextContent> {
    /** The open document as the reader turned it. */
    view: LoadedPdf<V, C>;
    currentPage: number;
    onPageChange(pageIndex: number): void;
    /** Sends the reader to a destination of the document. */
    followDestination(destination: unknown): void;
}
/**
 * The panel beside the pages: the pages as thumbnails, and the document's outline when it has one,
 * which it then opens on.
 */
export declare function PdfViewerSidebar<V extends PdfViewport, C extends PdfTextContent>({ view, currentPage, onPageChange, followDestination, }: PdfViewerSidebarProps<V, C>): import("react").JSX.Element;
//# sourceMappingURL=pdf-viewer-sidebar.d.ts.map