import { type RefObject } from 'react';
import type { PdfEngine } from './pdf-engine.js';
import type { PdfZoomState } from './use-pdf-zoom.js';
export interface UsePinchZoomOptions {
    /** The engine of the open document, whose touch manager tells pinches from drags. */
    engine: Pick<PdfEngine, 'TouchManager'> | null;
    scrollerRef: RefObject<HTMLElement | null>;
    /** The page column, scaled as a whole while the fingers move. */
    pagesRef: RefObject<HTMLElement | null>;
    zoom: Pick<PdfZoomState, 'percent' | 'setZoom'>;
}
/**
 * Two fingers pinching over the pages scale the page column with them, about the point between
 * them, and the zoom they reached applies when they lift; two fingers dragging scroll the pages, and
 * one finger keeps the browser's own scrolling. The pages are drawn again only once, at the end,
 * so the element under a finger stays in place for the whole gesture.
 */
export declare function usePinchZoom({ engine, scrollerRef, pagesRef, zoom }: UsePinchZoomOptions): void;
//# sourceMappingURL=use-pinch-zoom.d.ts.map