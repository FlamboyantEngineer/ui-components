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
  CanvasGesturePosition,
  CanvasViewportController,
} from './canvas-viewport-types.js';

interface Claim {
  gesture: CanvasGesture;
  owner: Element;
}

type CanvasDrag =
  | { kind: 'item'; claim: Claim; start: CanvasPoint }
  | { kind: 'pan'; local: CanvasPoint; viewport: CanvasViewportState };

interface CanvasPointerOptions {
  element: HTMLElement | null;
  camera: Pick<CanvasViewportController, 'clientToWorld' | 'getViewport'>;
  setViewport: (viewport: CanvasViewportState) => void;
  onStart: () => void;
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

function cancelClaim(drag: CanvasDrag) {
  if (drag.kind === 'item') drag.claim.gesture.onCancel();
}

export function useCanvasPointer({ element, camera, setViewport, onStart }: CanvasPointerOptions) {
  const [claims] = useState(() => new WeakMap<Event, Claim>());
  const surface = useLatest(element);
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
  const positionAt = (event: PointerEvent<Element>, start: CanvasPoint): CanvasGesturePosition => {
    const client = clientPoint(event);
    return { start, point: camera.clientToWorld(client), client };
  };
  const pointerProps = usePointerDrag<HTMLDivElement, CanvasDrag>({
    preventsNativeDrag: true,
    cancelsOnEscape: true,
    cancelsOnUnmount: true,
    onCancel: cancelClaim,
    onStart: (event) => {
      const { target, currentTarget } = event;
      if (!isElement(target) || event.defaultPrevented || !currentTarget.contains(target))
        return null;
      const claim = claims.get(event.nativeEvent);
      claims.delete(event.nativeEvent);
      if (claim) {
        onStart();
        return { kind: 'item', claim, start: camera.clientToWorld(clientPoint(event)) };
      }
      if (!isBackground(target, currentTarget)) return null;
      onStart();
      return {
        kind: 'pan',
        local: toLocalPoint(currentTarget, clientPoint(event)),
        viewport: camera.getViewport(),
      };
    },
    onMove: (event, drag) => {
      if (drag.kind === 'item') {
        if (event.currentTarget.contains(drag.claim.owner))
          drag.claim.gesture.onPreview?.(positionAt(event, drag.start));
        return;
      }
      const local = toLocalPoint(event.currentTarget, clientPoint(event));
      setViewport(
        panCanvasViewport(drag.viewport, { x: local.x - drag.local.x, y: local.y - drag.local.y }),
      );
    },
    onEnd: (event, drag, isCancelled) => {
      if (drag.kind === 'pan') return;
      if (isCancelled || !event.currentTarget.contains(drag.claim.owner)) cancelClaim(drag);
      else drag.claim.gesture.onCommit(positionAt(event, drag.start));
    },
  });
  return { claimGesture, pointerProps };
}
