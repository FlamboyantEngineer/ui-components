'use client';

import {
  type MouseEvent,
  type PointerEvent,
  type RefCallback,
  useCallback,
  useContext,
} from 'react';
import { CanvasElementContext } from './canvas-element.js';
import { useCanvasViewport } from './canvas-viewport.js';
import { canvasViewportHooks } from './canvas-viewport-hooks.js';
import { CanvasConnectionContext } from './use-canvas-connection.js';

interface CanvasAnchorBindings {
  className: string;
  'aria-pressed': boolean | undefined;
  ref: RefCallback<Element>;
  onPointerDown: (event: PointerEvent<Element>) => void;
  onClick: (event: MouseEvent<Element>) => void;
}

/** Binds a native button inside a CanvasElement as a pointer and keyboard connection point. */
export function useCanvasAnchor(anchorId: string): CanvasAnchorBindings {
  const elementId = useContext(CanvasElementContext);
  const connections = useContext(CanvasConnectionContext);
  const { claimGesture } = useCanvasViewport();
  if (elementId === null || connections === null)
    throw new Error('useCanvasAnchor requires a CanvasElement inside a CanvasViewport');
  const { clearPreview, commitPointer, isEnabled, previewPointer, register } = connections;
  const ref = useCallback<RefCallback<Element>>(
    (target) => (target ? register(target, { elementId, anchorId }) : undefined),
    [register, elementId, anchorId],
  );
  return {
    ...canvasViewportHooks.slot('anchor'),
    'aria-pressed': isEnabled
      ? connections.source?.elementId === elementId && connections.source.anchorId === anchorId
      : undefined,
    ref,
    onPointerDown: (event) => {
      const source = event.currentTarget;
      if (!isEnabled || source.matches(':disabled, [aria-disabled="true"]')) return;
      const { clientX, clientY } = event;
      claimGesture(event, {
        onPreview: ({ client, point }) => previewPointer(source, client, point),
        onCommit: ({ client }) => {
          if (Math.hypot(client.x - clientX, client.y - clientY) < 3) clearPreview();
          else commitPointer(source, client);
        },
        onCancel: clearPreview,
      });
    },
    onClick: (event) => {
      // Synthesised clicks include Enter, Space and assistive technology activation.
      if (isEnabled && event.detail === 0 && !event.defaultPrevented)
        connections.activate(event.currentTarget);
    },
  };
}
