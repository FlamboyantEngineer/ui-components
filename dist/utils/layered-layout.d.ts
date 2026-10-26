import type { Key, Orientation } from '../core/props.js';
export interface LayeredLayoutNode {
    id: Key;
    width: number;
    height: number;
}
export interface LayeredLayoutEdge {
    source: Key;
    target: Key;
}
export interface LayeredLayoutOptions {
    /** The nodes, in their preferred order: earlier nodes start the layout and lead their layer. */
    nodes: readonly LayeredLayoutNode[];
    /** Directed edges; edges to unknown nodes and edges from a node to itself are ignored. */
    edges: readonly LayeredLayoutEdge[];
    /** `horizontal` (the default) places the layers left to right; `vertical` top to bottom. */
    orientation?: Orientation | undefined;
    /** Space between layers, in pixels. Defaults to 80. */
    layerGap?: number | undefined;
    /** Space between the nodes of a layer, in pixels. Defaults to 32. */
    nodeGap?: number | undefined;
}
/** A node's place: its top left corner and the layer it is in, from `0`. */
export interface LayeredLayoutPosition {
    id: Key;
    x: number;
    y: number;
    layer: number;
}
/**
 * Places a directed graph in layers: every edge points to a later layer except those that close a
 * cycle, nodes within a layer are ordered to reduce crossings, and each layer is centred across
 * the widest one. Returns the positions in the order of `nodes`.
 */
export declare function layoutLayeredGraph(options: LayeredLayoutOptions): LayeredLayoutPosition[];
//# sourceMappingURL=layered-layout.d.ts.map