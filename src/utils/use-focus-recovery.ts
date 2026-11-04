'use client';

// Keeps keyboard focus inside a component when an update hides or removes the element holding it.
// Shared by Navigation Rail, Outline, Dock Panel, Relation Columns, Diagram Canvas and Carousel.

import { type RefObject, useEffect, useLayoutEffect, useRef } from 'react';
import { containsComposed, getComposedActiveElement, isFocusLost } from './focus-target.js';
import { isElement, isNode } from './is-element.js';
import { useLatest } from './use-latest.js';

/**
 * A subtree an update hid: `hidden` or `inert`, or `aria-hidden`, which a collapsing disclosure
 * sets at once while its `hidden` waits for the closing animation.
 */
const hiddenSubtree = '[hidden], [inert], [aria-hidden="true"]';

/** Whether `element` left the page or sits in a hidden subtree. */
export function isHiddenOrGone(element: Element): boolean {
  return !element.isConnected || element.closest(hiddenSubtree) !== null;
}

/** The nearest hidden subtree around `element`. */
export function closestHiddenSubtree(element: Element): Element | null {
  return element.closest(hiddenSubtree);
}

/**
 * Follows the element holding focus inside `rootRef`, and after each commit that hid or removed it
 * while the page's focus fell with it (to the body, or still on the hidden element), focuses what
 * `recover` picks for it: a surviving neighbour, the control that owns the hidden part, or nothing.
 * Focus that left the component for anywhere else is never taken back.
 */
export function useFocusRecovery(
  rootRef: RefObject<Element | null>,
  recover: (lost: Element) => HTMLElement | null | undefined,
): void {
  const held = useRef<Element | null>(null);
  const latestRecover = useLatest(recover);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const onFocusIn = (event: Event) => {
      held.current = isElement(event.target) ? event.target : null;
    };
    const onFocusOut = (event: Event) => {
      const next = (event as FocusEvent).relatedTarget;
      if (isNode(next) && containsComposed(root, next)) return;
      const { target } = event;
      if (next !== null || !isElement(target)) {
        held.current = null;
        return;
      }
      // Focus with no new target: a press on nothing focusable, or the element being hidden or
      // removed, which a browser may report while removing it. The commit that removes or hides it
      // checks before the microtask runs; an element still shown then was simply left.
      queueMicrotask(() => {
        if (held.current === target && !isHiddenOrGone(target)) held.current = null;
      });
    };
    root.addEventListener('focusin', onFocusIn);
    root.addEventListener('focusout', onFocusOut);
    return () => {
      root.removeEventListener('focusin', onFocusIn);
      root.removeEventListener('focusout', onFocusOut);
    };
  }, [rootRef]);
  // Every commit: an update anywhere in the component can hide or remove the focused element.
  useLayoutEffect(() => {
    const lost = held.current;
    const root = rootRef.current;
    if (!lost || !root || !isHiddenOrGone(lost)) return;
    const active = getComposedActiveElement(root);
    if (!isFocusLost(root) && !(active && containsComposed(lost, active))) {
      held.current = null;
      return;
    }
    const target = latestRecover.current(lost);
    held.current = null;
    target?.focus();
  });
}
