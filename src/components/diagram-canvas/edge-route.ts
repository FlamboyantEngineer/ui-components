import { isShallowEqual } from '../../utils/is-shallow-equal.js';
import { requireDefined } from '../../utils/require-defined.js';
import {
  add,
  type Anchor,
  center,
  findRightHand,
  length,
  normalize,
  normals,
  resolveSideAnchors,
  resolveStraightAnchors,
  subtract,
} from './edge-anchors.js';
import { findOrthogonalCorners } from './orthogonal-route.js';

export { resolvePortPoint } from './edge-anchors.js';
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

const arrowLength = 8;
const arrowHalfWidth = 4;
const loopHeight = 48;

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatPoint(point: DiagramPoint): string {
  return `${round(point.x)} ${round(point.y)}`;
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

/**
 * A curve out of each side. A parallel edge whose ends could not slide its whole offset, such as
 * port ends, which never move, bends through a middle point moved to the right of travel by the
 * rest, in two curves that still leave and reach each end along its side.
 */
function routeBezier([from, to]: [Anchor, Anchor], offset: number): DiagramRoute {
  const reach = Math.max(24, length(subtract(to.point, from.point)) * 0.4);
  const fromNormal = from.normal ?? normalize(subtract(to.point, from.point));
  const toNormal = to.normal ?? normalize(subtract(from.point, to.point));
  const fromControl = add(from.point, fromNormal, reach);
  const toControl = add(to.point, toNormal, reach);
  const spare = offset - ((from.slide ?? 0) + (to.slide ?? 0)) / 2;
  if (Math.abs(spare) < 0.01) return routeCurve(from.point, [fromControl, toControl], to.point);
  const direction = normalize(subtract(to.point, from.point));
  const middle = add(
    add(from.point, subtract(to.point, from.point), 0.5),
    findRightHand(from.point, to.point),
    spare,
  );
  const half = reach / 2;
  const first = routeCurve(from.point, [fromControl, add(middle, direction, -half)], middle);
  const second = routeCurve(middle, [add(middle, direction, half), toControl], to.point);
  return {
    path: `${first.path} ${second.path.replace(/^M \S+ \S+ /, '')}`,
    arrow: second.arrow,
    label: middle,
  };
}

/**
 * A loop from the top of a box back to it, for an edge whose ends are the same box. Further loops
 * on the box reach higher and wider by their offset, from the same two points.
 */
function routeLoop(rect: DiagramRect, offset: number): DiagramRoute {
  const middle = center(rect);
  const spread = Math.min(rect.width / 4, 16);
  const from = { x: middle.x - spread, y: rect.y };
  const to = { x: middle.x + spread, y: rect.y };
  const grow = Math.abs(offset);
  const width = spread * 2.5 + grow / 2;
  return routeCurve(
    from,
    [
      { x: middle.x - width, y: rect.y - loopHeight - grow },
      { x: middle.x + width, y: rect.y - loopHeight - grow },
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
 * A straight line. Between two ports, parallel edges share the only straight line there is, so
 * each keeps its label apart instead, moved to the right of travel by its offset.
 */
function routeStraight(options: DiagramRouteOptions): DiagramRoute {
  const [from, to] = resolveStraightAnchors(options);
  const route = routePolyline([from.point, to.point]);
  if (!options.source.port || !options.target.port || !options.offset) return route;
  const shift = findRightHand(from.point, to.point);
  return { ...route, label: add(route.label, shift, options.offset) };
}

/**
 * The SVG geometry of an edge between two boxes: its path, an arrowhead at the target and the
 * middle of the path for its label. Ends with a port start at the port and leave along its side;
 * ends without one use the side that faces the other end (or, for a straight edge, the point where
 * the line between the centres crosses the box). An edge from a box to itself loops over its top.
 */
export function routeDiagramEdge(options: DiagramRouteOptions): DiagramRoute {
  const { source, target, routing = 'bezier', offset = 0 } = options;
  if (!source.port && !target.port && isShallowEqual(source.rect, target.rect)) {
    return routeLoop(source.rect, offset);
  }
  if (routing === 'straight') return routeStraight(options);
  const anchors = resolveSideAnchors(options);
  if (routing === 'bezier') return routeBezier(anchors, offset);
  const [from, to] = anchors;
  return routePolyline([
    from.point,
    ...findOrthogonalCorners(
      { point: from.point, normal: from.normal ?? normals.right },
      { point: to.point, normal: to.normal ?? normals.left },
      { boxes: [source.rect, target.rect], shift: offset },
    ),
    to.point,
  ]);
}
