import { type RefObject } from 'react';
import { type PdfLinkService, type PdfPage, type PdfRenderTask, type PdfTextContent, type PdfTextLayer, type PdfViewport } from './pdf-engine.js';
import type { LoadedPdf } from './use-pdf-document.js';
export interface UsePageRenderOptions<V extends PdfViewport = PdfViewport, C extends PdfTextContent = PdfTextContent> {
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
/**
 * Starts drawing a page bitmap into `canvas`, scaled from the viewport to the canvas's device
 * pixels, with its annotations' appearances unless the document hides them.
 */
export declare function renderPageBitmap<V extends PdfViewport, C extends PdfTextContent>({ loaded, page, viewport }: PageBitmap<V, C>, canvas: HTMLCanvasElement): PdfRenderTask;
/** Draws a page bitmap into `canvas`; returns a cancel. */
export declare function drawPage<V extends PdfViewport, C extends PdfTextContent>(bitmap: PageBitmap<V, C>, canvas: HTMLCanvasElement): () => void;
/** A page bitmap's size in device pixels, capped so a deep zoom stays within memory. */
export declare function measureCanvasPixels(width: number, height: number): CanvasPixels;
/**
 * Draws a page into its canvas and builds its text and annotation layers while the page is near
 * the view, again at every scale and rotation. Returns the text layer once it has rendered.
 */
export declare function usePageRender<V extends PdfViewport, C extends PdfTextContent>({ loaded, pageIndex, scale, isNear, canvasRef, layerRef, annotationLayerRef, linkService, }: UsePageRenderOptions<V, C>): PdfTextLayer | null;
//# sourceMappingURL=use-page-render.d.ts.map