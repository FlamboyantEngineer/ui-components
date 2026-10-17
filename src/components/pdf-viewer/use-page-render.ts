import { useEffect, useState, type RefObject } from 'react';
import {
  createTextLayer,
  type PdfPage,
  type PdfTextContent,
  type PdfTextLayer,
  type PdfViewport,
} from './pdf-engine.js';
import type { LoadedPdf } from './use-pdf-document.js';

export interface UsePageRenderOptions<
  V extends PdfViewport = PdfViewport,
  C extends PdfTextContent = PdfTextContent,
> {
  loaded: LoadedPdf<V, C>;
  pageIndex: number;
  /** CSS pixels per point. */
  scale: number;
  /** Only pages near the view render; the others release their bitmap and text layer. */
  isNear: boolean;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  layerRef: RefObject<HTMLDivElement | null>;
}

export interface CanvasPixels {
  width: number;
  height: number;
}

interface PageDrawing<V extends PdfViewport, C extends PdfTextContent> {
  loaded: LoadedPdf<V, C>;
  page: PdfPage<V, C>;
  pageIndex: number;
  viewport: V;
}

// The engine's own default ceiling for one page bitmap.
const maxCanvasPixels = 2 ** 25;

const ignore = () => undefined;

/** Draws the page bitmap into `canvas`, scaled from the viewport to the canvas's device pixels. */
function drawCanvas<V extends PdfViewport, C extends PdfTextContent>(
  { loaded, page, viewport }: PageDrawing<V, C>,
  canvas: HTMLCanvasElement,
): () => void {
  const ratio = viewport.width > 0 ? canvas.width / viewport.width : 1;
  const task = page.render({
    canvas,
    viewport,
    transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0],
    annotationMode: loaded.engine.AnnotationMode.DISABLE,
  });
  task.promise.catch(ignore);
  return () => task.cancel();
}

/** Builds the page's text layer in `container` and reports it once rendered; returns a cancel. */
function buildTextLayer<V extends PdfViewport, C extends PdfTextContent>(
  { loaded, pageIndex, viewport }: PageDrawing<V, C>,
  container: HTMLElement,
  onRendered: (layer: PdfTextLayer) => void,
): () => void {
  let layer: PdfTextLayer | null = null;
  let isCancelled = false;
  loaded
    .getTextContent(pageIndex)
    .then((content) => {
      if (isCancelled) return undefined;
      const created = createTextLayer(loaded.engine, {
        textContentSource: content,
        container,
        viewport,
      });
      layer = created;
      return created.render().then(() => {
        if (!isCancelled) onRendered(created);
      });
    })
    .catch(ignore);
  return () => {
    isCancelled = true;
    layer?.cancel();
    container.replaceChildren();
  };
}

/** A page bitmap's size in device pixels, capped so a deep zoom stays within memory. */
export function measureCanvasPixels(width: number, height: number): CanvasPixels {
  const area = width * height;
  const deviceRatio = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
  const ratio = area > 0 ? Math.min(deviceRatio, Math.sqrt(maxCanvasPixels / area)) : 0;
  return { width: Math.floor(width * ratio), height: Math.floor(height * ratio) };
}

/**
 * Draws a page into its canvas and builds its text layer while the page is near the view, again at
 * every scale. Returns the text layer once it has rendered. Annotations and form fields are not drawn.
 */
export function usePageRender<V extends PdfViewport, C extends PdfTextContent>({
  loaded,
  pageIndex,
  scale,
  isNear,
  canvasRef,
  layerRef,
}: UsePageRenderOptions<V, C>): PdfTextLayer | null {
  const [textLayer, setTextLayer] = useState<PdfTextLayer | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = layerRef.current;
    const page = loaded.pages[pageIndex];
    if (!isNear || !canvas || !container || !page) return undefined;
    const drawing = { loaded, page, pageIndex, viewport: page.getViewport({ scale }) };
    const cancelCanvas = drawCanvas(drawing, canvas);
    const cancelText = buildTextLayer(drawing, container, setTextLayer);
    return () => {
      cancelCanvas();
      cancelText();
      setTextLayer(null);
    };
  }, [canvasRef, isNear, layerRef, loaded, pageIndex, scale]);
  return textLayer;
}
