import { type ReactNode } from 'react';
import type { PdfPageGeometry } from './page-geometry.js';
import type { PdfMatchRange } from './pdf-search.js';
import type { PdfLinkService, PdfTextContent, PdfViewport } from './pdf-engine.js';
import type { LoadedPdf } from './use-pdf-document.js';
import type { PdfPagesController } from './use-pdf-pages.js';
export interface PdfViewerPageProps<V extends PdfViewport = PdfViewport, C extends PdfTextContent = PdfTextContent> {
    loaded: LoadedPdf<V, C>;
    pageIndex: number;
    /** CSS pixels per point. */
    scale: number;
    isNear: boolean;
    ranges: readonly PdfMatchRange[];
    revealKey: number;
    pages: Pick<PdfPagesController, 'registerPage' | 'revealElement'>;
    /** Follows the page's links. */
    linkService: PdfLinkService;
    /** The caller's content over the page. */
    renderOverlay?: ((page: PdfPageGeometry<V>) => ReactNode) | undefined;
}
/**
 * One page: its bitmap with the selectable text layer and the links over it, sized to the zoom.
 */
export declare function PdfViewerPage<V extends PdfViewport, C extends PdfTextContent>({ loaded, pageIndex, scale, isNear, ranges, revealKey, pages, linkService, renderOverlay, }: PdfViewerPageProps<V, C>): import("react").JSX.Element;
//# sourceMappingURL=pdf-viewer-page.d.ts.map