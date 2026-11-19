'use client';

import { type PointerEvent, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { capturePointer, releasePointer } from './pointer-drag.js';
import { useLatest } from './use-latest.js';

interface PointerDragOptions<E extends Element, T> {
  /** Refuse new gestures and release an active gesture without reporting a drop. */
  isDisabled?: boolean | undefined;
  /** A mode change abandons the current gesture without disabling future presses. */
  resetKey?: unknown;
  /**
   * Clears a gesture's preview when a mode change abandons it. Unmounting calls it only with
   * `cancelsOnUnmount`, for a preview that lives above the element owning the gesture.
   */
  onCancel?: ((state: T) => void) | undefined;
  /** Also accept a middle-button press from the primary pointer. */
  allowsMiddleButton?: boolean | undefined;
  /** Keeps the browser from starting a native drag during the captured gesture. */
  preventsNativeDrag?: boolean | undefined;
  /** Escape in the owner document abandons the active gesture. */
  cancelsOnEscape?: boolean | undefined;
  /** Also call `onCancel` when the element unmounts mid-gesture. Defaults to false. */
  cancelsOnUnmount?: boolean | undefined;
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
  resetKey: unknown;
  /** Stops watching the document for a release the element did not see. */
  unwatch: () => void;
}

/**
 * Calls `onRelease` when the document sees `pointerId` released or cancelled. Without capture, a
 * release outside the element reaches only the document; one over the element bubbles there after
 * the element's own handler has ended the drag, so it finds nothing to end.
 */
function watchGesture(
  element: Element,
  pointerId: number,
  options: Pick<PointerDragOptions<Element, unknown>, 'cancelsOnEscape' | 'preventsNativeDrag'> & {
    onAbandon: () => void;
  },
): () => void {
  const { onAbandon, cancelsOnEscape, preventsNativeDrag } = options;
  const owner = element.ownerDocument;
  const listener = (event: Event) => {
    if ('pointerId' in event && event.pointerId === pointerId) onAbandon();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    event.preventDefault();
    onAbandon();
  };
  const preventDrag = (event: Event) => event.preventDefault();
  if (preventsNativeDrag) element.addEventListener('dragstart', preventDrag);
  if (cancelsOnEscape) owner.addEventListener('keydown', onKeyDown);
  owner.addEventListener('pointerup', listener);
  owner.addEventListener('pointercancel', listener);
  return () => {
    element.removeEventListener('dragstart', preventDrag);
    owner.removeEventListener('keydown', onKeyDown);
    owner.removeEventListener('pointerup', listener);
    owner.removeEventListener('pointercancel', listener);
  };
}

function isDragButton(button: number, allowsMiddleButton: boolean | undefined): boolean {
  return button === 0 || (button === 1 && allowsMiddleButton === true);
}

/**
 * One primary-pointer gesture at a time. Moves and endings from other pointers are ignored;
 * release, cancellation, lost capture and unmount share the same capture cleanup. A gesture whose
 * release the element never saw (no capture, released outside) ends as abandoned when the document
 * sees the release, when a mouse move arrives with no button pressed, or when a new primary press starts.
 */
export function usePointerDrag<E extends Element, T>(options: PointerDragOptions<E, T>) {
  const active = useRef<PointerDrag<E, T> | null>(null);
  const onCancel = useLatest(options.onCancel);
  const cancelsOnUnmount = useLatest(options.cancelsOnUnmount ?? false);
  const { allowsMiddleButton, isDisabled = false } = options;
  const cancel = useCallback(() => {
    const drag = active.current;
    active.current = null;
    if (drag) {
      drag.unwatch();
      releasePointer(drag.element, drag.pointerId);
    }
    return drag;
  }, []);
  useEffect(
    () => () => {
      const drag = cancel();
      if (drag && cancelsOnUnmount.current) onCancel.current?.(drag.state);
    },
    [cancel, cancelsOnUnmount, onCancel],
  );
  useLayoutEffect(() => {
    const drag = active.current;
    if (!drag || (!isDisabled && Object.is(drag.resetKey, options.resetKey))) return;
    cancel();
    onCancel.current?.(drag.state);
  }, [cancel, isDisabled, options.resetKey, onCancel]);

  const finish = (event: PointerEvent<E>, isCancelled: boolean) => {
    const drag = active.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    cancel();
    options.onEnd?.(
      event,
      drag.state,
      isCancelled || isDisabled || !Object.is(drag.resetKey, options.resetKey),
    );
  };
  return {
    onPointerDown: (event: PointerEvent<E>) => {
      if (
        isDisabled ||
        event.isPrimary === false ||
        !isDragButton(event.button, allowsMiddleButton)
      )
        return;
      // A primary press while a gesture is active means its release went unseen: it is stale.
      const stale = cancel();
      if (stale) options.onEnd?.(event, stale.state, true);
      const state = options.onStart(event);
      if (state === null) return;
      const unwatch = watchGesture(event.currentTarget, event.pointerId, {
        cancelsOnEscape: options.cancelsOnEscape,
        preventsNativeDrag: options.preventsNativeDrag,
        onAbandon: () => {
          const drag = cancel();
          if (drag) onCancel.current?.(drag.state);
        },
      });
      active.current = {
        pointerId: event.pointerId,
        element: event.currentTarget,
        state,
        resetKey: options.resetKey,
        unwatch,
      };
      if (options.capture !== false) capturePointer(event);
    },
    onPointerMove: (event: PointerEvent<E>) => {
      const drag = active.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      // A move with no mouse button follows a release unseen.
      if (event.pointerType === 'mouse' && event.buttons === 0) return finish(event, true);
      if (!isDisabled && Object.is(drag.resetKey, options.resetKey))
        options.onMove(event, drag.state);
    },
    onPointerUp: (event: PointerEvent<E>) => finish(event, false),
    onPointerCancel: (event: PointerEvent<E>) => finish(event, true),
    onLostPointerCapture: (event: PointerEvent<E>) => {
      if (event.target === event.currentTarget) finish(event, true);
    },
  };
}
