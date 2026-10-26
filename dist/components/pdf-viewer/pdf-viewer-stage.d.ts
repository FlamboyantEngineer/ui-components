import type { KeyboardEvent, MouseEvent, ReactNode, RefObject } from 'react';
import { type ContextMenuProps } from '../context-menu/context-menu.js';
import type { PdfLinkService, PdfTextContent, PdfViewport } from './pdf-engine.js';
import type { PdfPageGeometry } from './page-geometry.js';
import type { LoadedPdf, PdfDocumentResult } from './use-pdf-document.js';
import type { PdfPagesController } from './use-pdf-pages.js';
import type { PdfSearchState } from './use-pdf-search.js';
export interface PdfViewerStageProps<V extends PdfViewport = PdfViewport, C extends PdfTextContent = PdfTextContent> {
    label: string;
    pdf: Omit<PdfDocumentResult<V, C>, 'loaded'>;
    /** The open document as the reader turned it. */
    view: LoadedPdf<V, C> | null;
    scale: number;
    pages: PdfPagesController;
    search: Pick<PdfSearchState, 'rangesByPage' | 'revealKey'>;
    scrollerRef: RefObject<HTMLDivElement | null>;
    pagesRef: RefObject<HTMLDivElement | null>;
    menu: {
        controller: ContextMenuProps['controller'];
        onContextMenu(event: MouseEvent<HTMLElement>): void;
    };
    links: {
        linkService: PdfLinkService;
        followDestination(destination: unknown): void;
    };
    isSidebarOpen: boolean;
    onKeyDown(event: KeyboardEvent<HTMLElement>): void;
    onScrollerKeyDown(event: KeyboardEvent<HTMLElement>): void;
    renderOverlay?: ((page: PdfPageGeometry<V>) => ReactNode) | undefined;
}
/**
 * The scrolling page column, with the sidebar beside it while open, covered by the loading overlay
 * or replaced by the error or the password prompt.
 */
export declare function PdfViewerStage<V extends PdfViewport, C extends PdfTextContent>({ label, pdf, view, scale, pages, search, scrollerRef, pagesRef, menu, links, isSidebarOpen, onKeyDown, onScrollerKeyDown, renderOverlay, }: PdfViewerStageProps<V, C>): import("react").JSX.Element;
//# sourceMappingURL=pdf-viewer-stage.d.ts.map