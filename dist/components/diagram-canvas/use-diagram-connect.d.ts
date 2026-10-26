import type { Key } from '../../core/props.js';
import type { DiagramNode } from './diagram-model.js';
import type { DiagramPoint } from './edge-route.js';
/** A connection the reader asks for: from a port to a node, or to one of its ports. */
export interface DiagramConnection {
    source: Key;
    sourcePort: string;
    target: Key;
    /** Undefined when the connection ends on the node itself. */
    targetPort?: string | undefined;
}
/** A connection in progress, from a port, with the pointer's diagram position while dragging. */
export interface DiagramConnecting {
    node: Key;
    port: string;
    pointer: DiagramPoint | null;
}
export interface DiagramConnect {
    connecting: DiagramConnecting | null;
    start: (node: Key, port: string) => void;
    /** Follows the pointer while a connection is dragged. */
    track: (pointer: DiagramPoint | null) => void;
    /** Ends the connection on a node or one of its ports; false when none is in progress. */
    complete: (target: Key, targetPort?: string) => boolean;
    cancel: () => void;
}
/** The connection the reader is drawing from a port, by pointer drag or by keyboard. */
export declare function useDiagramConnect({ nodes, isEditing, onConnect, announce, }: {
    nodes: readonly DiagramNode[];
    isEditing: boolean;
    onConnect: ((connection: DiagramConnection) => void) | undefined;
    announce: (message: string) => void;
}): DiagramConnect;
//# sourceMappingURL=use-diagram-connect.d.ts.map