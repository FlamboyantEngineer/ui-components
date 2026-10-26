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
    port?: {
        side: DiagramPortSide;
        position: number;
    } | undefined;
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
/** The point of a port on its box. */
export declare function resolvePortPoint(rect: DiagramRect, port: {
    side: DiagramPortSide;
    position: number;
}): DiagramPoint;
/**
 * The SVG geometry of an edge between two boxes: its path, an arrowhead at the target and the
 * middle of the path for its label. Ends with a port start at the port and leave along its side;
 * ends without one use the side that faces the other end (or, for a straight edge, the point where
 * the line between the centres crosses the box). An edge from a box to itself loops over its top.
 */
export declare function routeDiagramEdge(options: DiagramRouteOptions): DiagramRoute;
//# sourceMappingURL=edge-route.d.ts.map