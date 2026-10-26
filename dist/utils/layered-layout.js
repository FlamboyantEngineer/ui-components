// A layered (Sugiyama-style) graph layout: break cycles, assign layers by longest path, order each
// layer by the barycentre of its neighbours, then place the layers side by side.
import { findMaximum } from './find-maximum.js';
const sweeps = 4;
function buildGraph(nodes, edges) {
    const index = new Map(nodes.map((node, position) => [node.id, position]));
    const next = nodes.map(() => new Set());
    for (const edge of edges) {
        const from = index.get(edge.source);
        const to = index.get(edge.target);
        if (from === undefined || to === undefined || from === to)
            continue;
        next[from].add(to);
    }
    return next.map((targets) => [...targets]);
}
/** The graph with every edge that closes a cycle (found depth first, in node order) reversed. */
function breakCycles(graph) {
    const state = new Array(graph.length).fill(0);
    const next = graph.map(() => new Set());
    const visit = (start) => {
        const stack = [{ node: start, edge: 0 }];
        state[start] = 1;
        while (stack.length > 0) {
            const frame = stack.at(-1);
            const to = graph[frame.node][frame.edge++];
            if (to === undefined) {
                state[frame.node] = 2;
                stack.pop();
            }
            else if (state[to] === 1) {
                next[to].add(frame.node);
            }
            else {
                next[frame.node].add(to);
                if (state[to] === 0) {
                    state[to] = 1;
                    stack.push({ node: to, edge: 0 });
                }
            }
        }
    };
    for (let node = 0; node < graph.length; node += 1)
        if (state[node] === 0)
            visit(node);
    return next.map((targets) => [...targets]);
}
/**
 * Each node's layer: one more than the deepest layer that leads to it. The queue advances by index
 * rather than removing its front, and repeated edges were already merged into sets.
 */
function assignLayers(graph) {
    const incoming = new Array(graph.length).fill(0);
    for (const targets of graph)
        for (const to of targets)
            incoming[to] += 1;
    const layers = new Array(graph.length).fill(0);
    const ready = incoming.flatMap((count, node) => (count === 0 ? [node] : []));
    for (let head = 0; head < ready.length; head += 1) {
        const node = ready[head];
        for (const to of graph[node]) {
            layers[to] = Math.max(layers[to], layers[node] + 1);
            incoming[to] -= 1;
            if (incoming[to] === 0)
                ready.push(to);
        }
    }
    return layers;
}
/** Reorders one layer by the average position of each node's neighbours in `positions`. */
function sortByBarycentre(layer, neighbours, positions) {
    const centre = new Map(layer.map((node, index) => {
        const around = neighbours[node];
        const sum = around.reduce((total, other) => total + positions[other], 0);
        return [node, around.length > 0 ? sum / around.length : index];
    }));
    layer.sort((a, b) => centre.get(a) - centre.get(b));
    layer.forEach((node, index) => (positions[node] = index));
}
/** The nodes of each layer, ordered to reduce crossings. */
function orderLayers(graph, layers) {
    const ordered = [];
    layers.forEach((layer, node) => (ordered[layer] ??= []).push(node));
    const rows = Array.from(ordered, (row) => row ?? []);
    const previous = graph.map(() => []);
    graph.forEach((targets, node) => targets.forEach((to) => previous[to].push(node)));
    const positions = new Array(graph.length).fill(0);
    rows.forEach((row) => row.forEach((node, index) => (positions[node] = index)));
    for (let sweep = 0; sweep < sweeps; sweep += 1) {
        for (let row = 1; row < rows.length; row += 1) {
            sortByBarycentre(rows[row], previous, positions);
        }
        for (let row = rows.length - 2; row >= 0; row -= 1) {
            sortByBarycentre(rows[row], graph, positions);
        }
    }
    return rows;
}
/**
 * Places a directed graph in layers: every edge points to a later layer except those that close a
 * cycle, nodes within a layer are ordered to reduce crossings, and each layer is centred across
 * the widest one. Returns the positions in the order of `nodes`.
 */
export function layoutLayeredGraph(options) {
    const { nodes, edges, orientation = 'horizontal', layerGap = 80, nodeGap = 32 } = options;
    const graph = breakCycles(buildGraph(nodes, edges));
    const layers = assignLayers(graph);
    const rows = orderLayers(graph, layers);
    const isHorizontal = orientation === 'horizontal';
    const depth = (node) => (isHorizontal ? node.width : node.height);
    const breadth = (node) => (isHorizontal ? node.height : node.width);
    const extents = rows.map((row) => row.reduce((total, node, index) => total + breadth(nodes[node]) + (index > 0 ? nodeGap : 0), 0));
    const widest = findMaximum(extents, (extent) => extent, 0);
    const places = new Array(nodes.length);
    let along = 0;
    rows.forEach((row, layer) => {
        let across = (widest - extents[layer]) / 2;
        for (const node of row) {
            places[node] = { along, across };
            across += breadth(nodes[node]) + nodeGap;
        }
        along += findMaximum(row, (node) => depth(nodes[node]), 0) + layerGap;
    });
    return nodes.map((node, index) => {
        const place = places[index];
        const [x, y] = isHorizontal ? [place.along, place.across] : [place.across, place.along];
        return { id: node.id, x, y, layer: layers[index] };
    });
}
//# sourceMappingURL=layered-layout.js.map