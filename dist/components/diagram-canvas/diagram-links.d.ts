import type { Key } from '../../core/props.js';
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
export declare function indexDiagramLinks(nodes: readonly DiagramNode[], edges: readonly DiagramEdge[]): Map<Key, DiagramLinks>;
/** The node at the other end, followed by the edge's label when present. */
export declare function formatDiagramLink({ edge, other }: DiagramLink): string;
//# sourceMappingURL=diagram-links.d.ts.map