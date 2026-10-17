import { useEffect, useState, type RefObject } from 'react';
import {
  createAnnotationLayer,
  createTextLayer,
  type PdfAnnotationLayer,
  type PdfLinkService,
  type PdfPage,
  type PdfRenderTask,
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
  /** Only pages near the view render; the others release their bitmap and layers. */
  isNear: boolean;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  layerRef: RefObject<HTMLDivElement | null>;
  annotationLayerRef: RefObject<HTMLDivElement | null>;
  /** Follows the links the annotation layer draws. */
  linkService: PdfLinkService;
}

export interface CanvasPixels {
  width: number;
  height: number;
}

/** A page to draw and the viewport to draw it at. */
export interface PageBitmap<V extends PdfViewport, C extends PdfTextContent> {
  loaded: LoadedPdf<V, C>;
  page: PdfPage<V, C>;
  viewport: V;
}

interface PageDrawing<V extends PdfViewport, C extends PdfTextContent> extends PageBitmap<V, C> {
  pageIndex: number;
}

// The engine's own default ceiling for one page bitmap.
const maxCanvasPixels = 2 ** 25;

const ignore = () => undefined;

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

function isLink(annotation: unknown): boolean {
  return (
    typeof annotation === 'object' &&
    annotation !== null &&
    'subtype' in annotation &&
    annotation.subtype === 'Link'
  );
}

/**
 * Builds the page's links in `div` when it has any; returns a cancel. Other annotations show as the
 * bitmap draws them.
 */
function buildAnnotationLayer<V extends PdfViewport, C extends PdfTextContent>(
  { loaded, page, viewport }: PageDrawing<V, C>,
  div: HTMLDivElement,
  linkService: PdfLinkService,
): () => void {
  let layer: PdfAnnotationLayer<V, C> | null = null;
  let isCancelled = false;
  page
    .getAnnotations({ intent: 'display' })
    .then((annotations) => {
      const links = annotations.filter(isLink);
      if (isCancelled || links.length === 0) return undefined;
      layer = createAnnotationLayer(loaded.engine, { div, page, viewport, linkService });
      return layer.render({
        annotations: links,
        viewport,
        div,
        page,
        linkService,
        renderForms: false,
      });
    })
    .catch(ignore);
  return () => {
    isCancelled = true;
    layer?.destroy();
    div.replaceChildren();
  };
}

/**
 * Starts drawing a page bitmap into `canvas`, scaled from the viewport to the canvas's device
 * pixels, with its annotations' appearances.
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
    annotationMode: loaded.engine.AnnotationMode.ENABLE,
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

/**
 * Draws a page into its canvas and builds its text and annotation layers while the page is near
 * the view, again at every scale and rotation. Returns the text layer once it has rendered.
 */
export function usePageRender<V extends PdfViewport, C extends PdfTextContent>({
  loaded,
  pageIndex,
  scale,
  isNear,
  canvasRef,
  layerRef,
  annotationLayerRef,
  linkService,
}: UsePageRenderOptions<V, C>): PdfTextLayer | null {
  const [textLayer, setTextLayer] = useState<PdfTextLayer | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = layerRef.current;
    const annotationLayer = annotationLayerRef.current;
    const page = loaded.pages[pageIndex];
    const viewport = loaded.getViewport(pageIndex, scale);
    if (!isNear || !canvas || !container || !annotationLayer || !page || !viewport) {
      return undefined;
    }
    const drawing = { loaded, page, pageIndex, viewport };
    const cancels = [
      drawPage(drawing, canvas),
      buildTextLayer(drawing, container, setTextLayer),
      buildAnnotationLayer(drawing, annotationLayer, linkService),
    ];
    return () => {
      for (const cancel of cancels) cancel();
      setTextLayer(null);
    };
  }, [annotationLayerRef, canvasRef, isNear, layerRef, linkService, loaded, pageIndex, scale]);
  return textLayer;
}
