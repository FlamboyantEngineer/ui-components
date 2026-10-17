import { useEffect, useState, type RefObject } from 'react';
import type { PdfTextContent, PdfTextLayer, PdfViewport } from './pdf-engine.js';
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

// The engine's own default ceiling for one page bitmap.
const maxCanvasPixels = 2 ** 25;

const ignore = () => undefined;

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
    const viewport = page.getViewport({ scale });
    const ratio = viewport.width > 0 ? canvas.width / viewport.width : 1;
    const task = page.render({
      canvas,
      viewport,
      transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0],
      annotationMode: loaded.engine.AnnotationMode.DISABLE,
    });
    task.promise.catch(ignore);
    let layer: PdfTextLayer | null = null;
    let isCancelled = false;
    loaded
      .getTextContent(pageIndex)
      .then((content) => {
        if (isCancelled) return undefined;
        const created = new loaded.engine.TextLayer({
          textContentSource: content,
          container,
          viewport,
        });
        layer = created;
        return created.render().then(() => {
          if (!isCancelled) setTextLayer(created);
        });
      })
      .catch(ignore);
    return () => {
      isCancelled = true;
      task.cancel();
      layer?.cancel();
      container.replaceChildren();
      setTextLayer(null);
    };
  }, [canvasRef, isNear, layerRef, loaded, pageIndex, scale]);
  return textLayer;
}
