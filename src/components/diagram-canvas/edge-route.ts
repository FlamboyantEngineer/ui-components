import { requireDefined } from '../../utils/require-defined.js';
import { isShallowEqual } from '../../utils/is-shallow-equal.js';
import { findOrthogonalCorners } from './orthogonal-route.js';
/** How an edge runs between its ends: a straight line, horizontal and vertical runs, or a curve. */
export type DiagramEdgeRouting = 'straight' | 'orthogonal' | 'bezier';

/** The side of a node a port sits on. */
export type DiagramPortSide = 'top' | 'right' | 'bottom' | 'left';

export interface DiagramPoint {
  x: number;
  y: number;
}

/** A box in diagram coordinates: its top left corner and its size. */
export interface DiagramRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** One end of an edge: the box it leaves or reaches, and the port it uses on that box, if any. */
export interface DiagramEdgeEnd {
  rect: DiagramRect;
  /** The port's side and its place along the side, from `0` (top or left) to `1`. */
  port?: { side: DiagramPortSide; position: number } | undefined;
}

export interface DiagramRouteOptions {
  source: DiagramEdgeEnd;
  target: DiagramEdgeEnd;
  /** Defaults to `bezier`. */
  routing?: DiagramEdgeRouting | undefined;
  /**
   * Shifts the ends without a port sideways, to the right of the direction of travel, in pixels,
   * so edges between the same two nodes stay apart.
   */
  offset?: number | undefined;
}

/** An edge's geometry, ready for SVG. */
export interface DiagramRoute {
  /** The path data of the edge. */
  path: string;
  /** The path data of a closed arrowhead whose tip is the target end. */
  arrow: string;
  /** Where the edge's label goes: the middle of the path. */
  label: DiagramPoint;
}

interface Anchor {
  point: DiagramPoint;
  /** The outward direction of the side the end leaves from, or null for a point on a straight line. */
  normal: DiagramPoint | null;
}

const normals: Record<DiagramPortSide, DiagramPoint> = {
  top: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
};

const arrowLength = 8;
const arrowHalfWidth = 4;
const loopHeight = 48;

const add = (a: DiagramPoint, b: DiagramPoint, scale = 1) => ({
  x: a.x + b.x * scale,
  y: a.y + b.y * scale,
});
const subtract = (a: DiagramPoint, b: DiagramPoint) => ({ x: a.x - b.x, y: a.y - b.y });
const length = (a: DiagramPoint) => Math.hypot(a.x, a.y);

function normalize(vector: DiagramPoint): DiagramPoint {
  const size = length(vector);
  return size === 0 ? { x: 1, y: 0 } : { x: vector.x / size, y: vector.y / size };
}

function center(rect: DiagramRect): DiagramPoint {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatPoint(point: DiagramPoint): string {
  return `${round(point.x)} ${round(point.y)}`;
}

/** The point of a port on its box. */
export function resolvePortPoint(
  rect: DiagramRect,
  port: { side: DiagramPortSide; position: number },
): DiagramPoint {
  const along = { x: rect.x + rect.width * port.position, y: rect.y + rect.height * port.position };
  if (port.side === 'top') return { x: along.x, y: rect.y };
  if (port.side === 'bottom') return { x: along.x, y: rect.y + rect.height };
  if (port.side === 'left') return { x: rect.x, y: along.y };
  return { x: rect.x + rect.width, y: along.y };
}

/** The side of `from` that faces `to`: on the axis with the wider gap between the boxes. */
function findFacingSide(from: DiagramRect, to: DiagramRect): DiagramPortSide {
  const delta = subtract(center(to), center(from));
  const horizontal = Math.abs(delta.x) - (from.width + to.width) / 2;
  const vertical = Math.abs(delta.y) - (from.height + to.height) / 2;
  if (horizontal >= vertical) return delta.x >= 0 ? 'right' : 'left';
  return delta.y >= 0 ? 'bottom' : 'top';
}

/** Where the ray from the box's centre toward `toward` leaves the box. */
function findBoundaryPoint(rect: DiagramRect, toward: DiagramPoint): DiagramPoint {
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
function findRightHand(from: DiagramPoint, to: DiagramPoint): DiagramPoint {
  const direction = normalize(subtract(to, from));
  return { x: -direction.y, y: direction.x };
}

function resolvePortAnchor(end: DiagramEdgeEnd): Anchor | null {
  if (!end.port) return null;
  return { point: resolvePortPoint(end.rect, end.port), normal: normals[end.port.side] };
}

/** The ends of a straight edge: ports, or where the line between the centres leaves each box. */
function resolveStraightAnchors(options: DiagramRouteOptions): [Anchor, Anchor] {
  const { source, target, offset = 0 } = options;
  const sourcePort = resolvePortAnchor(source);
  const targetPort = resolvePortAnchor(target);
  const from = sourcePort?.point ?? center(source.rect);
  const to = targetPort?.point ?? center(target.rect);
  const shift = findRightHand(from, to);
  const shifted = (end: DiagramEdgeEnd, toward: DiagramPoint): Anchor => {
    const rect = { ...end.rect, ...add(end.rect, shift, offset) };
    return { point: findBoundaryPoint(rect, add(toward, shift, offset)), normal: null };
  };
  return [sourcePort ?? shifted(source, to), targetPort ?? shifted(target, from)];
}

/** The ends of a curved or orthogonal edge: ports, or the middles of the sides that face. */
function resolveSideAnchors(options: DiagramRouteOptions): [Anchor, Anchor] {
  const { source, target, offset = 0 } = options;
  const side = (end: DiagramEdgeEnd, other: DiagramEdgeEnd): Anchor => {
    const facing = findFacingSide(end.rect, other.rect);
    return {
      point: resolvePortPoint(end.rect, { side: facing, position: 0.5 }),
      normal: normals[facing],
    };
  };
  const from = resolvePortAnchor(source) ?? side(source, target);
  const to = resolvePortAnchor(target) ?? side(target, source);
  const shift = findRightHand(from.point, to.point);
  const slide = (anchor: Anchor, end: DiagramEdgeEnd): Anchor => {
    if (end.port || !anchor.normal || offset === 0) return anchor;
    const along =
      anchor.normal.x === 0
        ? { x: Math.sign(shift.x) || 1, y: 0 }
        : { x: 0, y: Math.sign(shift.y) || 1 };
    return { ...anchor, point: add(anchor.point, along, offset) };
  };
  return [slide(from, source), slide(to, target)];
}

function formatArrow(tip: DiagramPoint, direction: DiagramPoint): string {
  const unit = normalize(direction);
  const base = add(tip, unit, -arrowLength);
  const side = { x: -unit.y, y: unit.x };
  return `M ${formatPoint(tip)} L ${formatPoint(add(base, side, arrowHalfWidth))} L ${formatPoint(add(base, side, -arrowHalfWidth))} Z`;
}

function cubicMiddle(points: readonly DiagramPoint[]): DiagramPoint {
  const [a, b, c, d] = points as [DiagramPoint, DiagramPoint, DiagramPoint, DiagramPoint];
  return { x: (a.x + 3 * b.x + 3 * c.x + d.x) / 8, y: (a.y + 3 * b.y + 3 * c.y + d.y) / 8 };
}

function routeCurve(from: DiagramPoint, controls: [DiagramPoint, DiagramPoint], to: DiagramPoint) {
  return {
    path: `M ${formatPoint(from)} C ${formatPoint(controls[0])} ${formatPoint(controls[1])} ${formatPoint(to)}`,
    arrow: formatArrow(to, subtract(to, controls[1])),
    label: cubicMiddle([from, ...controls, to]),
  };
}

function routeBezier([from, to]: [Anchor, Anchor]): DiagramRoute {
  const reach = Math.max(24, length(subtract(to.point, from.point)) * 0.4);
  const fromNormal = from.normal ?? normalize(subtract(to.point, from.point));
  const toNormal = to.normal ?? normalize(subtract(from.point, to.point));
  return routeCurve(
    from.point,
    [add(from.point, fromNormal, reach), add(to.point, toNormal, reach)],
    to.point,
  );
}

/** A loop from the top of a box back to it, for an edge whose ends are the same box. */
function routeLoop(rect: DiagramRect): DiagramRoute {
  const middle = center(rect);
  const spread = Math.min(rect.width / 4, 16);
  const from = { x: middle.x - spread, y: rect.y };
  const to = { x: middle.x + spread, y: rect.y };
  return routeCurve(
    from,
    [
      { x: middle.x - spread * 2.5, y: rect.y - loopHeight },
      { x: middle.x + spread * 2.5, y: rect.y - loopHeight },
    ],
    to,
  );
}

/** Drops repeated points and points in the middle of a straight run. */
function simplifyPolyline(points: readonly DiagramPoint[]): DiagramPoint[] {
  const distinct = points.filter(
    (point, index) =>
      index === 0 || length(subtract(point, requireDefined(points[index - 1]))) > 1e-6,
  );
  return distinct.filter((point, index) => {
    const before = distinct[index - 1];
    const after = distinct[index + 1];
    if (!before || !after) return true;
    const inbound = subtract(point, before);
    const outbound = subtract(after, point);
    const cross = inbound.x * outbound.y - inbound.y * outbound.x;
    const dot = inbound.x * outbound.x + inbound.y * outbound.y;
    return Math.abs(cross) > 1e-6 || dot < 0;
  });
}

/** The point halfway along a polyline. */
function findPolylineMiddle(points: readonly DiagramPoint[]): DiagramPoint {
  const segments = points
    .slice(1)
    .map((point, index) => [requireDefined(points[index]), point] as const);
  let remaining = segments.reduce((total, [a, b]) => total + length(subtract(b, a)), 0) / 2;
  for (const [a, b] of segments) {
    const size = length(subtract(b, a));
    if (remaining <= size && size > 0) return add(a, subtract(b, a), remaining / size);
    remaining -= size;
  }
  return points[0] ?? { x: 0, y: 0 };
}

function routePolyline(points: readonly DiagramPoint[]): DiagramRoute {
  const simple = simplifyPolyline(points);
  const last = requireDefined(simple.at(-1));
  const before = simple.at(-2) ?? requireDefined(simple[0]);
  return {
    path: simple
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${formatPoint(point)}`)
      .join(' '),
    arrow: formatArrow(last, subtract(last, before)),
    label: findPolylineMiddle(simple),
  };
}

/**
 * The SVG geometry of an edge between two boxes: its path, an arrowhead at the target and the
 * middle of the path for its label. Ends with a port start at the port and leave along its side;
 * ends without one use the side that faces the other end (or, for a straight edge, the point where
 * the line between the centres crosses the box). An edge from a box to itself loops over its top.
 */
export function routeDiagramEdge(options: DiagramRouteOptions): DiagramRoute {
  const { source, target, routing = 'bezier' } = options;
  if (!source.port && !target.port && isShallowEqual(source.rect, target.rect)) {
    return routeLoop(source.rect);
  }
  if (routing === 'straight') {
    const [from, to] = resolveStraightAnchors(options);
    return routePolyline([from.point, to.point]);
  }
  const anchors = resolveSideAnchors(options);
  if (routing === 'bezier') return routeBezier(anchors);
  const [from, to] = anchors;
  return routePolyline([
    from.point,
    ...findOrthogonalCorners(
      { point: from.point, normal: from.normal ?? normals.right },
      { point: to.point, normal: to.normal ?? normals.left },
      [source.rect, target.rect],
    ),
    to.point,
  ]);
}
