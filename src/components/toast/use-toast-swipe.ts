// Swiping a toast away: the pointer drags it along one direction, and a release past the threshold
// dismisses it.

import { useState } from 'react';
import { capturePointer } from '../../utils/pointer-drag.js';
import { usePointerDrag } from '../../utils/use-pointer-drag.js';
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
  const [travel, setTravel] = useState(0);
  const [isSwiping, setSwiping] = useState(false);
  const swipeProps = usePointerDrag<HTMLElement, { x: number; y: number; isSwiping: boolean }>({
    capture: false,
    onStart: (event) => ({ x: event.clientX, y: event.clientY, isSwiping: false }),
    onMove: (event, current) => {
      const distance = toTravel(direction, event.clientX - current.x, event.clientY - current.y);
      if (!current.isSwiping && Math.abs(distance) < swipeSlop) return;
      if (!current.isSwiping) {
        current.isSwiping = true;
        capturePointer(event);
        // A text selection left by the drag would turn the next drag into a native drag and drop.
        event.currentTarget.ownerDocument.getSelection()?.removeAllRanges();
        setSwiping(true);
      }
      setTravel(Math.max(0, distance));
    },
    onEnd: (event, current, isCancelled) => {
      if (!current.isSwiping) return;
      setSwiping(false);
      swallowNextClick(event.currentTarget);
      const distance = toTravel(direction, event.clientX - current.x, event.clientY - current.y);
      if (!isCancelled && distance >= threshold) onDismiss();
      else setTravel(0);
    },
  });

  const isHorizontal = direction === 'left' || direction === 'right';
  const signed = direction === 'left' || direction === 'up' ? -travel : travel;
  const style =
    travel === 0 ? {} : measuredProperty(isHorizontal ? 'toast-swipe-x' : 'toast-swipe-y', signed);
  return { swipeProps, isSwiping, style };
}
