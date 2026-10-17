import { useRef, type ReactNode } from 'react';
import { measuredProperty } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { pdfViewerHooks as hooks } from './parts.js';
import type { PdfEngine, PdfSource, PdfTextContent, PdfViewport } from './pdf-engine.js';
import { PdfViewerStage } from './pdf-viewer-stage.js';
import { PdfViewerToolbar } from './pdf-viewer-toolbar.js';
import type { PdfSize, PdfZoom } from './pdf-zoom.js';
import { usePdfDocument } from './use-pdf-document.js';
import { usePdfPages } from './use-pdf-pages.js';
import { usePdfSearch } from './use-pdf-search.js';
import { usePdfZoom } from './use-pdf-zoom.js';

export interface PdfViewerProps<
  V extends PdfViewport = PdfViewport,
  C extends PdfTextContent = PdfTextContent,
> extends BaseProps {
  /** The document's URL or bytes; `null` while the bytes are on their way. A new array is a new document. */
  source: PdfSource | null;
  /**
   * Loads the PDF engine, for example `() => import('pdfjs-dist')`. Read when a document starts
   * loading; the library never imports the engine itself.
   */
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
  /** Called when the engine or the document cannot be opened. */
  onError?: ((error: Error) => void) | undefined;
}

const noSizes: readonly PdfSize[] = [];

/**
 * A PDF reader: pages drawn on canvas with selectable text, zoom with fit modes, page navigation and
 * find, over a PDF engine the host injects.
 */
export function PdfViewer<
  V extends PdfViewport = PdfViewport,
  C extends PdfTextContent = PdfTextContent,
>({
  source,
  loadEngine,
  workerSrc,
  'aria-label': ariaLabel,
  defaultZoom = 'page-width',
  onZoomChange,
  actions,
  onError,
  className,
  id,
  ...rest
}: PdfViewerProps<V, C>) {
  const strings = useUiStrings();
  const label = ariaLabel ?? strings.document;
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const pagesRef = useRef<HTMLDivElement | null>(null);
  const pdf = usePdfDocument({ source, loadEngine, workerSrc, onError });
  const { status, loaded } = pdf;
  const pageCount = loaded?.pages.length ?? 0;
  const pages = usePdfPages({ scrollerRef, document: loaded, pageCount });
  const sizes = loaded?.sizes ?? noSizes;
  const zoom = usePdfZoom({ defaultZoom, sizes, scrollerRef, pagesRef, pages, onZoomChange });
  const search = usePdfSearch({ loaded, pages });
  return (
    <div
      {...hooks.root({
        className,
        props: rest,
        data: { loading: status === 'loading', error: status === 'error' },
      })}
      id={id}
      aria-busy={status === 'loading' || undefined}
      style={measuredProperty('pdf-viewer-scale', String(zoom.scale))}
    >
      <PdfViewerToolbar
        label={label}
        isReady={status === 'ready'}
        zoom={zoom}
        pageCount={pageCount}
        currentPage={pages.currentPage}
        onPageChange={pages.scrollToPage}
        search={search}
        actions={actions}
      />
      <PdfViewerStage
        label={label}
        pdf={pdf}
        scale={zoom.scale}
        pages={pages}
        search={search}
        scrollerRef={scrollerRef}
        pagesRef={pagesRef}
      />
    </div>
  );
}
