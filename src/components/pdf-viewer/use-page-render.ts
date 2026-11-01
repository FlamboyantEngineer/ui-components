'use client';

import { useEffect, useState, type RefObject } from 'react';
import {
  createAnnotationLayer,
  createTextLayer,
  type PdfAnnotationLayer,
  type PdfLinkService,
  type PdfTextContent,
  type PdfTextLayer,
  type PdfViewport,
} from './pdf-engine.js';
import { drawPage, type PageBitmap } from './page-bitmap.js';
import type { LoadedPdf } from './use-pdf-document.js';

interface UsePageRenderOptions<
  V extends PdfViewport = PdfViewport,
  C extends PdfTextContent = PdfTextContent,
> {
  loaded: LoadedPdf<V, C>;
  pageIndex: number;
  /** CSS pixels per point. */
  scale: number;
  /** Only pages near the view render; the others release their bitmap and layers. */
  isNear: boolean;
  canvas: HTMLCanvasElement | null;
  layerRef: RefObject<HTMLDivElement | null>;
  annotationLayerRef: RefObject<HTMLDivElement | null>;
  /** Follows the links the annotation layer draws. */
  linkService: PdfLinkService;
}

interface PageDrawing<V extends PdfViewport, C extends PdfTextContent> extends PageBitmap<V, C> {
  pageIndex: number;
}

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
 * Draws a page into its canvas and builds its text and annotation layers while the page is near
 * the view, again at every scale and rotation. Returns the text layer once it has rendered.
 */
export function usePageRender<V extends PdfViewport, C extends PdfTextContent>({
  loaded,
  pageIndex,
  scale,
  isNear,
  canvas,
  layerRef,
  annotationLayerRef,
  linkService,
}: UsePageRenderOptions<V, C>): PdfTextLayer | null {
  const [textLayer, setTextLayer] = useState<PdfTextLayer | null>(null);
  useEffect(() => {
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
      loaded.hidesAnnotations ? null : buildAnnotationLayer(drawing, annotationLayer, linkService),
    ];
    return () => {
      for (const cancel of cancels) cancel?.();
      setTextLayer(null);
    };
  }, [annotationLayerRef, canvas, isNear, layerRef, linkService, loaded, pageIndex, scale]);
  return textLayer;
}
