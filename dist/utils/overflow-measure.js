// DOM measurement for `useOverflowItems`: item sizes, the room a row offers and which rendered
// element is which (specs/OVERFLOW-LIST.md).
/** Sub-pixel slack, so rounding never hides an item that fits. */
export const tolerance = 0.5;
function readPixels(value) {
    const pixels = Number.parseFloat(value ?? '');
    return Number.isFinite(pixels) ? pixels : 0;
}
function getStyle(element) {
    return element.ownerDocument.defaultView?.getComputedStyle(element);
}
/** The inline space an element's box adds around its content: margins, borders and padding. */
function measureInlineChrome(element) {
    const style = getStyle(element);
    if (!style)
        return 0;
    return [
        style.marginLeft,
        style.marginRight,
        style.borderLeftWidth,
        style.borderRightWidth,
        style.paddingLeft,
        style.paddingRight,
    ].reduce((sum, value) => sum + readPixels(value), 0);
}
/** An element's border-box width plus its inline margins. */
function measureOuterSize(element) {
    const style = getStyle(element);
    const margins = style ? readPixels(style.marginLeft) + readPixels(style.marginRight) : 0;
    return element.getBoundingClientRect().width + margins;
}
/** The container's content box. */
export function measureContentBox(container) {
    const style = getStyle(container);
    const inline = style ? readPixels(style.paddingLeft) + readPixels(style.paddingRight) : 0;
    const block = style ? readPixels(style.paddingTop) + readPixels(style.paddingBottom) : 0;
    return {
        width: Math.max(0, container.clientWidth - inline),
        height: Math.max(0, container.clientHeight - block),
    };
}
/** The room of a flat row, or of a nested item container beside the indicator and fixed parts. */
function measureRoom(container, itemContainer, fixed) {
    const { width, height } = measureContentBox(container);
    const outerGap = readPixels(getStyle(container)?.columnGap);
    if (!itemContainer) {
        return { width, height, available: width, gap: outerGap, indicatorGap: outerGap };
    }
    const fixedSize = fixed.reduce((sum, part) => sum + measureOuterSize(part) + outerGap, 0);
    return {
        width,
        height,
        available: Math.max(0, width - fixedSize - measureInlineChrome(itemContainer)),
        gap: readPixels(getStyle(itemContainer)?.columnGap),
        indicatorGap: outerGap,
    };
}
/** The marked indicator among `children`, or else the fallback while an indicator is rendered. */
function findIndicator(children, layout, fallback) {
    if (layout.indicator && children.includes(layout.indicator))
        return layout.indicator;
    return layout.hasIndicator ? (fallback ?? null) : null;
}
/**
 * The items, indicator and fixed parts this commit rendered. A flat row's element children are the
 * items and the indicator (the marked element, or else the child at the collapsing end). With a
 * nested item container, its element children are the items, the indicator is the marked element
 * or else the item container's neighbour at the collapsing end, and the container's other element
 * children are fixed parts.
 */
function readParts(container, itemContainer, layout) {
    const children = Array.from(container.children);
    const fromStart = layout.collapseFrom === 'start';
    if (itemContainer && itemContainer.parentElement === container) {
        const at = children.indexOf(itemContainer);
        const indicator = findIndicator(children, layout, children[fromStart ? at - 1 : at + 1]);
        return {
            items: Array.from(itemContainer.children),
            indicator,
            fixed: children.filter((child) => child !== itemContainer && child !== indicator),
        };
    }
    const indicator = findIndicator(children, layout, fromStart ? children[0] : children.at(-1));
    return { items: children.filter((child) => child !== indicator), indicator, fixed: [] };
}
/**
 * How many items fit in a row of `available` pixels: all of them when they fit together, otherwise
 * as many as fit from the kept end beside the indicator.
 */
export function resolveOverflowCount(input) {
    const { sizes, available, gap, indicatorSize } = input;
    const total = sizes.reduce((sum, size) => sum + size, 0) + gap * Math.max(0, sizes.length - 1);
    if (total <= available + tolerance)
        return sizes.length;
    const ordered = input.collapseFrom === 'start' ? [...sizes].reverse() : sizes;
    const room = available - indicatorSize - gap + tolerance;
    let used = 0;
    let count = 0;
    for (const size of ordered) {
        used += size + (count > 0 ? gap : 0);
        if (used > room)
            break;
        count += 1;
    }
    return count;
}
function recordSize(measured, element) {
    measured.observed.set(element, element.getBoundingClientRect().width);
    return measureOuterSize(element);
}
/** Measures what this commit rendered and returns the visible count it leads to. */
export function measureCommit(input) {
    const { element, itemContainer, measured, rendered, collapseFrom } = input;
    const parts = readParts(element, itemContainer, {
        hasIndicator: rendered.hiddenItems.length > 0,
        indicator: input.indicator,
        collapseFrom,
    });
    if (parts.items.length !== rendered.visibleItems.length)
        return null;
    if (input.isStale)
        measured.sizes = input.items.map(() => 0);
    for (const [index, child] of parts.items.entries()) {
        measured.sizes[rendered.visibleIndices[index] ?? index] = recordSize(measured, child);
    }
    for (const part of parts.fixed)
        recordSize(measured, part);
    const room = measureRoom(element, itemContainer, parts.fixed);
    if (parts.indicator) {
        measured.indicatorSize = recordSize(measured, parts.indicator) + room.indicatorGap - room.gap;
    }
    measured.room = { width: room.width, height: room.height };
    return resolveOverflowCount({
        sizes: input.order.map((index) => measured.sizes[index] ?? 0),
        available: room.available,
        gap: room.gap,
        indicatorSize: measured.indicatorSize,
    });
}
//# sourceMappingURL=overflow-measure.js.map