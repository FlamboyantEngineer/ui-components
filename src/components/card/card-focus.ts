'use client';

// Keeps focus in a card whose focused element a collapse or a smaller presentation took away.

import { isFocusLost, isFocused } from '../../utils/focus-target.js';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { isElement, isHTMLElement, isNode } from '../../utils/is-element.js';
import { cardHooks as hooks } from './card-hooks.js';

const slotSelector = (slot: 'toggle' | 'more' | 'action') => `.${hooks.slotClass(slot)}`;
/** Where focus goes instead, in order of preference. */
const togglesFirst = [slotSelector('toggle'), slotSelector('more'), slotSelector('action')];
/** After a smaller presentation, the More button holds what was focused. */
const moreFirst = [slotSelector('more'), slotSelector('toggle'), slotSelector('action')];

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
      focused.current = isHTMLElement(event.target) ? event.target : null;
    };
    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget;
      if (isNode(next) && root.contains(next)) return;
      // Focus that left with its element (removed or hidden) is the focus to put back.
      const left = event.target;
      setTimeout(() => {
        if (focused.current === left && isElement(left) && !isGone(left)) {
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
    if (!isFocused(element, root) && !isFocusLost(root)) return;
    const own = (candidate: HTMLElement) =>
      !isGone(candidate) &&
      !candidate.matches(':disabled') &&
      candidate.closest(`.${hooks.className}`) === root;
    const fallback = (hasPresentationChanged ? moreFirst : togglesFirst)
      .map((selector) => [...root.querySelectorAll<HTMLElement>(selector)].find(own))
      .find(Boolean);
    focused.current = null;
    fallback?.focus();
  }, [root, presentation, isExpanded]);
}
