import type { PdfViewport } from './pdf-engine.js';
/** A position on a page as displayed, in points (1/72 inch) from the page's top-left corner. */
export interface PdfPoint {
    left: number;
    top: number;
}
/** A rectangle on a page as displayed, in points from the page's top-left corner. */
export interface PdfRect extends PdfPoint {
    width: number;
    height: number;
}
/** A rectangle on one page, zero-based. */
export interface PdfPageRect extends PdfRect {
    pageIndex: number;
}
/** One page as laid out at the applied zoom. */
export interface PdfPageGeometry<V extends PdfViewport = PdfViewport> {
    pageIndex: number;
    /** The engine's viewport of the page at the applied zoom: a point spans `viewport.scale` CSS pixels. */
    viewport: V;
}
/** Text the reader selected, located on the page where the selection starts. */
export interface PdfSelection<V extends PdfViewport = PdfViewport> extends PdfPageGeometry<V> {
    text: string;
    /** The selection's first line, in points. */
    rect: PdfRect;
}
/** A spot the reader pointed at on a page. */
export interface PdfPagePoint<V extends PdfViewport = PdfViewport> extends PdfPageGeometry<V> {
    point: PdfPoint;
}
/** Where a page's bitmap starts in the browser viewport, and how many CSS pixels one point spans. */
export interface PageFrame {
    origin: PdfPoint;
    scale: number;
}
/** A page's frame: its bitmap starts inside the page element's border. */
export declare function measurePageFrame(page: Element, scale: number): PageFrame;
/**
 * A browser viewport position as a page position. Client positions already account for every
 * scrolled ancestor, so the page's own client position is all there is to subtract.
 */
export declare function toPagePoint(client: PdfPoint, frame: PageFrame): PdfPoint;
/** A browser viewport rectangle (such as a `DOMRect`) as a page rectangle. */
export declare function toPageRect(client: PdfRect, frame: PageFrame): PdfRect;
/**
 * The index of the page holding `node`, by walking its ancestors against the page elements
 * themselves rather than matching a selector; -1 when the node is on no page.
 */
export declare function findPageIndex(node: Node | null, pages: ReadonlyMap<number, Element>): number;
/**
 * Locates a selected range on the page where it starts, at its first line: a selection across a
 * page break belongs to no single page, and a multi-line selection's bounding box does not start
 * where the reader started selecting.
 */
export declare function locateRange(range: Range, pages: ReadonlyMap<number, Element>, scale: number): {
    pageIndex: number;
    rect: PdfRect;
} | null;
/** The last of `boxes` that contains `point`, edges included: later boxes are drawn over earlier ones. */
export declare function findBoxAtPoint<T extends PdfRect>(boxes: readonly T[], point: PdfPoint): T | undefined;
//# sourceMappingURL=page-geometry.d.ts.map