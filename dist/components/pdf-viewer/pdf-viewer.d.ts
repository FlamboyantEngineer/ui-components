import type { ReactNode } from 'react';
import type { BaseProps } from '../../core/props.js';
import type { MenuEntry } from '../menu/menu.js';
import type { PdfPageGeometry, PdfPagePoint, PdfPageRect, PdfSelection } from './page-geometry.js';
import type { PdfDocumentOptions, PdfEngine, PdfSource, PdfTextContent, PdfViewport } from './pdf-engine.js';
import type { PdfSearchOptions } from './pdf-search.js';
import type { PdfZoom } from './pdf-zoom.js';
import type { PdfSearchControls } from './use-pdf-search.js';
export { findBoxAtPoint } from './page-geometry.js';
export type { PdfPageGeometry, PdfPagePoint, PdfPageRect, PdfPoint, PdfRect, PdfSelection, } from './page-geometry.js';
export type { PdfSearchOptions } from './pdf-search.js';
export type { PdfSearchControls } from './use-pdf-search.js';
export interface PdfViewerProps<V extends PdfViewport = PdfViewport, C extends PdfTextContent = PdfTextContent> extends BaseProps {
    /**
     * The document's URL or bytes; `null` while the bytes are on their way. A new array is a new
     * document; a URL, as text or a `URL` object, is the same document while its address is.
     */
    source: PdfSource | null;
    /** Loads the PDF engine when a document starts loading, for example `() => import('pdfjs-dist')`. */
    loadEngine: () => Promise<PdfEngine<V, C>>;
    /** URL of the engine's worker script, set on the engine before it opens a document. */
    workerSrc?: string | undefined;
    /** Options the engine opens a document with: request headers, credentials, character maps, fonts. */
    documentOptions?: PdfDocumentOptions | undefined;
    /** Names the document; the toolbar is named after it. Defaults to the provider's `document` string. */
    'aria-label'?: string | undefined;
    /** The zoom the viewer opens at. Defaults to `page-width`. */
    defaultZoom?: PdfZoom | undefined;
    /** Called with the applied zoom in percent whenever it changes. */
    onZoomChange?: ((percent: number) => void) | undefined;
    /** Controls placed at the end of the toolbar, after the viewer's own. */
    actions?: ReactNode;
    /** Controls placed at the start of the toolbar, before the viewer's own. */
    leadingActions?: ReactNode;
    /** Draws the toolbar at the `ProjectionOutlet` of this slot instead of above the pages. */
    toolbarSlot?: string | undefined;
    /** Opens the sidebar of page thumbnails and outline. */
    defaultSidebarOpen?: boolean | undefined;
    /** Draws the pages' annotations and links. Defaults to true; `false` leaves both out. */
    showAnnotations?: boolean | undefined;
    /** Called when the engine or the document cannot be opened. */
    onError?: ((error: Error) => void) | undefined;
    /** The page the reader is on, zero-based: the viewer goes to it when it changes. */
    page?: number | undefined;
    /** The page a document opens at when `page` is not set, zero-based. */
    defaultPage?: number | undefined;
    /** Called with the page the reader is on, zero-based, whenever it changes. */
    onPageChange?: ((pageIndex: number) => void) | undefined;
    /** A destination the document defines by name, gone to each time it changes. */
    destination?: string | null | undefined;
    /** A rectangle on a page, in points, brought into view each time it changes. */
    revealRect?: PdfPageRect | null | undefined;
    /** Draws content over each page that renders, positioned with the page's viewport. */
    renderPageOverlay?: ((page: PdfPageGeometry<V>) => ReactNode) | undefined;
    /** Called with the viewports of the pages that render whenever that set or the zoom changes. */
    onPageViewports?: ((viewports: ReadonlyMap<number, V>) => void) | undefined;
    /** The find query; the caller owns it when set. */
    searchQuery?: string | undefined;
    /** Called with the query typed into the find controls. */
    onSearchQueryChange?: ((query: string) => void) | undefined;
    /** How the find matches the query; the caller owns the options when set. */
    searchOptions?: PdfSearchOptions | undefined;
    /** Called with the find options chosen in the find controls. */
    onSearchOptionsChange?: ((options: PdfSearchOptions) => void) | undefined;
    /** The current match, zero-based and taken modulo the number of matches; the caller owns it when set. */
    matchIndex?: number | undefined;
    /** Called with the match a step or a new query moves to. */
    onMatchIndexChange?: ((index: number) => void) | undefined;
    /** Draws the find controls in place of the viewer's own; returning `null` draws none. */
    renderSearch?: ((search: PdfSearchControls) => ReactNode) | undefined;
    /** Context menu entries placed after Copy for a selection that starts on a page. */
    getSelectionMenuItems?: ((selection: PdfSelection<V>) => readonly MenuEntry[]) | undefined;
    /** Context menu entries for a secondary click on a page without a selection. */
    getPageMenuItems?: ((target: PdfPagePoint<V>) => readonly MenuEntry[]) | undefined;
}
/**
 * A PDF reader: pages drawn on canvas with selectable text and working links, zoom with fit modes,
 * rotation, page navigation, a sidebar of thumbnails and outline, find, printing and saving, and a
 * context menu, over a PDF engine the host injects, with caller content over the pages.
 */
export declare function PdfViewer<V extends PdfViewport = PdfViewport, C extends PdfTextContent = PdfTextContent>(props: PdfViewerProps<V, C>): import("react").JSX.Element;
//# sourceMappingURL=pdf-viewer.d.ts.map