'use client';

import { createContext, useCallback, useMemo, useState } from 'react';
import type { CanvasPoint } from '../../utils/canvas-transform.js';
import { isShadowRoot } from '../../utils/is-element.js';
import { useLatest } from '../../utils/use-latest.js';
import type { CanvasAnchorEndpoint, CanvasViewportProps } from './canvas-viewport-types.js';

interface AnchorRegistration {
  endpoint: CanvasAnchorEndpoint;
  element: Element;
}

interface CanvasConnections {
  isEnabled: boolean;
  source: CanvasAnchorEndpoint | null;
  register: (element: Element, endpoint: CanvasAnchorEndpoint) => () => void;
  activate: (element: Element) => void;
  previewPointer: (source: Element, client: CanvasPoint, point: CanvasPoint) => void;
  commitPointer: (source: Element, client: CanvasPoint) => void;
  clearPreview: () => void;
}

type ConnectionOptions = Pick<CanvasViewportProps, 'onConnect' | 'onConnectionPreview'>;

export const CanvasConnectionContext = createContext<CanvasConnections | null>(null);

function isEnabledAnchor(element: Element): boolean {
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

export function useCanvasConnection({ onConnect, onConnectionPreview }: ConnectionOptions) {
  const [anchors] = useState(() => new WeakMap<Element, CanvasAnchorEndpoint>());
  const [keyboard, setKeyboard] = useState<AnchorRegistration | null>(null);
  const isEnabled = onConnect !== undefined || onConnectionPreview !== undefined;
  const latest = useLatest({ keyboard, onConnect, onConnectionPreview });
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
        const { keyboard, onConnect, onConnectionPreview } = latest.current;
        if (keyboard) {
          cancelKeyboard();
          if (isEnabledAnchor(keyboard.element))
            onConnect?.({ source: keyboard.endpoint, target: endpoint });
        } else {
          setKeyboard({ endpoint, element });
          onConnectionPreview?.({ source: endpoint, target: null, point: null });
        }
      },
      previewPointer: (element, client, point) => {
        const source = anchors.get(element);
        if (source)
          latest.current.onConnectionPreview?.({
            source,
            target: findAnchor(anchors, element, client),
            point,
          });
      },
      commitPointer: (element, client) => {
        const source = anchors.get(element);
        const target = findAnchor(anchors, element, client);
        clearPreview();
        if (source && target && isEnabledAnchor(element))
          latest.current.onConnect?.({ source, target });
      },
      clearPreview,
    }),
    [anchors, cancelKeyboard, clearPreview, isEnabled, keyboard?.endpoint, latest, register],
  );
  return { connections, cancelKeyboard };
}
