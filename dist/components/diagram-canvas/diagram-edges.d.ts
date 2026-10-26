import { type DiagramEdgeRouting } from './edge-route.js';
import type { DiagramController } from './use-diagram-controller.js';
export interface DiagramEdgesProps {
    controller: DiagramController;
    routing: DiagramEdgeRouting;
}
/**
 * The edges as SVG paths with arrowheads, in a layer under the nodes that spans them, and their
 * labels as positioned text above it.
 */
export declare function DiagramEdges({ controller, routing }: DiagramEdgesProps): import("react").JSX.Element | null;
//# sourceMappingURL=diagram-edges.d.ts.map