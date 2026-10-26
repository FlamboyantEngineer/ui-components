// Anchor rectangles in the layer's own coordinates, measured from elements, and hit testing.
/** Where the layer's content starts in the viewport: inside its border, before its scroll. */
export function getLayerOrigin(layer) {
    const box = layer.getBoundingClientRect();
    return {
        top: box.top + layer.clientTop - layer.scrollTop,
        left: box.left + layer.clientLeft - layer.scrollLeft,
    };
}
/** The boxes of each target element inside the layer, by annotation id. */
export function measureTargets(layer, annotations) {
    const origin = getLayerOrigin(layer);
    const measured = new Map();
    for (const { id, rects, targetId } of annotations) {
        if (rects || targetId === undefined)
            continue;
        const element = layer.ownerDocument.getElementById(targetId);
        if (!element || !layer.contains(element))
            continue;
        measured.set(id, Array.from(element.getClientRects(), (box) => ({
            top: box.top - origin.top,
            left: box.left - origin.left,
            width: box.width,
            height: box.height,
        })));
    }
    return measured;
}
/** Whether two measurements hold the same rectangles for the same annotations. */
export function isSameMeasurement(a, b) {
    if (a.size !== b.size)
        return false;
    for (const [id, rects] of a) {
        const other = b.get(id);
        if (!other || other.length !== rects.length)
            return false;
        const isSame = rects.every((rect, index) => {
            const next = other[index];
            return (rect.top === next.top &&
                rect.left === next.left &&
                rect.width === next.width &&
                rect.height === next.height);
        });
        if (!isSame)
            return false;
    }
    return true;
}
/** The annotation drawn on top at a point of the layer's content (the last one listed), or null. */
export function findAnnotationAt(anchors, point) {
    const hit = anchors.findLast(({ rects }) => rects.some((rect) => point.x >= rect.left &&
        point.x <= rect.left + rect.width &&
        point.y >= rect.top &&
        point.y <= rect.top + rect.height));
    return hit ? hit.annotation.id : null;
}
//# sourceMappingURL=anchor-geometry.js.map