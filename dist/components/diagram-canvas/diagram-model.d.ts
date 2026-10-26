import type { Key } from '../../core/props.js';
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
export declare const defaultNodeWidth = 160;
export declare const defaultNodeHeight = 48;
/** The node's box, with the default size where it has none. */
export declare function resolveNodeRect(node: DiagramNode): DiagramRect;
/**
 * The smallest box around `rects`, grown by `padding` on every side, or null without boxes. One
 * pass, without spreading the rects into a call, so any number of them works.
 */
export declare function findDiagramBounds(rects: readonly DiagramRect[], padding?: number): DiagramRect | null;
/** Whether two boxes overlap. */
export declare function isRectOverlap(a: DiagramRect, b: DiagramRect): boolean;
/**
 * The viewport that shows all of `bounds` centred in a view of `size`, zoomed as far as fits
 * between `minZoom` and `maxZoom`.
 */
export declare function fitDiagramViewport(options: {
    bounds: DiagramRect;
    size: {
        width: number;
        height: number;
    };
    zoomRange: readonly [number, number];
}): DiagramViewport;
/** The viewport at `zoom` that keeps the diagram point under the screen point `at` in place. */
export declare function zoomDiagramViewport(viewport: DiagramViewport, { zoom, at }: {
    zoom: number;
    at: DiagramPoint;
}): DiagramViewport;
/** The diagram point under a screen point of the viewport element. */
export declare function toDiagramPoint(viewport: DiagramViewport, point: DiagramPoint): DiagramPoint;
/** `value` rounded to the nearest multiple of `grid`, or unchanged without a grid. */
export declare function snapToGrid(value: number, grid: number): number;
/**
 * The node connected to `id` (by an edge either way) that lies closest in `direction`: within 45°
 * of it, weighing sideways distance double. Undefined when no connected node lies that way.
 */
export declare function findConnectedNode(options: {
    id: Key;
    direction: DiagramDirection;
    nodes: readonly DiagramNode[];
    edges: readonly DiagramEdge[];
}): Key | undefined;
/**
 * Sideways offsets that keep edges between the same two nodes apart: spread evenly around the line
 * between the nodes, in each edge's own direction of travel. A lone edge gets `0`. Each edge is
 * appended to its group once, without copying the group, so large groups stay linear.
 */
export declare function spreadParallelEdges(edges: readonly DiagramEdge[]): Map<Key, number>;
//# sourceMappingURL=diagram-model.d.ts.map