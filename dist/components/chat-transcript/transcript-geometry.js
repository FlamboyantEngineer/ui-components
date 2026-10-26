/** The viewport's paddings, inside which the content starts and ends. */
export function readViewportPadding(viewport) {
    const style = viewport.ownerDocument.defaultView?.getComputedStyle(viewport);
    return {
        top: Number.parseFloat(style?.paddingTop ?? '') || 0,
        bottom: Number.parseFloat(style?.paddingBottom ?? '') || 0,
    };
}
/** How far an element's top edge sits below the top of the viewport's padding box, in pixels. */
export function readOffset(element, viewport) {
    return (element.getBoundingClientRect().top - viewport.getBoundingClientRect().top - viewport.clientTop);
}
/** How far the viewport is from its bottom, in pixels. */
export function readDistanceToBottom(viewport) {
    return viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop;
}
/** The scroll position that puts the element's top at the top of the viewport's content box. */
export function resolveTopAlignment(element, viewport) {
    return viewport.scrollTop + readOffset(element, viewport) - readViewportPadding(viewport).top;
}
/**
 * The scroll position that brings an element into view: its top at the top (`start`, and for an
 * element taller than the view), centred, or moved just far enough to show it whole (`nearest`).
 */
export function resolveReveal(element, viewport, align) {
    const padding = readViewportPadding(viewport);
    const top = readOffset(element, viewport);
    const height = element.getBoundingClientRect().height;
    const room = viewport.clientHeight - padding.top - padding.bottom;
    const start = viewport.scrollTop + top - padding.top;
    if (align === 'start' || height >= room)
        return start;
    if (align === 'center')
        return start - (room - height) / 2;
    if (top < padding.top)
        return start;
    const overflow = top + height - (viewport.clientHeight - padding.bottom);
    return overflow > 0 ? viewport.scrollTop + overflow : viewport.scrollTop;
}
/**
 * The index of the first element whose bottom edge is below the viewport's top, among elements in
 * document order, or -1. Their edges only grow down the list, so the search halves it each step.
 */
export function findFirstVisible(elements, viewport) {
    let low = 0;
    let high = elements.length;
    while (low < high) {
        const middle = (low + high) >> 1;
        const element = elements[middle];
        const bottom = readOffset(element, viewport) + element.getBoundingClientRect().height;
        if (bottom > 0)
            high = middle;
        else
            low = middle + 1;
    }
    return low < elements.length ? low : -1;
}
/** The index of the last element whose top edge is above the viewport's bottom, or -1. */
export function findLastVisible(elements, viewport) {
    let low = 0;
    let high = elements.length;
    while (low < high) {
        const middle = (low + high) >> 1;
        if (readOffset(elements[middle], viewport) < viewport.clientHeight)
            low = middle + 1;
        else
            high = middle;
    }
    return low - 1;
}
//# sourceMappingURL=transcript-geometry.js.map