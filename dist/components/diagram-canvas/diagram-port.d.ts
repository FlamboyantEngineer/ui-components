import type { RefCallback, RefObject } from 'react';
import type { DiagramNode, DiagramPort } from './diagram-model.js';
import type { DiagramController, DiagramTarget } from './use-diagram-controller.js';
export interface DiagramPortViewProps {
    node: DiagramNode;
    port: DiagramPort;
    /** The canvas's latest controller, read when the reader acts. */
    controller: RefObject<DiagramController>;
    registerTarget: (target: DiagramTarget) => RefCallback<HTMLElement>;
    isEditing: boolean;
    /** A connection is being drawn from this port. */
    isConnectSource: boolean;
}
/**
 * A port: in edit mode a button that starts a connection when pressed or dragged, and ends one
 * that is in progress; otherwise a decorative mark.
 */
export declare function DiagramPortView({ node, port, controller, registerTarget, isEditing, isConnectSource, }: DiagramPortViewProps): import("react").JSX.Element;
//# sourceMappingURL=diagram-port.d.ts.map