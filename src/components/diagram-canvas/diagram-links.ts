import type { Key } from '../../core/props.js';
import { requireDefined } from '../../utils/require-defined.js';
import type { DiagramEdge, DiagramNode } from './diagram-model.js';

/** An edge seen from one end, with the node at the other end. */
export interface DiagramLink {
  edge: DiagramEdge;
  other: DiagramNode;
}

export interface DiagramLinks {
  outgoing: DiagramLink[];
  incoming: DiagramLink[];
}

/** Indexes both directions once, retaining edge order, self-links and parallel edges. */
export function indexDiagramLinks(nodes: readonly DiagramNode[], edges: readonly DiagramEdge[]) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const links = new Map<Key, DiagramLinks>(
    nodes.map((node) => [node.id, { outgoing: [], incoming: [] }]),
  );
  for (const edge of edges) {
    const source = byId.get(edge.source);
    const target = byId.get(edge.target);
    if (!source || !target) continue;
    requireDefined(links.get(source.id)).outgoing.push({ edge, other: target });
    requireDefined(links.get(target.id)).incoming.push({ edge, other: source });
  }
  return links;
}

/** The node at the other end, followed by the edge's label when present. */
export function formatDiagramLink({ edge, other }: DiagramLink): string {
  return edge.label ? `${other.label} (${edge.label})` : other.label;
}
