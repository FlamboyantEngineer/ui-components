import { requireDefined } from '../../utils/require-defined.js';
import type { DiagramPoint, DiagramRect } from './edge-route.js';

/** One end of an orthogonal route: its point and the outward direction of the side it leaves. */
export interface OrthogonalEnd {
  point: DiagramPoint;
  normal: DiagramPoint;
}

/** The two endpoint boxes, which a detour goes around. */
type Boxes = readonly [DiagramRect, DiagramRect];

/**
 * The boxes to go around, and how far a parallel edge moves its free runs apart from the others
 * between the same ends.
 */
export interface OrthogonalContext {
  boxes: Boxes;
  shift: number;
}

const gap = 20;

const step = (point: DiagramPoint, normal: DiagramPoint): DiagramPoint => ({
  x: point.x + normal.x * gap,
  y: point.y + normal.y * gap,
});
const swapPoint = (point: DiagramPoint): DiagramPoint => ({ x: point.y, y: point.x });
const swapEnd = (end: OrthogonalEnd): OrthogonalEnd => ({
  point: swapPoint(end.point),
  normal: swapPoint(end.normal),
});
const swapRect = (rect: DiagramRect): DiagramRect => ({
  x: rect.y,
  y: rect.x,
  width: rect.height,
  height: rect.width,
});
const isHorizontal = (normal: DiagramPoint) => normal.y === 0;

/** Whether a horizontal or vertical segment runs through the inside of a box. */
function crossesBox(a: DiagramPoint, b: DiagramPoint, rect: DiagramRect): boolean {
  const margin = 1e-6;
  return (
    Math.min(a.x, b.x) < rect.x + rect.width - margin &&
    Math.max(a.x, b.x) > rect.x + margin &&
    Math.min(a.y, b.y) < rect.y + rect.height - margin &&
    Math.max(a.y, b.y) > rect.y + margin
  );
}

/** How many times a polyline runs through the boxes, and its length. */
function measurePolyline(points: readonly DiagramPoint[], boxes: Boxes) {
  let crossings = 0;
  let size = 0;
  for (const [index, point] of points.slice(1).entries()) {
    const before = requireDefined(points[index]);
    crossings += boxes.filter((box) => crossesBox(before, point, box)).length;
    size += Math.hypot(point.x - before.x, point.y - before.y);
  }
  return { crossings, size };
}

/**
 * Which way a parallel edge moves its free runs: its offset, signed by its direction of travel so
 * an edge and its reverse, which share an offset, move apart.
 */
function findTurn(from: OrthogonalEnd, to: OrthogonalEnd, shift: number): number {
  const delta = { x: to.point.x - from.point.x, y: to.point.y - from.point.y };
  return shift * (Math.sign(delta.x) || Math.sign(delta.y) || 1);
}

/** The ways around for ends on horizontal sides: over lanes, and past both boxes on a shared side. */
function listDetours(from: OrthogonalEnd, to: OrthogonalEnd, context: OrthogonalContext) {
  const { boxes } = context;
  const turn = findTurn(from, to, context.shift);
  const start = step(from.point, from.normal);
  const end = step(to.point, to.normal);
  const [upper, lower] = [...boxes].sort((first, second) => first.y - second.y) as [
    DiagramRect,
    DiagramRect,
  ];
  const lanes = [
    (from.point.y + to.point.y) / 2,
    (upper.y + upper.height + lower.y) / 2,
    Math.min(upper.y, lower.y) - gap,
    Math.max(upper.y + upper.height, lower.y + lower.height) + gap,
  ].map((lane) => lane + turn);
  const detours = lanes.map((y) => [start, { x: start.x, y }, { x: end.x, y }, end]);
  const side = from.normal.x;
  if (side === to.normal.x) {
    const edges = boxes.map((box) => box.x + (side > 0 ? box.width : 0));
    const x = (side > 0 ? Math.max(...edges) + gap : Math.min(...edges) - gap) + turn;
    detours.push([
      { x, y: from.point.y },
      { x, y: to.point.y },
    ]);
  }
  return detours;
}

/**
 * The corners between ends on horizontal sides: a mid run when they face each other, else a
 * detour. The detour crosses over in the middle when that clears both boxes; otherwise it takes the
 * shortest way that does. A parallel edge moves its mid run or lane by its turn; between ends in
 * line, whose mid run has no length, it jogs over to a lane its turn away.
 */
function findLevelCorners(
  from: OrthogonalEnd,
  to: OrthogonalEnd,
  context: OrthogonalContext,
): DiagramPoint[] {
  const ahead = (step(to.point, to.normal).x - step(from.point, from.normal).x) * from.normal.x;
  if (ahead >= 0 && from.normal.x !== to.normal.x) {
    const turn = findTurn(from, to, context.shift);
    if (turn !== 0 && Math.abs(from.point.y - to.point.y) < 1e-6) {
      const lane = from.point.y + turn;
      const [start, end] = [step(from.point, from.normal), step(to.point, to.normal)];
      return [start, { x: start.x, y: lane }, { x: end.x, y: lane }, end];
    }
    const middleX = (from.point.x + to.point.x) / 2 + turn;
    return [
      { x: middleX, y: from.point.y },
      { x: middleX, y: to.point.y },
    ];
  }
  const scored = listDetours(from, to, context).map((corners) => ({
    corners,
    ...measurePolyline([from.point, ...corners, to.point], context.boxes),
  }));
  const first = requireDefined(scored[0]);
  if (first.crossings === 0) return first.corners;
  return scored.reduce((chosen, option) =>
    option.crossings < chosen.crossings ||
    (option.crossings === chosen.crossings && option.size < chosen.size)
      ? option
      : chosen,
  ).corners;
}

/**
 * The single corner between ends on crossing sides, or, for a parallel edge, a notch of its turn's
 * size there: inside the corner for one sign, past it for the other.
 */
function findCrossingCorners(from: OrthogonalEnd, to: OrthogonalEnd, shift: number) {
  const a = from.normal;
  const b = to.normal;
  const turn = findTurn(from, to, shift);
  const room = Math.min(Math.abs(to.point.x - from.point.x), Math.abs(to.point.y - from.point.y));
  const size = Math.min(Math.abs(turn), room / 2);
  const toward = Math.sign(turn) * size;
  if (isHorizontal(a)) {
    const x = to.point.x + toward * a.x;
    const y = from.point.y - size * b.y;
    return [
      { x, y: from.point.y },
      { x, y },
      { x: to.point.x, y },
    ];
  }
  const y = to.point.y + toward * a.y;
  const x = from.point.x - size * b.x;
  return [
    { x: from.point.x, y },
    { x, y },
    { x, y: to.point.y },
  ];
}

/**
 * The corners of an orthogonal route between two ends that leave the sides of their boxes. Ends
 * on parallel sides meet in a mid run or detour around both boxes; ends on crossing sides turn at
 * one corner, or at three when that corner lies behind either end.
 */
export function findOrthogonalCorners(
  from: OrthogonalEnd,
  to: OrthogonalEnd,
  context: OrthogonalContext,
): DiagramPoint[] {
  const a = from.normal;
  const b = to.normal;
  if (isHorizontal(a) && isHorizontal(b)) return findLevelCorners(from, to, context);
  if (!isHorizontal(a) && !isHorizontal(b)) {
    const boxes = [swapRect(context.boxes[0]), swapRect(context.boxes[1])] as const;
    const swapped = { boxes, shift: context.shift };
    return findLevelCorners(swapEnd(from), swapEnd(to), swapped).map(swapPoint);
  }
  const corner = isHorizontal(a)
    ? { x: to.point.x, y: from.point.y }
    : { x: from.point.x, y: to.point.y };
  const fits =
    (corner.x - from.point.x) * a.x + (corner.y - from.point.y) * a.y > 0 &&
    (corner.x - to.point.x) * b.x + (corner.y - to.point.y) * b.y > 0;
  if (fits) return findCrossingCorners(from, to, context.shift);
  const start = step(from.point, a);
  const end = step(to.point, b);
  return isHorizontal(a)
    ? [start, { x: start.x, y: end.y }, end]
    : [start, { x: end.x, y: start.y }, end];
}
