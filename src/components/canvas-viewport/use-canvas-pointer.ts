'use client';

import { type PointerEvent, useCallback, useState } from 'react';
import {
  type CanvasPoint,
  type CanvasViewportState,
  panCanvasViewport,
} from '../../utils/canvas-transform.js';
import { toLocalPoint } from '../../utils/element-scale.js';
import { isElement } from '../../utils/is-element.js';
import { useLatest } from '../../utils/use-latest.js';
import { usePointerDrag } from '../../utils/use-pointer-drag.js';
import type {
  CanvasGesture,
  CanvasGesturePolicy,
  CanvasGesturePosition,
  CanvasViewportController,
} from './canvas-viewport-types.js';

interface Claim {
  gesture: CanvasGesture;
  owner: Element;
}

type CanvasDrag =
  | { kind: 'item'; claim: Claim; start: CanvasPoint }
  | {
      kind: 'background';
      local: CanvasPoint;
      viewport: CanvasViewportState;
      gesture: CanvasGesture | undefined;
      start: CanvasPoint;
      hasMoved: boolean;
    };

interface CanvasBackground {
  /** A composing component can assign hit targets through its own event handlers. */
  acceptsTarget?: ((target: Element, surface: HTMLDivElement) => boolean) | undefined;
  /** Layout pixels to move before a background gesture starts. */
  threshold?: number | undefined;
  /** Takes a background drag for an interaction such as marquee selection. */
  startGesture?: ((event: PointerEvent<HTMLDivElement>) => CanvasGesture | undefined) | undefined;
  /** Handles a primary background press released without a drag. */
  onPress?: (() => void) | undefined;
}

interface CanvasPointerOptions {
  element: HTMLDivElement | null;
  camera: Pick<CanvasViewportController, 'clientToWorld' | 'getViewport'>;
  setViewport: (viewport: CanvasViewportState) => void;
  panButton?: CanvasGesturePolicy['panButton'];
  onStart?: (() => void) | undefined;
  background?: CanvasBackground | undefined;
}

function clientPoint(event: PointerEvent<Element>): CanvasPoint {
  return { x: event.clientX, y: event.clientY };
}

function isBackground(target: Element, surface: HTMLElement): boolean {
  return (
    target === surface ||
    target.parentElement === surface ||
    (target.localName === 'svg' && target.parentElement?.parentElement === surface)
  );
}

function cancelDrag(drag: CanvasDrag) {
  const gesture = drag.kind === 'item' ? drag.claim.gesture : drag.gesture;
  gesture?.onCancel();
}

function getDragHandlers(options: CanvasPointerOptions, claims: WeakMap<Event, Claim>) {
  const { camera, setViewport, onStart, panButton, background } = options;
  const positionAt = (event: PointerEvent<Element>, start: CanvasPoint): CanvasGesturePosition => {
    const client = clientPoint(event);
    return { start, point: camera.clientToWorld(client), client };
  };
  return {
    onStart: (event: PointerEvent<HTMLDivElement>): CanvasDrag | null => {
      const { target, currentTarget } = event;
      if (!isElement(target) || event.defaultPrevented || !currentTarget.contains(target))
        return null;
      const claim = claims.get(event.nativeEvent);
      claims.delete(event.nativeEvent);
      const client = clientPoint(event);
      if (claim) {
        onStart?.();
        return { kind: 'item', claim, start: camera.clientToWorld(client) };
      }
      const isMiddle = panButton === 'middle';
      if (
        isMiddle
          ? event.button !== 1
          : !(background?.acceptsTarget ?? isBackground)(target, currentTarget)
      )
        return null;
      // A middle press would otherwise start the browser's autoscroll.
      if (isMiddle) event.preventDefault();
      onStart?.();
      return {
        kind: 'background',
        local: toLocalPoint(currentTarget, client),
        viewport: camera.getViewport(),
        gesture: background?.startGesture?.(event),
        start: camera.clientToWorld(client),
        hasMoved: false,
      };
    },
    onMove: (event: PointerEvent<HTMLDivElement>, drag: CanvasDrag) => {
      if (drag.kind === 'item') {
        if (event.currentTarget.contains(drag.claim.owner))
          drag.claim.gesture.onPreview?.(positionAt(event, drag.start));
        return;
      }
      const local = toLocalPoint(event.currentTarget, clientPoint(event));
      const delta = { x: local.x - drag.local.x, y: local.y - drag.local.y };
      if (!drag.hasMoved && Math.hypot(delta.x, delta.y) < (background?.threshold ?? 0)) return;
      drag.hasMoved = true;
      if (drag.gesture) drag.gesture.onPreview?.(positionAt(event, drag.start));
      else setViewport(panCanvasViewport(drag.viewport, delta));
    },
    onEnd: (event: PointerEvent<HTMLDivElement>, drag: CanvasDrag, isCancelled: boolean) => {
      if (
        isCancelled ||
        (drag.kind === 'item' && !event.currentTarget.contains(drag.claim.owner))
      ) {
        cancelDrag(drag);
      } else if (drag.kind === 'item') {
        drag.claim.gesture.onCommit(positionAt(event, drag.start));
      } else if (drag.hasMoved) {
        drag.gesture?.onCommit(positionAt(event, drag.start));
      } else if (panButton !== 'middle') {
        background?.onPress?.();
      }
    },
  };
}

export function useCanvasPointer(options: CanvasPointerOptions) {
  const [claims] = useState(() => new WeakMap<Event, Claim>());
  const surface = useLatest(options.element);
  const claimGesture = useCallback<CanvasViewportController['claimGesture']>(
    (event, gesture) => {
      const { nativeEvent, currentTarget } = event;
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.isPrimary === false ||
        !surface.current?.contains(currentTarget) ||
        claims.has(nativeEvent)
      )
        return false;
      claims.set(nativeEvent, { gesture, owner: currentTarget });
      return true;
    },
    [claims, surface],
  );
  const pointerProps = usePointerDrag<HTMLDivElement, CanvasDrag>({
    ...getDragHandlers(options, claims),
    allowsMiddleButton: options.panButton === 'middle',
    resetKey: options.panButton ?? 'primary',
    preventsNativeDrag: true,
    cancelsOnEscape: true,
    cancelsOnUnmount: true,
    onCancel: cancelDrag,
  });
  return { claimGesture, pointerProps };
}
