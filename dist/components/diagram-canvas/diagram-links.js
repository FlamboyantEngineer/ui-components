/** Indexes both directions once, retaining edge order, self-links and parallel edges. */
export function indexDiagramLinks(nodes, edges) {
    const byId = new Map(nodes.map((node) => [node.id, node]));
    const links = new Map(nodes.map((node) => [node.id, { outgoing: [], incoming: [] }]));
    for (const edge of edges) {
        const source = byId.get(edge.source);
        const target = byId.get(edge.target);
        if (!source || !target)
            continue;
        links.get(source.id).outgoing.push({ edge, other: target });
        links.get(target.id).incoming.push({ edge, other: source });
    }
    return links;
}
/** The node at the other end, followed by the edge's label when present. */
export function formatDiagramLink({ edge, other }) {
    return edge.label ? `${other.label} (${edge.label})` : other.label;
}
//# sourceMappingURL=diagram-links.js.map