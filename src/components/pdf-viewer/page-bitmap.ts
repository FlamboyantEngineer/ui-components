// Draws page bitmaps: on the viewer's canvases and on the canvases a print lays out.

import { getOwnerWindow } from '../../utils/owner-window.js';
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

/**
 * Draws a page bitmap into `canvas`; returns a cancel. A drawing that fails before it is cancelled
 * calls `onFailure`; the rejection that a cancel causes does not.
 */
export function drawPage<V extends PdfViewport, C extends PdfTextContent>(
  bitmap: PageBitmap<V, C>,
  canvas: HTMLCanvasElement,
  onFailure: (error: Error) => void = ignore,
): () => void {
  const task = renderPageBitmap(bitmap, canvas);
  let isCancelled = false;
  task.promise.catch((cause: unknown) => {
    if (!isCancelled) onFailure(cause instanceof Error ? cause : new Error(String(cause)));
  });
  return () => {
    isCancelled = true;
    task.cancel();
  };
}

/**
 * A page bitmap's size in device pixels, at the pixel ratio of the window `node` is in (1 before
 * there is a node), capped so a deep zoom stays within memory.
 */
export function measureCanvasPixels(
  width: number,
  height: number,
  node: Node | null,
): CanvasPixels {
  const deviceRatio = node ? getOwnerWindow(node).devicePixelRatio || 1 : 1;
  return capCanvasPixels(width, height, deviceRatio);
}

/**
 * A bitmap's size in pixels for a `width` by `height` area drawn at `ratio` pixels per unit, scaled
 * down so it holds at most the engine's ceiling of pixels.
 */
export function capCanvasPixels(width: number, height: number, ratio = 1): CanvasPixels {
  const area = width * height;
  const scale = area > 0 ? Math.min(ratio, Math.sqrt(maxCanvasPixels / area)) : 0;
  return { width: Math.floor(width * scale), height: Math.floor(height * scale) };
}
