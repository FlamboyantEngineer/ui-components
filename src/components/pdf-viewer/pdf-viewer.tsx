import { useRef, type ReactNode } from 'react';
import { measuredProperty } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import type { MenuEntry } from '../menu/menu.js';
import { ProjectionContent } from '../projection/projection.js';
import { pdfViewerHooks as hooks } from './styling-hooks.js';
import type { PdfPageGeometry, PdfPagePoint, PdfPageRect, PdfSelection } from './page-geometry.js';
import type { PdfEngine, PdfSource, PdfTextContent, PdfViewport } from './pdf-engine.js';
import { PdfViewerStage } from './pdf-viewer-stage.js';
import { PdfViewerToolbar } from './pdf-viewer-toolbar.js';
import type { PdfSize, PdfZoom } from './pdf-zoom.js';
import { usePdfContextMenu } from './use-pdf-context-menu.js';
import { usePdfDocument } from './use-pdf-document.js';
import { usePageViewports, usePdfNavigation } from './use-pdf-navigation.js';
import { usePdfPages } from './use-pdf-pages.js';
import { usePdfSearch, type PdfSearchControls } from './use-pdf-search.js';
import { usePdfZoom } from './use-pdf-zoom.js';

export { findBoxAtPoint } from './page-geometry.js';
export type {
  PdfPageGeometry,
  PdfPagePoint,
  PdfPageRect,
  PdfPoint,
  PdfRect,
  PdfSelection,
} from './page-geometry.js';
export type { PdfSearchControls } from './use-pdf-search.js';

export interface PdfViewerProps<
  V extends PdfViewport = PdfViewport,
  C extends PdfTextContent = PdfTextContent,
> extends BaseProps {
  /** The document's URL or bytes; `null` while the bytes are on their way. A new array is a new document. */
  source: PdfSource | null;
  /** Loads the PDF engine when a document starts loading, for example `() => import('pdfjs-dist')`. */
  loadEngine: () => Promise<PdfEngine<V, C>>;
  /** URL of the engine's worker script, set on the engine before it opens a document. */
  workerSrc?: string | undefined;
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
  /** Called when the engine or the document cannot be opened. */
  onError?: ((error: Error) => void) | undefined;
  /** The page the reader is on, zero-based: the viewer goes to it when it changes. */
  page?: number | undefined;
  /** Called with the page the reader is on, zero-based, whenever it changes. */
  onPageChange?: ((pageIndex: number) => void) | undefined;
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

const noSizes: readonly PdfSize[] = [];

/**
 * A PDF reader: pages drawn on canvas with selectable text, zoom with fit modes, page navigation,
 * find and a context menu, over a PDF engine the host injects, with caller content over the pages.
 */
export function PdfViewer<
  V extends PdfViewport = PdfViewport,
  C extends PdfTextContent = PdfTextContent,
>(props: PdfViewerProps<V, C>) {
  const { source, loadEngine, workerSrc, onError, className, id, toolbarSlot } = props;
  const strings = useUiStrings();
  const label = props['aria-label'] ?? strings.document;
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const pagesRef = useRef<HTMLDivElement | null>(null);
  const pdf = usePdfDocument({ source, loadEngine, workerSrc, onError });
  const { status, loaded } = pdf;
  const isReady = status === 'ready';
  const pageCount = loaded?.pages.length ?? 0;
  const pages = usePdfPages({ scrollerRef, document: loaded, pageCount });
  const zoom = usePdfZoom({
    defaultZoom: props.defaultZoom ?? 'page-width',
    sizes: loaded?.sizes ?? noSizes,
    scrollerRef,
    pagesRef,
    pages,
    onZoomChange: props.onZoomChange,
  });
  const { scale } = zoom;
  const search = usePdfSearch({ ...props, loaded, pages });
  usePdfNavigation({ ...props, isReady, scale, pageCount, scrollerRef, pages });
  usePageViewports({ ...props, loaded, nearPages: pages.nearPages, scale });
  const { elements } = pages;
  const menu = usePdfContextMenu({ ...props, loaded, scale, scrollerRef, elements });
  const toolbar = (
    <PdfViewerToolbar
      label={label}
      isReady={isReady}
      zoom={zoom}
      pageCount={pageCount}
      currentPage={pages.currentPage}
      onPageChange={pages.scrollToPage}
      search={search}
      actions={props.actions}
      leadingActions={props.leadingActions}
      renderSearch={props.renderSearch}
    />
  );
  return (
    <div
      {...hooks.root({
        className,
        props,
        data: { loading: status === 'loading', error: status === 'error' },
      })}
      id={id}
      aria-busy={status === 'loading' || undefined}
      style={measuredProperty('pdf-viewer-scale', String(scale))}
    >
      {toolbarSlot ? <ProjectionContent slot={toolbarSlot}>{toolbar}</ProjectionContent> : toolbar}
      <PdfViewerStage
        label={label}
        pdf={pdf}
        scale={scale}
        pages={pages}
        search={search}
        scrollerRef={scrollerRef}
        pagesRef={pagesRef}
        menu={menu}
        renderOverlay={props.renderPageOverlay}
      />
    </div>
  );
}
