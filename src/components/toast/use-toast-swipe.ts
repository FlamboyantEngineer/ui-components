// Swiping a toast away: the pointer drags it along one direction, and a release past the threshold
// dismisses it.

import { useRef, useState, type PointerEvent } from 'react';
import { measuredProperty } from '../../core/hooks.js';

/** The direction a toast is swiped to dismiss it. */
export type ToastSwipeDirection = 'up' | 'down' | 'left' | 'right';

export interface ToastSwipeOptions {
  direction: ToastSwipeDirection;
  /** Pixels a release must pass to dismiss. */
  threshold: number;
  onDismiss: () => void;
}

/** Pixels a pointer moves before the drag counts as a swipe rather than a press. */
const swipeSlop = 8;

/** The pointer's travel toward `direction`, in pixels; negative when it moves the other way. */
function toTravel(direction: ToastSwipeDirection, deltaX: number, deltaY: number): number {
  if (direction === 'right') return deltaX;
  if (direction === 'left') return -deltaX;
  return direction === 'down' ? deltaY : -deltaY;
}

/** Swallows the click that follows a swipe, so ending a swipe on a button does not press it. */
function swallowNextClick(element: HTMLElement) {
  const swallow = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };
  element.addEventListener('click', swallow, { capture: true, once: true });
  // The click, if any, follows the pointer release in the same task.
  setTimeout(() => element.removeEventListener('click', swallow, { capture: true }));
}

/**
 * Pointer handlers that drag a toast toward `direction`. While dragging it is swiping and its
 * travel is published as `--ui-toast-swipe-x` or `--ui-toast-swipe-y`; a release past `threshold`
 * dismisses it and keeps the travel for its exit, a shorter one returns it to rest.
 */
export function useToastSwipe({ direction, threshold, onDismiss }: ToastSwipeOptions) {
  // Pointer events can outrun renders, so the gesture lives in a ref and the render state follows it.
  const gesture = useRef<{ id: number; x: number; y: number; isSwiping: boolean } | null>(null);
  const [travel, setTravel] = useState(0);
  const [isSwiping, setSwiping] = useState(false);

  const finish = (event: PointerEvent<HTMLElement>, isRelease: boolean) => {
    const current = gesture.current;
    if (current?.id !== event.pointerId) return;
    gesture.current = null;
    if (!current.isSwiping) return;
    setSwiping(false);
    swallowNextClick(event.currentTarget);
    const distance = toTravel(direction, event.clientX - current.x, event.clientY - current.y);
    if (isRelease && distance >= threshold) onDismiss();
    else setTravel(0);
  };

  const swipeProps = {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      gesture.current = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        isSwiping: false,
      };
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      const current = gesture.current;
      if (current?.id !== event.pointerId) return;
      const distance = toTravel(direction, event.clientX - current.x, event.clientY - current.y);
      if (!current.isSwiping && Math.abs(distance) < swipeSlop) return;
      if (!current.isSwiping) {
        current.isSwiping = true;
        event.currentTarget.setPointerCapture?.(event.pointerId);
        // A text selection left by the drag would turn the next drag into a native drag and drop.
        event.currentTarget.ownerDocument.getSelection()?.removeAllRanges();
        setSwiping(true);
      }
      setTravel(Math.max(0, distance));
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => finish(event, true),
    onPointerCancel: (event: PointerEvent<HTMLElement>) => finish(event, false),
  };

  const isHorizontal = direction === 'left' || direction === 'right';
  const signed = direction === 'left' || direction === 'up' ? -travel : travel;
  const style =
    travel === 0 ? {} : measuredProperty(isHorizontal ? 'toast-swipe-x' : 'toast-swipe-y', signed);
  return { swipeProps, isSwiping, style };
}
