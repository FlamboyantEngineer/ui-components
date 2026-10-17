import { useCallback, useEffect, useRef } from 'react';
import { highlightTextRuns } from './highlights.js';
import { pdfViewerHooks as hooks } from './styling-hooks.js';
import type { PdfMatchRange } from './pdf-search.js';
import type { PdfTextContent, PdfTextLayer, PdfViewport } from './pdf-engine.js';
import { measureCanvasPixels, usePageRender } from './use-page-render.js';
import type { LoadedPdf } from './use-pdf-document.js';
import type { PdfPagesController } from './use-pdf-pages.js';

export interface PdfViewerPageProps<
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

/** One page: its bitmap with the selectable text layer over it, sized to the zoom. */
export function PdfViewerPage<V extends PdfViewport, C extends PdfTextContent>({
  loaded,
  pageIndex,
  scale,
  isNear,
  ranges,
  revealKey,
  pages,
}: PdfViewerPageProps<V, C>) {
  const { registerPage, revealElement } = pages;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const layerRef = useRef<HTMLDivElement | null>(null);
  const pageRef = useCallback(
    (element: HTMLDivElement | null) => registerPage(pageIndex, element),
    [pageIndex, registerPage],
  );
  const textLayer = usePageRender({ loaded, pageIndex, scale, isNear, canvasRef, layerRef });
  useMatchHighlights({ textLayer, ranges, revealKey, revealElement });
  const size = loaded.sizes[pageIndex] ?? { width: 0, height: 0 };
  const width = size.width * scale;
  const height = size.height * scale;
  const pixels = isNear ? measureCanvasPixels(width, height) : { width: 0, height: 0 };
  return (
    <div {...hooks.slot('page')} ref={pageRef} style={{ position: 'relative', width, height }}>
      <canvas
        {...hooks.slot('canvas')}
        ref={canvasRef}
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
    </div>
  );
}
