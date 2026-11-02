'use client';

import { useLayoutEffect, useRef, type RefObject } from 'react';
import { getOwnerWindow } from './owner-window.js';

type Offsets = Map<Element, { left: number; top: number }>;

/**
 * The scroll offsets of the anchor's ancestors, across shadow roots, and of the page, when the
 * overlay opens: a queued scroll event of one that has not moved since is no later scroll.
 */
function readScrollOffsets(anchor: Element | null): Offsets {
  const offsets: Offsets = new Map();
  let element = anchor;
  while (element) {
    offsets.set(element, { left: element.scrollLeft, top: element.scrollTop });
    const root = element.getRootNode();
    element = element.parentElement ?? (root instanceof ShadowRoot ? root.host : null);
  }
  const page = anchor?.ownerDocument.scrollingElement;
  if (page) offsets.set(page, { left: page.scrollLeft, top: page.scrollTop });
  return offsets;
}

function isUnmoved(offsets: Offsets, element: Element | null | undefined): boolean {
  const opened = element ? offsets.get(element) : undefined;
  return (
    opened !== undefined &&
    element !== null &&
    element !== undefined &&
    element.scrollLeft === opened.left &&
    element.scrollTop === opened.top
  );
}

export interface ScrollCloseGuardOptions {
  /** The overlay follows the page, so any scroll of the page itself leaves it open. */
  followsPage: boolean;
}

/**
 * Whether a scroll that reaches React Aria at this moment should leave an open nonmodal overlay
 * alone, while `isActive`. React Aria closes one on any scroll of its trigger's scroll containers.
 * A queued scroll event of an ancestor, or of the page, that has not moved since the overlay opened
 * (the reveal scroll that opened it, delivered late) is ignored, and with `followsPage` so is every
 * scroll of the page. A real scroll of an element holding the trigger still closes the overlay.
 */
export function useScrollCloseGuard(
  isActive: boolean,
  triggerRef: RefObject<Element | null>,
  { followsPage }: ScrollCloseGuardOptions,
): () => boolean {
  const isIgnored = useRef(false);
  useLayoutEffect(() => {
    if (!isActive) return;
    // A layout effect, so this capture listener sees each scroll before React Aria's. The scroll
    // bubbles back to the window after React Aria's listener, which ends the guard, so a close the
    // reader asks for in the same task (Escape) still closes. A scroll that does not bubble ends
    // the guard after the task.
    const view = getOwnerWindow(triggerRef.current);
    const offsets = readScrollOffsets(triggerRef.current);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onScrolled = () => {
      clearTimeout(timer);
      isIgnored.current = false;
    };
    const onScroll = (event: Event) => {
      const target = event.composedPath()[0] ?? event.target;
      isIgnored.current =
        target instanceof view.Element
          ? isUnmoved(offsets, target)
          : followsPage || isUnmoved(offsets, view.document.scrollingElement);
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
  }, [isActive, triggerRef, followsPage]);
  return () => isIgnored.current;
}
