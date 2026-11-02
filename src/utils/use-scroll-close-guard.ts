'use client';

import { useLayoutEffect, useRef, type RefObject } from 'react';
import { getOwnerWindow } from './owner-window.js';

/** The offsets at opening tell a queued scroll event, which moved nothing since, from a later scroll. */
function ancestorScrollOffsets(anchor: Element | null) {
  const offsets = new Map<Element, { left: number; top: number }>();
  for (let element = anchor; element; element = element.parentElement) {
    offsets.set(element, { left: element.scrollLeft, top: element.scrollTop });
  }
  return offsets;
}

/**
 * Whether a scroll that reaches React Aria at this moment should leave an open nonmodal overlay
 * alone, while `isActive`. React Aria closes one on any scroll of its trigger's scroll containers.
 * The overlay ignores two of those: a scroll of the page itself (its document), which the overlay
 * follows, and a queued scroll event of an ancestor that has not moved since the overlay opened
 * (the reveal scroll that opened it, delivered late). A real scroll of an element holding the
 * trigger still closes it, since the overlay cannot follow that.
 */
export function useScrollCloseGuard(
  isActive: boolean,
  triggerRef: RefObject<Element | null>,
): () => boolean {
  const isIgnored = useRef(false);
  useLayoutEffect(() => {
    if (!isActive) return;
    // A layout effect, so this capture listener sees each scroll before React Aria's. The scroll
    // bubbles back to the window after React Aria's listener, which ends the guard, so a close the
    // reader asks for in the same task (Escape) still closes. A scroll that does not bubble ends
    // the guard after the task.
    const view = getOwnerWindow(triggerRef.current);
    const offsets = ancestorScrollOffsets(triggerRef.current);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onScrolled = () => {
      clearTimeout(timer);
      isIgnored.current = false;
    };
    const onScroll = (event: Event) => {
      const target = event.target;
      const opened = target instanceof view.Element ? offsets.get(target) : undefined;
      isIgnored.current =
        !(target instanceof view.Element) ||
        (opened !== undefined &&
          target.scrollLeft === opened.left &&
          target.scrollTop === opened.top);
      if (!isIgnored.current) return;
      clearTimeout(timer);
      timer = setTimeout(onScrolled);
    };
    const options = { capture: true, passive: true };
    view.addEventListener('scroll', onScroll, options);
    view.addEventListener('scroll', onScrolled, { passive: true });
    return () => {
      onScrolled();
      view.removeEventListener('scroll', onScroll, options);
      view.removeEventListener('scroll', onScrolled);
    };
  }, [isActive, triggerRef]);
  return () => isIgnored.current;
}
