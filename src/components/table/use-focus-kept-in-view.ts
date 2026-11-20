'use client';

import { type RefObject, useEffect } from 'react';
import { isFocused } from '../../utils/composed-focus.js';

/** Presses and gestures that move the scroll area by hand; after one, the reader owns the scroll. */
const HAND_SCROLLS = ['wheel', 'pointerdown', 'touchstart'] as const;

/**
 * Keeps the focused element of a measured virtualized table in view while rows are measured
 * (UIC-TABLE-7.5). A focus move scrolls to where the focused row was estimated to be; once the
 * rows drawn around it are measured, the content grows or shrinks and can push the focused row out
 * of view. Each time the content changes size, the element focused inside the scroll area is
 * revealed again, until the reader scrolls by hand (wheel, pointer or touch) or focus moves out.
 */
export function useFocusKeptInView(scrollRef: RefObject<HTMLElement | null>, isActive: boolean) {
  useEffect(() => {
    const scroller = scrollRef.current;
    const view = scroller?.ownerDocument.defaultView;
    if (!isActive || !scroller || !view?.ResizeObserver) return undefined;
    let kept: Element | null = null;
    const keep = ({ target }: FocusEvent) => {
      kept = target instanceof view.Element ? target : null;
    };
    const release = () => {
      kept = null;
    };
    const reveal = () => {
      if (kept && isFocused(kept) && scroller.contains(kept))
        kept.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    };
    const observer = new view.ResizeObserver(reveal);
    for (const child of scroller.children) observer.observe(child);
    scroller.addEventListener('focusin', keep);
    scroller.addEventListener('focusout', release);
    for (const type of HAND_SCROLLS) scroller.addEventListener(type, release, { passive: true });
    return () => {
      observer.disconnect();
      scroller.removeEventListener('focusin', keep);
      scroller.removeEventListener('focusout', release);
      for (const type of HAND_SCROLLS) scroller.removeEventListener(type, release);
    };
  }, [scrollRef, isActive]);
}
