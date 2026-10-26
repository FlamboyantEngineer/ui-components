import type { PdfSource, PdfTextContent, PdfViewport } from './pdf-engine.js';
import type { LoadedPdf } from './use-pdf-document.js';
/**
 * Prints every page through the browser's print dialog: the pages are drawn as images into a
 * hidden frame, which is printed and removed once printing is over.
 */
export declare function printPdf<V extends PdfViewport, C extends PdfTextContent>(loaded: LoadedPdf<V, C>): Promise<void>;
/** The name a document saves under: the file name in its URL, else its label. */
export declare function toPdfFileName(source: PdfSource | null, label: string): string;
/** Saves the document's own bytes as `fileName`. */
export declare function downloadPdf<V extends PdfViewport, C extends PdfTextContent>(loaded: LoadedPdf<V, C>, fileName: string): Promise<void>;
//# sourceMappingURL=pdf-commands.d.ts.map