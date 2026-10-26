import { type ReactNode } from 'react';
import type { AriaLabellingProps, SelectionProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import type { DiagramEdge, DiagramNode, DiagramViewport } from './diagram-model.js';
import { type DiagramNodeRenderState } from './diagram-node.js';
import { type DiagramView } from './diagram-toolbar.js';
import type { DiagramEdgeRouting } from './edge-route.js';
import type { DiagramConnection } from './use-diagram-connect.js';
export type { DiagramEdge, DiagramNode, DiagramPort, DiagramViewport } from './diagram-model.js';
export type { DiagramNodeRenderState } from './diagram-node.js';
export { DiagramPaletteItem, type DiagramPaletteItemProps } from './diagram-palette.js';
export type { DiagramView } from './diagram-toolbar.js';
export type { DiagramConnection } from './use-diagram-connect.js';
export { routeDiagramEdge, type DiagramEdgeEnd, type DiagramEdgeRouting, type DiagramPoint, type DiagramPortSide, type DiagramRect, type DiagramRoute, type DiagramRouteOptions, } from './edge-route.js';
/** A request for a new node from the palette: its type and where, in diagram pixels. */
export interface DiagramNodeAddRequest {
    type: string;
    x: number;
    y: number;
}
export interface DiagramCanvasProps<T = unknown> extends BaseProps, AriaLabellingProps, Pick<SelectionProps, 'selectionMode' | 'selectedKeys' | 'defaultSelectedKeys' | 'onSelectionChange'> {
    /** The nodes, in reading and Tab order. */
    nodes: readonly DiagramNode<T>[];
    /** The edges between them. */
    edges: readonly DiagramEdge[];
    /** Draws a node's content. Defaults to its label. */
    renderNode?: ((node: DiagramNode<T>, state: DiagramNodeRenderState) => ReactNode) | undefined;
    /** How edges run between nodes. Defaults to `bezier`. */
    routing?: DiagramEdgeRouting | undefined;
    /** Lets the reader move, connect, add and remove nodes. */
    isEditing?: boolean | undefined;
    /** Moved nodes snap to multiples of it, in diagram pixels; `0` turns snapping off. Defaults to 10. */
    gridSize?: number | undefined;
    /** The pan and zoom, controlled. Without it or `defaultViewport`, the view fits every node at first. */
    viewport?: DiagramViewport | undefined;
    /** The pan and zoom at first, uncontrolled. */
    defaultViewport?: DiagramViewport | undefined;
    /** Called with the pan and zoom after each change. */
    onViewportChange?: ((viewport: DiagramViewport) => void) | undefined;
    /** The view shown, controlled. */
    view?: DiagramView | undefined;
    /** The view shown at first, uncontrolled. Defaults to `canvas`. */
    defaultView?: DiagramView | undefined;
    /** Called when the reader switches between the canvas and the outline. */
    onViewChange?: ((view: DiagramView) => void) | undefined;
    /** Called with every node, moved or without the removed ones, after a move or removal. */
    onNodesChange?: ((nodes: DiagramNode<T>[]) => void) | undefined;
    /** Called with the edges left after a removal. */
    onEdgesChange?: ((edges: DiagramEdge[]) => void) | undefined;
    /** Called when the reader connects a port to a node or a port. */
    onConnect?: ((connection: DiagramConnection) => void) | undefined;
    /** Called when the reader adds a node from the palette. */
    onNodeAdd?: ((request: DiagramNodeAddRequest) => void) | undefined;
    /** The palette: `DiagramPaletteItem`s, shown beside the canvas. */
    palette?: ReactNode;
    /** Shows the overview of the whole diagram. Defaults to true. */
    showMinimap?: boolean | undefined;
}
/**
 * A pannable, zoomable diagram of nodes the caller renders, joined by edges drawn as SVG paths
 * between their ports. Nodes are named, focusable groups: the reader selects them by click,
 * Shift-click, marquee or Space, moves between connected nodes with the arrow keys and, in edit
 * mode, moves nodes by drag or arrow keys on a grid, connects ports by drag or by keyboard, adds
 * nodes from a palette and removes them. The data is the caller's: every change arrives through a
 * callback as plain data. An outline view lists the nodes and their links.
 */
export declare function DiagramCanvas<T = unknown>({ nodes, edges, renderNode, routing, isEditing, gridSize, selectionMode, selectedKeys, defaultSelectedKeys, onSelectionChange, viewport: viewportProp, defaultViewport, onViewportChange, view: viewProp, defaultView, onViewChange, onNodesChange, onEdgesChange, onConnect, onNodeAdd, palette: paletteContent, showMinimap, 'aria-label': ariaLabel, className, ...rest }: DiagramCanvasProps<T>): import("react").JSX.Element;
//# sourceMappingURL=diagram-canvas.d.ts.map