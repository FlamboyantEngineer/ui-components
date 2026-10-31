// Draws page bitmaps: on the viewer's canvases and on the canvases a print lays out.

import type { PdfPage, PdfRenderTask, PdfTextContent, PdfViewport } from './pdf-engine.js';
import type { LoadedPdf } from './use-pdf-document.js';

interface CanvasPixels {
  width: number;
  height: number;
}

/** A page to draw and the viewport to draw it at. */
export interface PageBitmap<V extends PdfViewport, C extends PdfTextContent> {
  loaded: LoadedPdf<V, C>;
  page: PdfPage<V, C>;
  viewport: V;
}

// The engine's own default ceiling for one page bitmap.
const maxCanvasPixels = 2 ** 25;

const ignore = () => undefined;

/**
 * Starts drawing a page bitmap into `canvas`, scaled from the viewport to the canvas's device
 * pixels, with its annotations' appearances unless the document hides them.
 */
export function renderPageBitmap<V extends PdfViewport, C extends PdfTextContent>(
  { loaded, page, viewport }: PageBitmap<V, C>,
  canvas: HTMLCanvasElement,
): PdfRenderTask {
  const ratio = viewport.width > 0 ? canvas.width / viewport.width : 1;
  return page.render({
    canvas,
    viewport,
    transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0],
    annotationMode: loaded.hidesAnnotations
      ? loaded.engine.AnnotationMode.DISABLE
      : loaded.engine.AnnotationMode.ENABLE,
  });
}

/** Draws a page bitmap into `canvas`; returns a cancel. */
export function drawPage<V extends PdfViewport, C extends PdfTextContent>(
  bitmap: PageBitmap<V, C>,
  canvas: HTMLCanvasElement,
): () => void {
  const task = renderPageBitmap(bitmap, canvas);
  task.promise.catch(ignore);
  return () => task.cancel();
}

/** A page bitmap's size in device pixels, capped so a deep zoom stays within memory. */
export function measureCanvasPixels(width: number, height: number): CanvasPixels {
  const area = width * height;
  const deviceRatio = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
  const ratio = area > 0 ? Math.min(deviceRatio, Math.sqrt(maxCanvasPixels / area)) : 0;
  return { width: Math.floor(width * ratio), height: Math.floor(height * ratio) };
}
