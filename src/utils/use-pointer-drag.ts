import { useEffect, useRef, type PointerEvent } from 'react';
import { capturePointer, releasePointer } from './pointer-drag.js';

export interface PointerDragOptions<E extends Element, T> {
  /** Return the gesture's starting data, or null to refuse the press. */
  onStart: (event: PointerEvent<E>) => T | null;
  onMove: (event: PointerEvent<E>, state: T) => void;
  /** Cancellation includes a lost capture; a completed release is reported only once. */
  onEnd?: ((event: PointerEvent<E>, state: T, isCancelled: boolean) => void) | undefined;
  /** False leaves capture to the caller, for a swipe that waits for a threshold. */
  capture?: boolean | undefined;
}

interface PointerDrag<E extends Element, T> {
  pointerId: number;
  element: E;
  state: T;
}

/**
 * One primary-pointer gesture at a time. Moves and endings from other pointers are ignored;
 * release, cancellation, lost capture and unmount share the same capture cleanup.
 */
export function usePointerDrag<E extends Element, T>(options: PointerDragOptions<E, T>) {
  const active = useRef<PointerDrag<E, T> | null>(null);
  useEffect(
    () => () => {
      const drag = active.current;
      active.current = null;
      if (drag) releasePointer(drag.element, drag.pointerId);
    },
    [],
  );

  const finish = (event: PointerEvent<E>, isCancelled: boolean) => {
    const drag = active.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    active.current = null;
    releasePointer(drag.element, drag.pointerId);
    options.onEnd?.(event, drag.state, isCancelled);
  };
  return {
    onPointerDown: (event: PointerEvent<E>) => {
      if (event.button !== 0 || event.isPrimary === false || active.current) return;
      const state = options.onStart(event);
      if (state === null) return;
      active.current = { pointerId: event.pointerId, element: event.currentTarget, state };
      if (options.capture !== false) capturePointer(event);
    },
    onPointerMove: (event: PointerEvent<E>) => {
      const drag = active.current;
      if (drag?.pointerId === event.pointerId) options.onMove(event, drag.state);
    },
    onPointerUp: (event: PointerEvent<E>) => finish(event, false),
    onPointerCancel: (event: PointerEvent<E>) => finish(event, true),
    onLostPointerCapture: (event: PointerEvent<E>) => finish(event, true),
  };
}
