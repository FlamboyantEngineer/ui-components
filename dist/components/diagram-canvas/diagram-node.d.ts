import { type ReactNode, type RefCallback, type RefObject } from 'react';
import { type DiagramNode } from './diagram-model.js';
import type { DiagramController, DiagramTarget } from './use-diagram-controller.js';
/** The states a canvas passes to `renderNode` with each node. */
export interface DiagramNodeRenderState {
    isSelected: boolean;
    /** The canvas is in edit mode. */
    isEditing: boolean;
}
export interface DiagramNodeViewProps<T> {
    node: DiagramNode<T>;
    /**
     * The canvas's latest controller, read when the reader acts. The node renders from its other
     * props only, so a change elsewhere in the diagram does not render it again.
     */
    controller: RefObject<DiagramController>;
    /** The canvas's ref callback factory, the same function every render. */
    registerTarget: (target: DiagramTarget) => RefCallback<HTMLElement>;
    isSelected: boolean;
    isEditing: boolean;
    /** A move is being dragged that carries this node. */
    isMoving: boolean;
    /** The port of this node a connection starts from, or `null`. */
    connectPort: string | null;
    /** What the node's description reads after the caller's: its connections. */
    description: string;
    renderNode: ((node: DiagramNode<T>, state: DiagramNodeRenderState) => ReactNode) | undefined;
}
/** One node: a focusable, named group at its position, holding the caller's content and its ports. */
declare function DiagramNodeElement<T>({ node, controller, registerTarget, isSelected, isEditing, isMoving, connectPort, description, renderNode, }: DiagramNodeViewProps<T>): import("react").JSX.Element;
/** A node, rendered again only when its own props change. */
export declare const DiagramNodeView: typeof DiagramNodeElement;
export {};
//# sourceMappingURL=diagram-node.d.ts.map