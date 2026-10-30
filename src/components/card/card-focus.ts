'use client';

// Keeps focus in a card whose focused element a collapse or a smaller presentation took away.

import { useEffect, useLayoutEffect, useRef } from 'react';

/** Where focus goes instead, in order of preference. */
const togglesFirst = ['.ui-card__toggle', '.ui-card__more', '.ui-card__action'];
/** After a smaller presentation, the More button holds what was focused. */
const moreFirst = ['.ui-card__more', '.ui-card__toggle', '.ui-card__action'];

function isGone(element: Element): boolean {
  return !element.isConnected || element.closest('[hidden]') !== null;
}

/**
 * After the card collapses or changes presentation, moves focus that was inside the card to the
 * card's toggle, More button or action when the focused element was hidden or removed. Focus
 * elsewhere, or on an element still shown, stays where it is.
 */
export function useFocusRescue(
  root: HTMLElement | null,
  presentation: string,
  isExpanded: boolean,
) {
  const focused = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!root) return undefined;
    const onFocusIn = (event: FocusEvent) => {
      focused.current = event.target instanceof HTMLElement ? event.target : null;
    };
    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget;
      if (next instanceof Node && root.contains(next)) return;
      // Focus that left with its element (removed or hidden) is the focus to put back.
      const left = event.target;
      setTimeout(() => {
        if (focused.current === left && left instanceof Element && !isGone(left)) {
          focused.current = null;
        }
      }, 0);
    };
    root.addEventListener('focusin', onFocusIn);
    root.addEventListener('focusout', onFocusOut);
    return () => {
      root.removeEventListener('focusin', onFocusIn);
      root.removeEventListener('focusout', onFocusOut);
    };
  }, [root]);

  const shownPresentation = useRef(presentation);
  useLayoutEffect(() => {
    const hasPresentationChanged = shownPresentation.current !== presentation;
    shownPresentation.current = presentation;
    const element = focused.current;
    if (!root || !element || !isGone(element)) return;
    const active = root.ownerDocument.activeElement;
    if (active && active !== element && active !== root.ownerDocument.body) return;
    const own = (candidate: HTMLElement) =>
      !isGone(candidate) &&
      !candidate.matches(':disabled') &&
      candidate.closest('.ui-card') === root;
    const fallback = (hasPresentationChanged ? moreFirst : togglesFirst)
      .map((selector) => [...root.querySelectorAll<HTMLElement>(selector)].find(own))
      .find(Boolean);
    focused.current = null;
    fallback?.focus();
  }, [root, presentation, isExpanded]);
}
