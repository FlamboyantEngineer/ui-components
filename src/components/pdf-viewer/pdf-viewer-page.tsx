'use client';

import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { useDevicePixelRatio } from '../../utils/use-device-pixel-ratio.js';
import { InlineError } from '../inline-error/inline-error.js';
import { highlightTextRuns } from './highlights.js';
import { capCanvasPixels } from './page-bitmap.js';
import type { PdfPageGeometry } from './page-geometry.js';
import type { PdfLinkService, PdfTextContent, PdfTextLayer, PdfViewport } from './pdf-engine.js';
import type { PdfMatchRange } from './pdf-search.js';
import { pdfViewerHooks as hooks } from './styling-hooks.js';
import { usePageRender } from './use-page-render.js';
import type { LoadedPdf } from './use-pdf-document.js';
import type { PdfPagesController } from './use-pdf-pages.js';

const noSize = { width: 0, height: 0 };

interface PdfViewerPageProps<
  V extends PdfViewport = PdfViewport,
  C extends PdfTextContent = PdfTextContent,
> {
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
  /** Called when the page's bitmap fails to draw. */
  onPageError?: ((pageIndex: number, error: Error) => void) | undefined;
}

interface UseMatchHighlightsOptions {
  textLayer: PdfTextLayer | null;
  ranges: readonly PdfMatchRange[];
  revealKey: number;
  revealElement(element: HTMLElement): void;
}

/** Marks the page's matches in its text layer and brings a newly current match into view. */
function useMatchHighlights({
  textLayer,
  ranges,
  revealKey,
  revealElement,
}: UseMatchHighlightsOptions) {
  const revealed = useRef(-1);
  useEffect(() => {
    if (!textLayer || ranges.length === 0) return undefined;
    const highlighted = highlightTextRuns({
      runs: textLayer.textDivs,
      texts: textLayer.textContentItemsStr,
      ranges,
    });
    if (highlighted.current && revealed.current !== revealKey) {
      revealed.current = revealKey;
      revealElement(highlighted.current);
    }
    return highlighted.restore;
  }, [ranges, revealElement, revealKey, textLayer]);
}

/**
 * A page's size in CSS pixels at the zoom, and its canvas's size in device pixels while it is near
 * the view, which follows the pixel ratio of the canvas's window.
 */
function usePageSize<V extends PdfViewport, C extends PdfTextContent>({
  loaded,
  pageIndex,
  scale,
  isNear,
  canvas,
}: Pick<PdfViewerPageProps<V, C>, 'loaded' | 'pageIndex' | 'scale' | 'isNear'> & {
  canvas: HTMLCanvasElement | null;
}) {
  const size = loaded.sizes[pageIndex] ?? noSize;
  const width = size.width * scale;
  const height = size.height * scale;
  const ratio = useDevicePixelRatio(canvas);
  return { width, height, pixels: isNear ? capCanvasPixels(width, height, ratio) : noSize };
}

/**
 * One page: its bitmap with the selectable text layer and the links over it, sized to the zoom.
 */
export function PdfViewerPage<V extends PdfViewport, C extends PdfTextContent>({
  loaded,
  pageIndex,
  scale,
  isNear,
  ranges,
  revealKey,
  pages,
  linkService,
  renderOverlay,
  onPageError,
}: PdfViewerPageProps<V, C>) {
  const strings = useUiStrings();
  const { registerPage, revealElement } = pages;
  // The canvas's window sets its pixel ratio, so the canvas is held in state.
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const layerRef = useRef<HTMLDivElement | null>(null);
  const annotationLayerRef = useRef<HTMLDivElement | null>(null);
  const pageRef = useCallback(
    (element: HTMLDivElement | null) => registerPage(pageIndex, element),
    [pageIndex, registerPage],
  );
  const { width, height, pixels } = usePageSize({ loaded, pageIndex, scale, isNear, canvas });
  const { textLayer, failure, retry } = usePageRender({
    loaded,
    pageIndex,
    scale,
    isNear,
    canvas,
    pixels,
    layerRef,
    annotationLayerRef,
    linkService,
    onPageError,
  });
  useMatchHighlights({ textLayer, ranges, revealKey, revealElement });
  const viewport = isNear ? loaded.getViewport(pageIndex, scale) : undefined;
  return (
    <div
      {...hooks.slot('page')}
      ref={pageRef}
      data-error={failure ? true : undefined}
      style={{ position: 'relative', width, height }}
    >
      <canvas
        {...hooks.slot('canvas')}
        ref={setCanvas}
        width={pixels.width}
        height={pixels.height}
        style={{ position: 'absolute', left: 0, top: 0, width, height }}
        aria-hidden="true"
      />
      <div
        {...hooks.slot('text-layer')}
        ref={layerRef}
        style={{ position: 'absolute', inset: 0 }}
      />
      {/* Transparent to the pointer between its links, so the text under it stays selectable. */}
      <div
        {...hooks.slot('annotation-layer')}
        ref={annotationLayerRef}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      />
      {renderOverlay && viewport ? (
        // Transparent to the pointer, so text under the caller's content can still be selected.
        <div
          {...hooks.slot('overlay')}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          {renderOverlay({ pageIndex, viewport })}
        </div>
      ) : null}
      {failure ? (
        <div {...hooks.slot('page-error')} style={{ position: 'absolute', inset: 0 }}>
          <InlineError onRetry={retry}>{strings.pageFailed(pageIndex + 1)}</InlineError>
        </div>
      ) : null}
    </div>
  );
}
