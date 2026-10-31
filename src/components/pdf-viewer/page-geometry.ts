import type { PdfPage, PdfViewport } from './pdf-engine.js';

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
interface PageFrame {
  origin: PdfPoint;
  scale: number;
}

/** A page's frame: its bitmap starts inside the page element's border. */
export function measurePageFrame(page: Element, scale: number): PageFrame {
  const box = page.getBoundingClientRect();
  return { origin: { left: box.left + page.clientLeft, top: box.top + page.clientTop }, scale };
}

/**
 * A browser viewport position as a page position. Client positions already account for every
 * scrolled ancestor, so the page's own client position is all there is to subtract.
 */
export function toPagePoint(client: PdfPoint, frame: PageFrame): PdfPoint {
  const scale = frame.scale > 0 ? frame.scale : 1;
  return {
    left: (client.left - frame.origin.left) / scale,
    top: (client.top - frame.origin.top) / scale,
  };
}

/** A browser viewport rectangle (such as a `DOMRect`) as a page rectangle. */
export function toPageRect(client: PdfRect, frame: PageFrame): PdfRect {
  const scale = frame.scale > 0 ? frame.scale : 1;
  return {
    ...toPagePoint(client, frame),
    width: client.width / scale,
    height: client.height / scale,
  };
}

/**
 * The index of the page holding `node`, by walking its ancestors against the page elements
 * themselves rather than matching a selector; -1 when the node is on no page.
 */
export function findPageIndex(node: Node | null, pages: ReadonlyMap<number, Element>): number {
  const indexes = new Map<Node, number>();
  for (const [pageIndex, element] of pages) indexes.set(element, pageIndex);
  for (let current = node; current; current = current.parentNode) {
    const pageIndex = indexes.get(current);
    if (pageIndex !== undefined) return pageIndex;
  }
  return -1;
}

/**
 * Locates a selected range on the page where it starts, at its first line: a selection across a
 * page break belongs to no single page, and a multi-line selection's bounding box does not start
 * where the reader started selecting.
 */
export function locateRange(
  range: Range,
  pages: ReadonlyMap<number, Element>,
  scale: number,
): { pageIndex: number; rect: PdfRect } | null {
  const pageIndex = findPageIndex(range.startContainer, pages);
  const page = pages.get(pageIndex);
  if (!page) return null;
  const first = range.getClientRects()[0] ?? range.getBoundingClientRect();
  return { pageIndex, rect: toPageRect(first, measurePageFrame(page, scale)) };
}

/** The last of `boxes` that contains `point`, edges included: later boxes are drawn over earlier ones. */
export function findBoxAtPoint<T extends PdfRect>(
  boxes: readonly T[],
  point: PdfPoint,
): T | undefined {
  for (let index = boxes.length - 1; index >= 0; index -= 1) {
    const box = boxes[index];
    if (
      box &&
      point.left >= box.left &&
      point.left <= box.left + box.width &&
      point.top >= box.top &&
      point.top <= box.top + box.height
    ) {
      return box;
    }
  }
  return undefined;
}

/** The rotation a page shows at: its own, turned further by the reader's, in degrees. */
export function toPageRotation(page: Pick<PdfPage, 'rotate'>, rotation: number): number {
  return (((page.rotate + rotation) % 360) + 360) % 360;
}
