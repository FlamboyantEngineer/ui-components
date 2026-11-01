import type {
  DiagramEdgeEnd,
  DiagramPoint,
  DiagramPortSide,
  DiagramRect,
  DiagramRouteOptions,
} from './edge-route.js';

/** One end of a route: its point and the outward direction of its side, null on a straight line. */
export interface Anchor {
  point: DiagramPoint;
  normal: DiagramPoint | null;
  /** How far the end slid along its side for a parallel edge. */
  slide?: number;
}

export const normals: Record<DiagramPortSide, DiagramPoint> = {
  top: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
};

/** How far a spread end stays from the corners of its box. */
const cornerInset = 4;

export const add = (a: DiagramPoint, b: DiagramPoint, scale = 1) => ({
  x: a.x + b.x * scale,
  y: a.y + b.y * scale,
});
export const subtract = (a: DiagramPoint, b: DiagramPoint) => ({ x: a.x - b.x, y: a.y - b.y });
export const length = (a: DiagramPoint) => Math.hypot(a.x, a.y);

export function normalize(vector: DiagramPoint): DiagramPoint {
  const size = length(vector);
  return size === 0 ? { x: 1, y: 0 } : { x: vector.x / size, y: vector.y / size };
}

export function center(rect: DiagramRect): DiagramPoint {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

/** The right-hand perpendicular of the direction from `from` to `to` (y grows downward). */
export function findRightHand(from: DiagramPoint, to: DiagramPoint): DiagramPoint {
  const direction = normalize(subtract(to, from));
  return { x: -direction.y, y: direction.x };
}

/**
 * Fits a parallel edge's offset within `reach` of the middle: unchanged up to half the room, then
 * easing toward the corner inset without passing it, so every offset keeps its own place and
 * spread ends stay on their box.
 */
function fitOffset(offset: number, reach: number): number {
  const knee = (reach - cornerInset) / 2;
  if (knee <= 0) return 0;
  const size = Math.abs(offset);
  if (size <= knee) return offset;
  return Math.sign(offset) * (knee + knee * Math.tanh((size - knee) / knee));
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

/** Where the ray from `origin`, inside the box, along `direction` leaves the box. */
function findExitPoint(rect: DiagramRect, origin: DiagramPoint, direction: DiagramPoint) {
  const reach = (axis: 'x' | 'y', size: number) => {
    const toward = direction[axis];
    if (toward > 0) return (rect[axis] + size - origin[axis]) / toward;
    return toward < 0 ? (rect[axis] - origin[axis]) / toward : Infinity;
  };
  const scale = Math.min(reach('x', rect.width), reach('y', rect.height));
  return Number.isFinite(scale) ? add(origin, direction, Math.max(0, scale)) : origin;
}

function resolvePortAnchor(end: DiagramEdgeEnd): Anchor | null {
  if (!end.port) return null;
  return { point: resolvePortPoint(end.rect, end.port), normal: normals[end.port.side] };
}

/**
 * The ends of a straight edge: ports, or where the line between the centres leaves each box, moved
 * to the right of travel by the fitted offset so the end stays on the box.
 */
export function resolveStraightAnchors(options: DiagramRouteOptions): [Anchor, Anchor] {
  const { source, target, offset = 0 } = options;
  const sourcePort = resolvePortAnchor(source);
  const targetPort = resolvePortAnchor(target);
  const from = sourcePort?.point ?? center(source.rect);
  const to = targetPort?.point ?? center(target.rect);
  const shift = findRightHand(from, to);
  const direction = normalize(subtract(to, from));
  const shifted = (end: DiagramEdgeEnd, outward: DiagramPoint): Anchor => {
    const { width, height } = end.rect;
    const half = (Math.abs(shift.x) * width + Math.abs(shift.y) * height) / 2;
    const origin = add(center(end.rect), shift, fitOffset(offset, half));
    return { point: findExitPoint(end.rect, origin, outward), normal: null };
  };
  return [
    sourcePort ?? shifted(source, direction),
    targetPort ?? shifted(target, { x: -direction.x, y: -direction.y }),
  ];
}

/**
 * The ends of a curved or orthogonal edge: ports, or the middles of the sides that face, slid along
 * the side to the right of travel by the fitted offset.
 */
export function resolveSideAnchors(options: DiagramRouteOptions): [Anchor, Anchor] {
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
    const isAcross = anchor.normal.x === 0;
    const along = isAcross
      ? { x: Math.sign(shift.x) || 1, y: 0 }
      : { x: 0, y: Math.sign(shift.y) || 1 };
    const reach = (isAcross ? end.rect.width : end.rect.height) / 2;
    const slide = fitOffset(offset, reach);
    return { ...anchor, point: add(anchor.point, along, slide), slide };
  };
  return [slide(from, source), slide(to, target)];
}
