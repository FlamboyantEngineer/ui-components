'use client';

import {
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type RefCallback,
  useCallback,
  useContext,
} from 'react';
import type { CanvasPoint } from '../../utils/canvas-transform.js';
import { CanvasElementContext } from './canvas-element.js';
import { useCanvasViewport } from './canvas-viewport.js';
import { canvasViewportHooks } from './canvas-viewport-hooks.js';
import type { CanvasAnchorEndpoint, CanvasGesture } from './canvas-viewport-types.js';
import {
  CanvasConnectionContext,
  type CanvasConnections,
  isEnabledAnchor,
} from './use-canvas-connection.js';

export interface CanvasAnchorOptions {
  /** Called when a primary press is released before it becomes a drag. */
  onTap?: ((endpoint: CanvasAnchorEndpoint) => void) | undefined;
  /** Client pixels a pointer moves before making a connection preview. Defaults to 3. */
  dragThreshold?: number | undefined;
}

interface CanvasAnchorBindings {
  className: string;
  'aria-pressed': boolean | undefined;
  ref: RefCallback<Element>;
  onPointerDown: (event: PointerEvent<Element>) => void;
  onClick: (event: MouseEvent<Element>) => void;
  onKeyDown: (event: KeyboardEvent<Element>) => void;
}

interface AnchorPress {
  event: PointerEvent<Element>;
  endpoint: CanvasAnchorEndpoint;
  options: CanvasAnchorOptions | undefined;
  connections: CanvasConnections;
}

function createAnchorGesture({
  event,
  endpoint,
  options,
  connections,
}: AnchorPress): CanvasGesture {
  const { currentTarget: source, clientX, clientY } = event;
  const threshold = Math.max(0, options?.dragThreshold ?? 3);
  const crossesThreshold = (client: CanvasPoint) => {
    const distance = Math.hypot(client.x - clientX, client.y - clientY);
    return distance > 0 && distance >= threshold;
  };
  let isDragging = false;
  const cancel = () => {
    if (isDragging && connections.isEnabled) connections.clearPreview();
  };
  return {
    onPreview: ({ client, point }) => {
      if (!isDragging && !crossesThreshold(client)) return;
      isDragging = true;
      if (connections.isEnabled) connections.previewPointer(source, client, point);
    },
    onCommit: ({ client }) => {
      if (!isEnabledAnchor(source)) return cancel();
      if (isDragging || crossesThreshold(client)) {
        if (connections.isEnabled) connections.commitPointer(source, client);
      } else options?.onTap?.(endpoint);
    },
    onCancel: cancel,
  };
}

function isSvgActivation(event: KeyboardEvent<Element>): boolean {
  return (
    event.target === event.currentTarget &&
    event.currentTarget.namespaceURI === 'http://www.w3.org/2000/svg' &&
    !event.defaultPrevented &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    (event.key === 'Enter' || event.key === ' ')
  );
}

/** Binds a labelled native button or focusable SVG element inside a CanvasElement. */
export function useCanvasAnchor(
  anchorId: string,
  options?: CanvasAnchorOptions,
): CanvasAnchorBindings {
  const elementId = useContext(CanvasElementContext);
  const connections = useContext(CanvasConnectionContext);
  const { claimGesture } = useCanvasViewport();
  if (elementId === null || connections === null)
    throw new Error('useCanvasAnchor requires a CanvasElement inside a CanvasViewport');
  const { isEnabled, register } = connections;
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
      if ((!isEnabled && !options?.onTap) || !isEnabledAnchor(event.currentTarget)) return;
      claimGesture(
        event,
        createAnchorGesture({ event, endpoint: { elementId, anchorId }, options, connections }),
      );
    },
    onClick: (event) => {
      // Native keyboard presses and assistive technology send a click with no pointer count.
      if (isEnabled && event.detail === 0 && !event.defaultPrevented)
        connections.activate(event.currentTarget);
    },
    onKeyDown: (event) => {
      if (!isEnabled || !isSvgActivation(event)) return;
      event.preventDefault();
      if (!event.repeat) connections.activate(event.currentTarget);
    },
  };
}
