import { type RefObject } from 'react';
import { type PdfSize, type PdfZoom } from './pdf-zoom.js';
import type { PdfPagesController } from './use-pdf-pages.js';
export interface UsePdfZoomOptions {
    defaultZoom: PdfZoom;
    /** Page sizes in points; a fit holds for the largest. */
    sizes: readonly PdfSize[];
    scrollerRef: RefObject<HTMLElement | null>;
    /** The page column, whose padding a fit leaves free. */
    pagesRef: RefObject<HTMLElement | null>;
    pages: Pick<PdfPagesController, 'captureAnchor' | 'restoreAnchor'>;
    onZoomChange?: ((percent: number) => void) | undefined;
}
export interface PdfZoomState {
    /** The requested zoom: a percentage or a fit mode. */
    zoom: PdfZoom;
    /** The applied zoom in percent. */
    percent: number;
    /** CSS pixels per point at the applied zoom. */
    scale: number;
    setZoom(zoom: PdfZoom): void;
}
/**
 * The viewer's zoom: a percentage or a fit mode, resolved against the page column's size whenever it
 * changes, with the reader's place kept across every change.
 */
export declare function usePdfZoom(options: UsePdfZoomOptions): PdfZoomState;
//# sourceMappingURL=use-pdf-zoom.d.ts.map