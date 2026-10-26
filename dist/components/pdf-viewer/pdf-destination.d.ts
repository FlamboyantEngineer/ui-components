import type { PdfPage, PdfTextContent, PdfViewport } from './pdf-engine.js';
import type { PdfPoint, PdfRect } from './page-geometry.js';
import { type LoadedPdf } from './use-pdf-document.js';
/** Where the reader is sent: a page, and the spot on it in points when there is one. */
export interface PdfTarget {
    pageIndex: number;
    rect: PdfRect | null;
}
/**
 * A point in a page's user space as page coordinates: points from the top-left corner of the page
 * as displayed, after its own rotation and the reader's.
 */
export declare function toDisplayedPoint(page: Pick<PdfPage, 'view' | 'rotate'>, rotation: number, point: {
    x: number;
    y: number;
}): PdfPoint;
/**
 * Where a destination (a name the document defines, or an explicit destination) sends the reader:
 * its page, and the spot the destination puts at the top of the view, or `null` when the
 * destination is unknown. A destination that names no spot lands on the page's top.
 */
export declare function resolveDestination<V extends PdfViewport, C extends PdfTextContent>(loaded: LoadedPdf<V, C>, destination: unknown): Promise<PdfTarget | null>;
//# sourceMappingURL=pdf-destination.d.ts.map