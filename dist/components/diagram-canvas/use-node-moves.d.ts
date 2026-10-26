import type { Key } from '../../core/props.js';
import { type DiagramDirection, type DiagramEdge, type DiagramNode } from './diagram-model.js';
import type { DiagramPoint } from './edge-route.js';
export interface NodeMovesOptions {
    nodes: readonly DiagramNode[];
    edges: readonly DiagramEdge[];
    selected: ReadonlySet<Key>;
    /** Positions snap to multiples of it; `0` turns snapping off. */
    gridSize: number;
    /** The zoom in percent, to turn screen pixels into diagram pixels. */
    zoom: number;
    onNodesChange: ((nodes: DiagramNode[]) => void) | undefined;
    onEdgesChange: ((edges: DiagramEdge[]) => void) | undefined;
    /** Replaces the selection, after a removal. */
    replaceSelection: (keys: readonly Key[]) => void;
    announce: (message: string) => void;
}
export interface NodeMoves {
    /** Where the nodes being dragged would go, by id, or null while nothing is dragged. */
    preview: ReadonlyMap<Key, DiagramPoint> | null;
    /** Starts a pointer drag of `id`, carrying the selection when it holds `id`. */
    begin: (id: Key) => void;
    /** Previews the drag moved by `delta` screen pixels from where it started. */
    drag: (delta: DiagramPoint) => void;
    /** Applies the previewed drag; false when the nodes did not move. */
    end: () => boolean;
    /** Discards an unfinished pointer move. */
    cancel: () => void;
    /** Moves `id` (and the selection holding it) one grid step, or five with `large`. */
    step: (id: Key, options: {
        direction: DiagramDirection;
        large: boolean;
    }) => void;
    /** Removes `id`, or the selection when it holds `id`, with the edges that touch removed nodes. */
    remove: (id: Key) => void;
    /** Removes one edge. */
    removeEdge: (id: Key) => void;
}
/** Pointer drags, arrow-key steps and removal of nodes, applied through the change callbacks. */
export declare function useNodeMoves(options: NodeMovesOptions): NodeMoves;
//# sourceMappingURL=use-node-moves.d.ts.map