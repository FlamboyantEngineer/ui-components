import type { DiagramController } from './use-diagram-controller.js';
export interface DiagramOutlineProps {
    controller: DiagramController;
}
/**
 * The diagram as a list: every node with the nodes it leads to and comes from, as buttons that
 * move to that node's entry. In edit mode each outgoing link has a button that removes it.
 */
export declare function DiagramOutline({ controller }: DiagramOutlineProps): import("react").JSX.Element;
//# sourceMappingURL=diagram-outline.d.ts.map