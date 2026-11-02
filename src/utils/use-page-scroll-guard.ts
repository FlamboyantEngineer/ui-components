'use client';

import { useLayoutEffect, useRef, type RefObject } from 'react';
import { getOwnerWindow } from './owner-window.js';

/**
 * Whether the page itself (its document, not an element in it) is scrolling at this moment, while
 * `isActive`: a nonmodal overlay asks it before a close, since React Aria closes one on any scroll
 * of its trigger's scroll containers, the page included, and the overlay follows the page instead.
 * A scroll of an element holding the trigger still closes it, since the overlay cannot follow that.
 */
export function usePageScrollGuard(
  isActive: boolean,
  triggerRef: RefObject<Element | null>,
): () => boolean {
  const isPageScrolling = useRef(false);
  useLayoutEffect(() => {
    if (!isActive) return;
    // A layout effect, so this capture listener sees each scroll before React Aria's. The page's
    // scroll bubbles back to the window after React Aria's listener, which ends the guard, so a
    // close the reader asks for in the same task (Escape) still closes. A scroll that does not
    // bubble ends the guard after the task.
    const view = getOwnerWindow(triggerRef.current);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onScrolled = () => {
      clearTimeout(timer);
      isPageScrolling.current = false;
    };
    const onScroll = (event: Event) => {
      isPageScrolling.current = !(event.target instanceof view.Element);
      if (!isPageScrolling.current) return;
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
  return () => isPageScrolling.current;
}
