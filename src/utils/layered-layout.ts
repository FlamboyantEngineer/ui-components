// A layered (Sugiyama-style) graph layout: break cycles, assign layers by longest path, order each
// layer by the barycentre of its neighbours, then place the layers side by side.

import type { Key, Orientation } from '../core/props.js';
import { findMaximum } from './find-maximum.js';
import { requireDefined } from './require-defined.js';

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

/** Successors of each node by index, in edge order, without duplicates. */
type Graph = number[][];

const sweeps = 4;

function buildGraph(
  nodes: readonly LayeredLayoutNode[],
  edges: readonly LayeredLayoutEdge[],
): Graph {
  const index = new Map(nodes.map((node, position) => [node.id, position]));
  const next = nodes.map(() => new Set<number>());
  for (const edge of edges) {
    const from = index.get(edge.source);
    const to = index.get(edge.target);
    if (from === undefined || to === undefined || from === to) continue;
    requireDefined(next[from]).add(to);
  }
  return next.map((targets) => [...targets]);
}

/** The graph with every edge that closes a cycle (found depth first, in node order) reversed. */
function breakCycles(graph: Graph): Graph {
  const state = new Array<0 | 1 | 2>(graph.length).fill(0);
  const next = graph.map(() => new Set<number>());
  const visit = (start: number) => {
    const stack: Array<{ node: number; edge: number }> = [{ node: start, edge: 0 }];
    state[start] = 1;
    while (stack.length > 0) {
      const frame = requireDefined(stack.at(-1));
      const to = requireDefined(graph[frame.node])[frame.edge++];
      if (to === undefined) {
        state[frame.node] = 2;
        stack.pop();
      } else if (state[to] === 1) {
        requireDefined(next[to]).add(frame.node);
      } else {
        requireDefined(next[frame.node]).add(to);
        if (state[to] === 0) {
          state[to] = 1;
          stack.push({ node: to, edge: 0 });
        }
      }
    }
  };
  for (let node = 0; node < graph.length; node += 1) if (state[node] === 0) visit(node);
  return next.map((targets) => [...targets]);
}

/**
 * Each node's layer: one more than the deepest layer that leads to it. The queue advances by index
 * rather than removing its front, and repeated edges were already merged into sets.
 */
function assignLayers(graph: Graph): number[] {
  const incoming = new Array<number>(graph.length).fill(0);
  for (const targets of graph)
    for (const to of targets) incoming[to] = requireDefined(incoming[to]) + 1;
  const layers = new Array<number>(graph.length).fill(0);
  const ready = incoming.flatMap((count, node) => (count === 0 ? [node] : []));
  for (let head = 0; head < ready.length; head += 1) {
    const node = requireDefined(ready[head]);
    for (const to of requireDefined(graph[node])) {
      layers[to] = Math.max(requireDefined(layers[to]), requireDefined(layers[node]) + 1);
      incoming[to] = requireDefined(incoming[to]) - 1;
      if (incoming[to] === 0) ready.push(to);
    }
  }
  return layers;
}

/** Reorders one layer by the average position of each node's neighbours in `positions`. */
function sortByBarycentre(layer: number[], neighbours: number[][], positions: number[]): void {
  const centre = new Map(
    layer.map((node, index) => {
      const around = requireDefined(neighbours[node]);
      const sum = around.reduce((total, other) => total + requireDefined(positions[other]), 0);
      return [node, around.length > 0 ? sum / around.length : index] as const;
    }),
  );
  layer.sort((a, b) => requireDefined(centre.get(a)) - requireDefined(centre.get(b)));
  layer.forEach((node, index) => (positions[node] = index));
}

/** The nodes of each layer, ordered to reduce crossings. */
function orderLayers(graph: Graph, layers: number[]): number[][] {
  const ordered: number[][] = [];
  layers.forEach((layer, node) => (ordered[layer] ??= []).push(node));
  const rows = Array.from(ordered, (row) => row ?? []);
  const previous = graph.map(() => [] as number[]);
  graph.forEach((targets, node) =>
    targets.forEach((to) => requireDefined(previous[to]).push(node)),
  );
  const positions = new Array<number>(graph.length).fill(0);
  rows.forEach((row) => row.forEach((node, index) => (positions[node] = index)));
  for (let sweep = 0; sweep < sweeps; sweep += 1) {
    for (let row = 1; row < rows.length; row += 1) {
      sortByBarycentre(requireDefined(rows[row]), previous, positions);
    }
    for (let row = rows.length - 2; row >= 0; row -= 1) {
      sortByBarycentre(requireDefined(rows[row]), graph, positions);
    }
  }
  return rows;
}

/**
 * Places a directed graph in layers: every edge points to a later layer except those that close a
 * cycle, nodes within a layer are ordered to reduce crossings, and each layer is centred across
 * the widest one. Returns the positions in the order of `nodes`.
 */
export function layoutLayeredGraph(options: LayeredLayoutOptions): LayeredLayoutPosition[] {
  const { nodes, edges, orientation = 'horizontal', layerGap = 80, nodeGap = 32 } = options;
  const graph = breakCycles(buildGraph(nodes, edges));
  const layers = assignLayers(graph);
  const rows = orderLayers(graph, layers);
  const isHorizontal = orientation === 'horizontal';
  const depth = (node: LayeredLayoutNode) => (isHorizontal ? node.width : node.height);
  const breadth = (node: LayeredLayoutNode) => (isHorizontal ? node.height : node.width);
  const extents = rows.map((row) =>
    row.reduce(
      (total, node, index) =>
        total + breadth(requireDefined(nodes[node])) + (index > 0 ? nodeGap : 0),
      0,
    ),
  );
  const widest = findMaximum(extents, (extent) => extent, 0);
  const places = new Array<{ along: number; across: number }>(nodes.length);
  let along = 0;
  rows.forEach((row, layer) => {
    let across = (widest - requireDefined(extents[layer])) / 2;
    for (const node of row) {
      places[node] = { along, across };
      across += breadth(requireDefined(nodes[node])) + nodeGap;
    }
    along += findMaximum(row, (node) => depth(requireDefined(nodes[node])), 0) + layerGap;
  });
  return nodes.map((node, index) => {
    const place = requireDefined(places[index]);
    const [x, y] = isHorizontal ? [place.along, place.across] : [place.across, place.along];
    return { id: node.id, x, y, layer: requireDefined(layers[index]) };
  });
}
