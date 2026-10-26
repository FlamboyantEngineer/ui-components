const normals = {
    top: { x: 0, y: -1 },
    right: { x: 1, y: 0 },
    bottom: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
};
const arrowLength = 8;
const arrowHalfWidth = 4;
const orthogonalGap = 20;
const loopHeight = 48;
const add = (a, b, scale = 1) => ({
    x: a.x + b.x * scale,
    y: a.y + b.y * scale,
});
const subtract = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
const length = (a) => Math.hypot(a.x, a.y);
function normalize(vector) {
    const size = length(vector);
    return size === 0 ? { x: 1, y: 0 } : { x: vector.x / size, y: vector.y / size };
}
function center(rect) {
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}
function round(value) {
    return Math.round(value * 100) / 100;
}
function formatPoint(point) {
    return `${round(point.x)} ${round(point.y)}`;
}
/** The point of a port on its box. */
export function resolvePortPoint(rect, port) {
    const along = { x: rect.x + rect.width * port.position, y: rect.y + rect.height * port.position };
    if (port.side === 'top')
        return { x: along.x, y: rect.y };
    if (port.side === 'bottom')
        return { x: along.x, y: rect.y + rect.height };
    if (port.side === 'left')
        return { x: rect.x, y: along.y };
    return { x: rect.x + rect.width, y: along.y };
}
/** The side of `from` that faces `to`: on the axis with the wider gap between the boxes. */
function findFacingSide(from, to) {
    const delta = subtract(center(to), center(from));
    const horizontal = Math.abs(delta.x) - (from.width + to.width) / 2;
    const vertical = Math.abs(delta.y) - (from.height + to.height) / 2;
    if (horizontal >= vertical)
        return delta.x >= 0 ? 'right' : 'left';
    return delta.y >= 0 ? 'bottom' : 'top';
}
/** Where the ray from the box's centre toward `toward` leaves the box. */
function findBoundaryPoint(rect, toward) {
    const middle = center(rect);
    const delta = subtract(toward, middle);
    const scales = [
        delta.x === 0 ? Infinity : rect.width / 2 / Math.abs(delta.x),
        delta.y === 0 ? Infinity : rect.height / 2 / Math.abs(delta.y),
    ];
    const scale = Math.min(...scales);
    return Number.isFinite(scale) ? add(middle, delta, scale) : middle;
}
/** The right-hand perpendicular of the direction from `from` to `to` (y grows downward). */
function findRightHand(from, to) {
    const direction = normalize(subtract(to, from));
    return { x: -direction.y, y: direction.x };
}
function resolvePortAnchor(end) {
    if (!end.port)
        return null;
    return { point: resolvePortPoint(end.rect, end.port), normal: normals[end.port.side] };
}
/** The ends of a straight edge: ports, or where the line between the centres leaves each box. */
function resolveStraightAnchors(options) {
    const { source, target, offset = 0 } = options;
    const sourcePort = resolvePortAnchor(source);
    const targetPort = resolvePortAnchor(target);
    const from = sourcePort?.point ?? center(source.rect);
    const to = targetPort?.point ?? center(target.rect);
    const shift = findRightHand(from, to);
    const shifted = (end, toward) => {
        const rect = { ...end.rect, ...add(end.rect, shift, offset) };
        return { point: findBoundaryPoint(rect, add(toward, shift, offset)), normal: null };
    };
    return [sourcePort ?? shifted(source, to), targetPort ?? shifted(target, from)];
}
/** The ends of a curved or orthogonal edge: ports, or the middles of the sides that face. */
function resolveSideAnchors(options) {
    const { source, target, offset = 0 } = options;
    const side = (end, other) => {
        const facing = findFacingSide(end.rect, other.rect);
        return {
            point: resolvePortPoint(end.rect, { side: facing, position: 0.5 }),
            normal: normals[facing],
        };
    };
    const from = resolvePortAnchor(source) ?? side(source, target);
    const to = resolvePortAnchor(target) ?? side(target, source);
    const shift = findRightHand(from.point, to.point);
    const slide = (anchor, end) => {
        if (end.port || !anchor.normal || offset === 0)
            return anchor;
        const along = anchor.normal.x === 0
            ? { x: Math.sign(shift.x) || 1, y: 0 }
            : { x: 0, y: Math.sign(shift.y) || 1 };
        return { ...anchor, point: add(anchor.point, along, offset) };
    };
    return [slide(from, source), slide(to, target)];
}
function formatArrow(tip, direction) {
    const unit = normalize(direction);
    const base = add(tip, unit, -arrowLength);
    const side = { x: -unit.y, y: unit.x };
    return `M ${formatPoint(tip)} L ${formatPoint(add(base, side, arrowHalfWidth))} L ${formatPoint(add(base, side, -arrowHalfWidth))} Z`;
}
function cubicMiddle(points) {
    const [a, b, c, d] = points;
    return { x: (a.x + 3 * b.x + 3 * c.x + d.x) / 8, y: (a.y + 3 * b.y + 3 * c.y + d.y) / 8 };
}
function routeCurve(from, controls, to) {
    return {
        path: `M ${formatPoint(from)} C ${formatPoint(controls[0])} ${formatPoint(controls[1])} ${formatPoint(to)}`,
        arrow: formatArrow(to, subtract(to, controls[1])),
        label: cubicMiddle([from, ...controls, to]),
    };
}
function routeBezier([from, to]) {
    const reach = Math.max(24, length(subtract(to.point, from.point)) * 0.4);
    const fromNormal = from.normal ?? normalize(subtract(to.point, from.point));
    const toNormal = to.normal ?? normalize(subtract(from.point, to.point));
    return routeCurve(from.point, [add(from.point, fromNormal, reach), add(to.point, toNormal, reach)], to.point);
}
/** A loop from the top of a box back to it, for an edge whose ends are the same box. */
function routeLoop(rect) {
    const middle = center(rect);
    const spread = Math.min(rect.width / 4, 16);
    const from = { x: middle.x - spread, y: rect.y };
    const to = { x: middle.x + spread, y: rect.y };
    return routeCurve(from, [
        { x: middle.x - spread * 2.5, y: rect.y - loopHeight },
        { x: middle.x + spread * 2.5, y: rect.y - loopHeight },
    ], to);
}
/** The corners of an orthogonal route between two anchors that leave their sides. */
function findOrthogonalCorners(from, to) {
    const a = from.normal ?? normals.right;
    const b = to.normal ?? normals.left;
    const start = add(from.point, a, orthogonalGap);
    const end = add(to.point, b, orthogonalGap);
    const middle = { x: (from.point.x + to.point.x) / 2, y: (from.point.y + to.point.y) / 2 };
    const isHorizontal = (normal) => normal.y === 0;
    if (isHorizontal(a) && isHorizontal(b)) {
        const isAhead = (end.x - start.x) * a.x >= 0 && a.x !== b.x;
        if (isAhead)
            return [
                { x: middle.x, y: from.point.y },
                { x: middle.x, y: to.point.y },
            ];
        return [start, { x: start.x, y: middle.y }, { x: end.x, y: middle.y }, end];
    }
    if (!isHorizontal(a) && !isHorizontal(b)) {
        const isAhead = (end.y - start.y) * a.y >= 0 && a.y !== b.y;
        if (isAhead)
            return [
                { x: from.point.x, y: middle.y },
                { x: to.point.x, y: middle.y },
            ];
        return [start, { x: middle.x, y: start.y }, { x: middle.x, y: end.y }, end];
    }
    const corner = isHorizontal(a)
        ? { x: to.point.x, y: from.point.y }
        : { x: from.point.x, y: to.point.y };
    const fits = (corner.x - from.point.x) * a.x + (corner.y - from.point.y) * a.y > 0 &&
        (corner.x - to.point.x) * b.x + (corner.y - to.point.y) * b.y > 0;
    if (fits)
        return [corner];
    return isHorizontal(a)
        ? [start, { x: start.x, y: end.y }, end]
        : [start, { x: end.x, y: start.y }, end];
}
/** Drops repeated points and points in the middle of a straight run. */
function simplifyPolyline(points) {
    const distinct = points.filter((point, index) => index === 0 || length(subtract(point, points[index - 1])) > 1e-6);
    return distinct.filter((point, index) => {
        const before = distinct[index - 1];
        const after = distinct[index + 1];
        if (!before || !after)
            return true;
        const inbound = subtract(point, before);
        const outbound = subtract(after, point);
        const cross = inbound.x * outbound.y - inbound.y * outbound.x;
        const dot = inbound.x * outbound.x + inbound.y * outbound.y;
        return Math.abs(cross) > 1e-6 || dot < 0;
    });
}
/** The point halfway along a polyline. */
function findPolylineMiddle(points) {
    const segments = points.slice(1).map((point, index) => [points[index], point]);
    let remaining = segments.reduce((total, [a, b]) => total + length(subtract(b, a)), 0) / 2;
    for (const [a, b] of segments) {
        const size = length(subtract(b, a));
        if (remaining <= size && size > 0)
            return add(a, subtract(b, a), remaining / size);
        remaining -= size;
    }
    return points[0] ?? { x: 0, y: 0 };
}
function routePolyline(points) {
    const simple = simplifyPolyline(points);
    const last = simple.at(-1);
    const before = simple.at(-2) ?? simple[0];
    return {
        path: simple
            .map((point, index) => `${index === 0 ? 'M' : 'L'} ${formatPoint(point)}`)
            .join(' '),
        arrow: formatArrow(last, subtract(last, before)),
        label: findPolylineMiddle(simple),
    };
}
function isSameRect(a, b) {
    return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}
/**
 * The SVG geometry of an edge between two boxes: its path, an arrowhead at the target and the
 * middle of the path for its label. Ends with a port start at the port and leave along its side;
 * ends without one use the side that faces the other end (or, for a straight edge, the point where
 * the line between the centres crosses the box). An edge from a box to itself loops over its top.
 */
export function routeDiagramEdge(options) {
    const { source, target, routing = 'bezier' } = options;
    if (!source.port && !target.port && isSameRect(source.rect, target.rect)) {
        return routeLoop(source.rect);
    }
    if (routing === 'straight') {
        const [from, to] = resolveStraightAnchors(options);
        return routePolyline([from.point, to.point]);
    }
    const anchors = resolveSideAnchors(options);
    if (routing === 'bezier')
        return routeBezier(anchors);
    const [from, to] = anchors;
    return routePolyline([from.point, ...findOrthogonalCorners(from, to), to.point]);
}
//# sourceMappingURL=edge-route.js.map