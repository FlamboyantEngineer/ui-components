import { useState } from 'react';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
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
export function useDiagramConnect({
  nodes,
  onConnect,
  announce,
}: {
  nodes: readonly DiagramNode[];
  onConnect: ((connection: DiagramConnection) => void) | undefined;
  announce: (message: string) => void;
}): DiagramConnect {
  const strings = useUiStrings();
  const [connecting, setConnecting] = useState<DiagramConnecting | null>(null);
  const labelOf = (id: Key) => nodes.find((node) => node.id === id)?.label ?? String(id);
  const cancel = () => {
    if (!connecting) return;
    setConnecting(null);
    announce(strings.diagramConnectCancelled);
  };
  return {
    connecting,
    start: (node, port) => {
      const portLabel = nodes
        .find((item) => item.id === node)
        ?.ports?.find((item) => item.id === port)?.label;
      setConnecting({ node, port, pointer: null });
      announce(
        strings.diagramConnecting(strings.diagramPortLabel(labelOf(node), portLabel ?? port)),
      );
    },
    track: (pointer) => setConnecting((current) => (current ? { ...current, pointer } : current)),
    complete: (target, targetPort) => {
      if (!connecting) return false;
      if (target === connecting.node && targetPort === connecting.port) {
        cancel();
        return true;
      }
      setConnecting(null);
      onConnect?.({ source: connecting.node, sourcePort: connecting.port, target, targetPort });
      announce(strings.diagramConnected(labelOf(connecting.node), labelOf(target)));
      return true;
    },
    cancel,
  };
}
