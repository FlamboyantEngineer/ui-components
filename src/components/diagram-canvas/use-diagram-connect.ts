'use client';

import { useLayoutEffect, useRef, useState } from 'react';
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
interface DiagramConnecting {
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

/** Whether a node, and the port when one is named, is still drawn. */
function isDrawn(nodes: readonly DiagramNode[], node: Key, port?: string): boolean {
  const item = nodes.find((entry) => entry.id === node);
  return (
    item !== undefined &&
    (port === undefined || Boolean(item.ports?.some((entry) => entry.id === port)))
  );
}

/**
 * The connection the reader is drawing from a port, by pointer drag or by keyboard. `isEditing` is
 * false while the canvas is not editable or not shown: the connection lives only while it is
 * editable, shown and its source port is drawn, and is given up (and announced) otherwise.
 */
export function useDiagramConnect({
  nodes,
  isEditing,
  onConnect,
  announce,
}: {
  nodes: readonly DiagramNode[];
  isEditing: boolean;
  onConnect: ((connection: DiagramConnection) => void) | undefined;
  announce: (message: string) => void;
}): DiagramConnect {
  const strings = useUiStrings();
  const [connecting, setConnecting] = useState<DiagramConnecting | null>(null);
  // A connection whose canvas stops being editable or shown, or whose source port goes, is
  // dropped in the same render; the effect announces it once.
  const [cancelCount, setCancelCount] = useState(0);
  if (connecting && !(isEditing && isDrawn(nodes, connecting.node, connecting.port))) {
    setConnecting(null);
    setCancelCount((count) => count + 1);
  }
  const announcedCountRef = useRef(0);
  useLayoutEffect(() => {
    if (cancelCount === announcedCountRef.current) return;
    announcedCountRef.current = cancelCount;
    announce(strings.diagramConnectCancelled);
  }, [cancelCount, announce, strings.diagramConnectCancelled]);
  const labelOf = (id: Key) => nodes.find((node) => node.id === id)?.label ?? String(id);
  const cancel = () => {
    if (!connecting) return;
    setConnecting(null);
    announce(strings.diagramConnectCancelled);
  };
  return {
    connecting,
    start: (node, port) => {
      if (!isEditing || !isDrawn(nodes, node, port)) return;
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
      if (!isEditing || !connecting) return false;
      if (target === connecting.node && targetPort === connecting.port) {
        cancel();
        return true;
      }
      // A target that is no longer drawn takes no connection; the session goes on.
      if (!isDrawn(nodes, target, targetPort)) return false;
      setConnecting(null);
      onConnect?.({ source: connecting.node, sourcePort: connecting.port, target, targetPort });
      announce(strings.diagramConnected(labelOf(connecting.node), labelOf(target)));
      return true;
    },
    cancel,
  };
}
