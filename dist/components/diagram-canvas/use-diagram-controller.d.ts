import { type RefCallback } from 'react';
import type { Key, Selection, SelectionMode } from '../../core/props.js';
import { type DiagramLinks } from './diagram-links.js';
import { type DiagramEdge, type DiagramNode, type DiagramViewport } from './diagram-model.js';
import type { DiagramPoint } from './edge-route.js';
import { type DiagramConnect, type DiagramConnection } from './use-diagram-connect.js';
import { type DiagramSelection } from './use-diagram-selection.js';
import { type DiagramViewportState } from './use-diagram-viewport.js';
import { type NodeMoves } from './use-node-moves.js';
/** A node, or one of its ports, under the pointer. */
export interface DiagramTarget {
    node: Key;
    port?: string | undefined;
}
export interface DiagramControllerOptions {
    nodes: readonly DiagramNode[];
    edges: readonly DiagramEdge[];
    isEditing: boolean;
    gridSize: number;
    selectionMode: SelectionMode;
    selectedKeys: Iterable<Key> | 'all' | undefined;
    defaultSelectedKeys: Iterable<Key> | 'all' | undefined;
    onSelectionChange: ((keys: Selection) => void) | undefined;
    viewport: DiagramViewport | undefined;
    defaultViewport: DiagramViewport | undefined;
    onViewportChange: ((viewport: DiagramViewport) => void) | undefined;
    onNodesChange: ((nodes: DiagramNode[]) => void) | undefined;
    onEdgesChange: ((edges: DiagramEdge[]) => void) | undefined;
    onConnect: ((connection: DiagramConnection) => void) | undefined;
}
/** What the parts of a canvas share: the data, its interaction state and element lookups. */
export interface DiagramController {
    /** The nodes with any dragged positions applied. */
    nodes: readonly DiagramNode[];
    edges: readonly DiagramEdge[];
    links: ReadonlyMap<Key, DiagramLinks>;
    isEditing: boolean;
    selection: DiagramSelection;
    moves: NodeMoves;
    connect: DiagramConnect;
    view: DiagramViewportState;
    viewportElement: HTMLElement | null;
    setViewportElement: (element: HTMLElement | null) => void;
    /** The ref callback that registers a node's element, or a port's, as a connection target. */
    registerTarget: (target: DiagramTarget) => RefCallback<HTMLElement>;
    focusNode: (id: Key) => void;
    /** The node or port at a screen point. */
    findTarget: (clientX: number, clientY: number) => DiagramTarget | null;
    /** The diagram point at a screen point. */
    toDiagram: (clientX: number, clientY: number) => DiagramPoint;
    /** The latest announcement; `id` changes with each one, so the same text is read again. */
    message: DiagramMessage;
    announce: (message: string) => void;
}
export interface DiagramMessage {
    text: string;
    id: number;
}
/** The state and services of one diagram canvas. */
export declare function useDiagramController(options: DiagramControllerOptions): DiagramController;
//# sourceMappingURL=use-diagram-controller.d.ts.map