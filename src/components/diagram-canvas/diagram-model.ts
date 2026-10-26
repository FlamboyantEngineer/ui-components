import type { Key } from '../../core/props.js';
import { clamp } from '../../utils/clamp.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import type { DiagramPoint, DiagramPortSide, DiagramRect } from './edge-route.js';

/** A connection point on a node's side. */
export interface DiagramPort {
  /** Unique within its node. */
  id: string;
  side: DiagramPortSide;
  /** Names the port, after its node's label. */
  label: string;
  /** The port's place along its side, from `0` (top or left) to `1`. Defaults to `0.5`. */
  position?: number | undefined;
}

/** A node: a box at a position in diagram coordinates whose content the caller renders. */
export interface DiagramNode<T = unknown> {
  /** Unique among the nodes and edges. */
  id: Key;
  /** The left edge, in diagram pixels. */
  x: number;
  /** The top edge, in diagram pixels. */
  y: number;
  /** Defaults to 160. */
  width?: number | undefined;
  /** Defaults to 48. */
  height?: number | undefined;
  /** The node's accessible name. */
  label: string;
  /** Extra text read after the node's name, such as its status. */
  description?: string | undefined;
  /** Where edges can start and end on the node. */
  ports?: readonly DiagramPort[] | undefined;
  /** Caller data for `renderNode`. */
  data?: T | undefined;
}

/** A directed edge from one node (or one of its ports) to another. */
export interface DiagramEdge {
  /** Unique among the nodes and edges. */
  id: Key;
  source: Key;
  target: Key;
  sourcePort?: string | undefined;
  targetPort?: string | undefined;
  /** Text drawn at the middle of the edge. */
  label?: string | undefined;
}

/** The part of the diagram in view: the pan offset in screen pixels and the zoom in percent. */
export interface DiagramViewport {
  x: number;
  y: number;
  /** `100` draws one diagram pixel per screen pixel. */
  zoom: number;
}

export type DiagramDirection = 'up' | 'down' | 'left' | 'right';

export const defaultNodeWidth = 160;
export const defaultNodeHeight = 48;
const parallelSpacing = 24;

/** The node's box, with the default size where it has none. */
export function resolveNodeRect(node: DiagramNode): DiagramRect {
  return {
    x: node.x,
    y: node.y,
    width: node.width ?? defaultNodeWidth,
    height: node.height ?? defaultNodeHeight,
  };
}

/**
 * The smallest box around `rects`, grown by `padding` on every side, or null without boxes. One
 * pass, without spreading the rects into a call, so any number of them works.
 */
export function findDiagramBounds(rects: readonly DiagramRect[], padding = 0): DiagramRect | null {
  if (rects.length === 0) return null;
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const rect of rects) {
    left = Math.min(left, rect.x);
    top = Math.min(top, rect.y);
    right = Math.max(right, rect.x + rect.width);
    bottom = Math.max(bottom, rect.y + rect.height);
  }
  return {
    x: left - padding,
    y: top - padding,
    width: right - left + padding * 2,
    height: bottom - top + padding * 2,
  };
}

/** Whether two boxes overlap. */
export function isRectOverlap(a: DiagramRect, b: DiagramRect): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

/**
 * The viewport that shows all of `bounds` centred in a view of `size`, zoomed as far as fits
 * between `minZoom` and `maxZoom`.
 */
export function fitDiagramViewport(options: {
  bounds: DiagramRect;
  size: { width: number; height: number };
  zoomRange: readonly [number, number];
}): DiagramViewport {
  const { bounds, size, zoomRange } = options;
  const scale = Math.min(
    size.width / Math.max(1, bounds.width),
    size.height / Math.max(1, bounds.height),
  );
  const zoom = clamp(scale * 100, zoomRange[0], zoomRange[1]);
  const factor = zoom / 100;
  return {
    x: (size.width - bounds.width * factor) / 2 - bounds.x * factor,
    y: (size.height - bounds.height * factor) / 2 - bounds.y * factor,
    zoom,
  };
}

/** The viewport at `zoom` that keeps the diagram point under the screen point `at` in place. */
export function zoomDiagramViewport(
  viewport: DiagramViewport,
  { zoom, at }: { zoom: number; at: DiagramPoint },
): DiagramViewport {
  const ratio = zoom / viewport.zoom;
  return { x: at.x - (at.x - viewport.x) * ratio, y: at.y - (at.y - viewport.y) * ratio, zoom };
}

/** The diagram point under a screen point of the viewport element. */
export function toDiagramPoint(viewport: DiagramViewport, point: DiagramPoint): DiagramPoint {
  const factor = viewport.zoom / 100;
  return { x: (point.x - viewport.x) / factor, y: (point.y - viewport.y) / factor };
}

/** `value` rounded to the nearest multiple of `grid`, or unchanged without a grid. */
export function snapToGrid(value: number, grid: number): number {
  return grid > 0 ? Math.round(value / grid) * grid : value;
}

function centreOf(rect: DiagramRect): DiagramPoint {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

/** How far `point` lies from `origin` in `direction`, or null outside the 45° cone around it. */
function scoreDirection(origin: DiagramPoint, point: DiagramPoint, direction: DiagramDirection) {
  const isVertical = direction === 'up' || direction === 'down';
  const sign = direction === 'up' || direction === 'left' ? -1 : 1;
  const ahead = sign * (isVertical ? point.y - origin.y : point.x - origin.x);
  const aside = Math.abs(isVertical ? point.x - origin.x : point.y - origin.y);
  return ahead > 0 && ahead >= aside ? ahead + aside * 2 : null;
}

/**
 * The node connected to `id` (by an edge either way) that lies closest in `direction`: within 45°
 * of it, weighing sideways distance double. Undefined when no connected node lies that way.
 */
export function findConnectedNode(options: {
  id: Key;
  direction: DiagramDirection;
  nodes: readonly DiagramNode[];
  edges: readonly DiagramEdge[];
}): Key | undefined {
  const { id, direction, nodes, edges } = options;
  const byId = new Map(nodes.map((node) => [node.id, resolveNodeRect(node)]));
  const from = byId.get(id);
  if (!from) return undefined;
  const others = edges.flatMap((edge) => {
    if (edge.source === edge.target) return [];
    if (edge.source === id) return [edge.target];
    return edge.target === id ? [edge.source] : [];
  });
  let best: { id: Key; score: number } | undefined;
  for (const other of others) {
    const rect = byId.get(other);
    const score = rect ? scoreDirection(centreOf(from), centreOf(rect), direction) : null;
    if (score !== null && (!best || score < best.score)) best = { id: other, score };
  }
  return best?.id;
}

/**
 * Sideways offsets that keep edges between the same two nodes apart: spread evenly around the line
 * between the nodes, in each edge's own direction of travel. A lone edge gets `0`. Each edge is
 * appended to its group once, without copying the group, so large groups stay linear.
 */
export function spreadParallelEdges(edges: readonly DiagramEdge[]): Map<Key, number> {
  const groups = new Map<string, DiagramEdge[]>();
  for (const edge of edges) {
    if (edge.source === edge.target) continue;
    const ends = [toKeyIdentity(edge.source), toKeyIdentity(edge.target)].sort();
    const key = JSON.stringify(ends);
    const group = groups.get(key);
    if (group) group.push(edge);
    else groups.set(key, [edge]);
  }
  const offsets = new Map<Key, number>();
  for (const [key, group] of groups) {
    const first = (JSON.parse(key) as string[])[0];
    group.forEach((edge, index) => {
      const spread = (index - (group.length - 1) / 2) * parallelSpacing;
      offsets.set(edge.id, toKeyIdentity(edge.source) === first ? spread : -spread);
    });
  }
  return offsets;
}
