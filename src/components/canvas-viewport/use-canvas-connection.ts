'use client';

import { createContext, useCallback, useMemo, useState } from 'react';
import type { CanvasPoint } from '../../utils/canvas-transform.js';
import { isShadowRoot } from '../../utils/is-element.js';
import { useLatest } from '../../utils/use-latest.js';
import type {
  CanvasAnchorEndpoint,
  CanvasConnection,
  CanvasViewportProps,
} from './canvas-viewport-types.js';

interface AnchorRegistration {
  endpoint: CanvasAnchorEndpoint;
  element: Element;
}

export interface CanvasConnections {
  isEnabled: boolean;
  source: CanvasAnchorEndpoint | null;
  register: (element: Element, endpoint: CanvasAnchorEndpoint) => () => void;
  activate: (element: Element) => void;
  previewPointer: (source: Element, client: CanvasPoint, point: CanvasPoint) => void;
  commitPointer: (source: Element, client: CanvasPoint) => void;
  clearPreview: () => void;
}

type ConnectionOptions = Pick<
  CanvasViewportProps,
  'canConnect' | 'onConnect' | 'onConnectionPreview'
>;

export const CanvasConnectionContext = createContext<CanvasConnections | null>(null);

export function isEnabledAnchor(element: Element): boolean {
  return !element.matches(':disabled, [aria-disabled="true"]');
}

function findAnchor(
  anchors: WeakMap<Element, CanvasAnchorEndpoint>,
  source: Element,
  client: CanvasPoint,
) {
  const root = source.getRootNode();
  const scope = isShadowRoot(root) ? root : source.ownerDocument;
  let hit = scope.elementFromPoint?.(client.x, client.y);
  while (hit) {
    const endpoint = anchors.get(hit);
    if (endpoint) return isEnabledAnchor(hit) ? endpoint : null;
    hit = hit.parentElement;
  }
  return null;
}

function acceptConnection(
  source: CanvasAnchorEndpoint | null | undefined,
  target: CanvasAnchorEndpoint | null,
  canConnect: ConnectionOptions['canConnect'],
): CanvasConnection | null {
  if (!source || !target) return null;
  const connection = { source, target };
  return !canConnect || canConnect(connection) ? connection : null;
}

export function useCanvasConnection({
  canConnect,
  onConnect,
  onConnectionPreview,
}: ConnectionOptions) {
  const [anchors] = useState(() => new WeakMap<Element, CanvasAnchorEndpoint>());
  const [keyboard, setKeyboard] = useState<AnchorRegistration | null>(null);
  const isEnabled = onConnect !== undefined || onConnectionPreview !== undefined;
  const latest = useLatest({ keyboard, canConnect, onConnect, onConnectionPreview });
  const clearPreview = useCallback(() => latest.current.onConnectionPreview?.(null), [latest]);
  const cancelKeyboard = useCallback(() => {
    if (!latest.current.keyboard) return false;
    setKeyboard(null);
    clearPreview();
    return true;
  }, [clearPreview, latest]);

  const register = useCallback<CanvasConnections['register']>(
    (element, endpoint) => {
      anchors.set(element, endpoint);
      return () => {
        anchors.delete(element);
        if (latest.current.keyboard?.element === element) cancelKeyboard();
      };
    },
    [anchors, cancelKeyboard, latest],
  );

  const connections = useMemo<CanvasConnections>(
    () => ({
      isEnabled,
      source: keyboard?.endpoint ?? null,
      register,
      activate: (element) => {
        const endpoint = anchors.get(element);
        if (!endpoint || !isEnabledAnchor(element)) return;
        const { keyboard, canConnect, onConnect, onConnectionPreview } = latest.current;
        if (keyboard) {
          const connection = isEnabledAnchor(keyboard.element)
            ? acceptConnection(keyboard.endpoint, endpoint, canConnect)
            : null;
          cancelKeyboard();
          if (connection) onConnect?.(connection);
        } else {
          setKeyboard({ endpoint, element });
          onConnectionPreview?.({ source: endpoint, target: null, point: null });
        }
      },
      previewPointer: (element, client, point) => {
        const source = anchors.get(element);
        if (!source || !isEnabledAnchor(element)) return;
        const { canConnect, onConnectionPreview } = latest.current;
        const candidate = acceptConnection(
          source,
          findAnchor(anchors, element, client),
          canConnect,
        );
        onConnectionPreview?.({ source, target: candidate?.target ?? null, point });
      },
      commitPointer: (element, client) => {
        const { canConnect, onConnect } = latest.current;
        const candidate = isEnabledAnchor(element)
          ? acceptConnection(anchors.get(element), findAnchor(anchors, element, client), canConnect)
          : null;
        clearPreview();
        if (candidate) onConnect?.(candidate);
      },
      clearPreview,
    }),
    [anchors, cancelKeyboard, clearPreview, isEnabled, keyboard?.endpoint, latest, register],
  );
  return { connections, cancelKeyboard };
}
