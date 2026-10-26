/** A zoom in percent, or a fit mode resolved against the space the pages have. */
export type PdfZoom = number | 'page-width' | 'page-fit';
export interface PdfSize {
    width: number;
    height: number;
}
export interface ResolveZoomOptions {
    zoom: PdfZoom;
    /** The page to fit, in points. */
    page: PdfSize | null;
    /** The space the page column has, in CSS pixels. */
    available: PdfSize | null;
}
/** The zoom ladder in percent: a 25% grid from 25% to 1000%. */
export declare const pdfZoomLevels: readonly number[];
/** The zoom in percent that a requested zoom resolves to. */
export declare function resolveZoomPercent({ zoom, page, available }: ResolveZoomOptions): number;
/** CSS pixels per point at a zoom in percent. */
export declare function toCssScale(percent: number): number;
/** The widest and tallest page dimensions, so a fit holds for every page. */
export declare function findLargestPage(sizes: readonly PdfSize[]): PdfSize | null;
//# sourceMappingURL=pdf-zoom.d.ts.map