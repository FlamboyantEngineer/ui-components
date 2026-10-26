/** A page's frame: its bitmap starts inside the page element's border. */
export function measurePageFrame(page, scale) {
    const box = page.getBoundingClientRect();
    return { origin: { left: box.left + page.clientLeft, top: box.top + page.clientTop }, scale };
}
/**
 * A browser viewport position as a page position. Client positions already account for every
 * scrolled ancestor, so the page's own client position is all there is to subtract.
 */
export function toPagePoint(client, frame) {
    const scale = frame.scale > 0 ? frame.scale : 1;
    return {
        left: (client.left - frame.origin.left) / scale,
        top: (client.top - frame.origin.top) / scale,
    };
}
/** A browser viewport rectangle (such as a `DOMRect`) as a page rectangle. */
export function toPageRect(client, frame) {
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
export function findPageIndex(node, pages) {
    const indexes = new Map();
    for (const [pageIndex, element] of pages)
        indexes.set(element, pageIndex);
    for (let current = node; current; current = current.parentNode) {
        const pageIndex = indexes.get(current);
        if (pageIndex !== undefined)
            return pageIndex;
    }
    return -1;
}
/**
 * Locates a selected range on the page where it starts, at its first line: a selection across a
 * page break belongs to no single page, and a multi-line selection's bounding box does not start
 * where the reader started selecting.
 */
export function locateRange(range, pages, scale) {
    const pageIndex = findPageIndex(range.startContainer, pages);
    const page = pages.get(pageIndex);
    if (!page)
        return null;
    const first = range.getClientRects()[0] ?? range.getBoundingClientRect();
    return { pageIndex, rect: toPageRect(first, measurePageFrame(page, scale)) };
}
/** The last of `boxes` that contains `point`, edges included: later boxes are drawn over earlier ones. */
export function findBoxAtPoint(boxes, point) {
    for (let index = boxes.length - 1; index >= 0; index -= 1) {
        const box = boxes[index];
        if (box &&
            point.left >= box.left &&
            point.left <= box.left + box.width &&
            point.top >= box.top &&
            point.top <= box.top + box.height) {
            return box;
        }
    }
    return undefined;
}
//# sourceMappingURL=page-geometry.js.map