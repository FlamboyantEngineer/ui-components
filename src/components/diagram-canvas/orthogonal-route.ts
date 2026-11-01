import { requireDefined } from '../../utils/require-defined.js';
import type { DiagramPoint, DiagramRect } from './edge-route.js';

/** One end of an orthogonal route: its point and the outward direction of the side it leaves. */
export interface OrthogonalEnd {
  point: DiagramPoint;
  normal: DiagramPoint;
}

/** The two endpoint boxes, which a detour goes around. */
type Boxes = readonly [DiagramRect, DiagramRect];

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

/** The ways around for ends on horizontal sides: over lanes, and past both boxes on a shared side. */
function listDetours(from: OrthogonalEnd, to: OrthogonalEnd, boxes: Boxes): DiagramPoint[][] {
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
  ];
  const detours = lanes.map((y) => [start, { x: start.x, y }, { x: end.x, y }, end]);
  const side = from.normal.x;
  if (side === to.normal.x) {
    const edges = boxes.map((box) => box.x + (side > 0 ? box.width : 0));
    const x = side > 0 ? Math.max(...edges) + gap : Math.min(...edges) - gap;
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
 * shortest way that does.
 */
function findLevelCorners(from: OrthogonalEnd, to: OrthogonalEnd, boxes: Boxes): DiagramPoint[] {
  const ahead = (step(to.point, to.normal).x - step(from.point, from.normal).x) * from.normal.x;
  if (ahead >= 0 && from.normal.x !== to.normal.x) {
    const middleX = (from.point.x + to.point.x) / 2;
    return [
      { x: middleX, y: from.point.y },
      { x: middleX, y: to.point.y },
    ];
  }
  const scored = listDetours(from, to, boxes).map((corners) => ({
    corners,
    ...measurePolyline([from.point, ...corners, to.point], boxes),
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
 * The corners of an orthogonal route between two ends that leave the sides of their boxes. Ends
 * on parallel sides meet in a mid run or detour around both boxes; ends on crossing sides turn at
 * one corner, or at three when that corner lies behind either end.
 */
export function findOrthogonalCorners(
  from: OrthogonalEnd,
  to: OrthogonalEnd,
  boxes: Boxes,
): DiagramPoint[] {
  const a = from.normal;
  const b = to.normal;
  if (isHorizontal(a) && isHorizontal(b)) return findLevelCorners(from, to, boxes);
  if (!isHorizontal(a) && !isHorizontal(b)) {
    const swapped = [swapRect(boxes[0]), swapRect(boxes[1])] as const;
    return findLevelCorners(swapEnd(from), swapEnd(to), swapped).map(swapPoint);
  }
  const start = step(from.point, a);
  const end = step(to.point, b);
  const corner = isHorizontal(a)
    ? { x: to.point.x, y: from.point.y }
    : { x: from.point.x, y: to.point.y };
  const fits =
    (corner.x - from.point.x) * a.x + (corner.y - from.point.y) * a.y > 0 &&
    (corner.x - to.point.x) * b.x + (corner.y - to.point.y) * b.y > 0;
  if (fits) return [corner];
  return isHorizontal(a)
    ? [start, { x: start.x, y: end.y }, end]
    : [start, { x: end.x, y: start.y }, end];
}
