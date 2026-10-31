'use client';

// Keeps keyboard focus in a row of items that can leave it or collapse into an overflow menu at its
// end. Shared by Action Row and Toolbar Scroller.

import { useCallback, useLayoutEffect, useRef } from 'react';
import { getComposedActiveElement, isFocusLost } from './focus-target.js';
import { isNode } from './is-element.js';

export interface OverflowFocusSelectors {
  /** Matches each item of the row that can hold focus or contain it. */
  item: string;
  /** Matches the overflow menu's button, where focus goes when the focused item collapses. */
  overflow: string;
}

const focusableSelector = [
  'a[href]',
  'button:not(:disabled)',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/** The item holding focus and the items around it, nearest first. */
interface FocusedItem {
  item: Element;
  following: Element[];
  preceding: Element[];
}

function findFocusedItem(
  root: HTMLElement,
  target: Element | null,
  selectors: OverflowFocusSelectors,
): FocusedItem | null {
  const items = [...root.querySelectorAll(`${selectors.item}, ${selectors.overflow}`)];
  const index = target ? items.findIndex((item) => item.contains(target)) : -1;
  if (index === -1) return null;
  return {
    item: items[index] as Element,
    following: items.slice(index + 1),
    preceding: items.slice(0, index).reverse(),
  };
}

/** An item itself when it takes focus, else its first control that does. */
function toFocusable(item: Element | null | undefined): HTMLElement | null {
  if (!item) return null;
  if (item.matches(focusableSelector)) return item as HTMLElement;
  return item.querySelector<HTMLElement>(focusableSelector);
}

/**
 * Where focus goes when the focused item leaves: the next item still there, else the overflow
 * menu's button (the item may have moved into it), else the previous item.
 */
function findSuccessor(
  root: HTMLElement,
  previous: FocusedItem,
  selectors: OverflowFocusSelectors,
): HTMLElement | null {
  const isPresent = (item: Element) => item.isConnected && toFocusable(item) !== null;
  return toFocusable(
    previous.following.find(isPresent) ??
      root.querySelector(selectors.overflow) ??
      previous.preceding.find(isPresent),
  );
}

/**
 * Keeps focus in a row when the item holding it leaves or moves into the overflow menu: focus moves
 * to the next item, else the overflow menu's button, else the previous item, so it never falls to
 * the page. Returns the row's ref. `selectors` must stay the same for the row's life.
 */
export function useOverflowFocus(selectors: OverflowFocusSelectors) {
  const root = useRef<HTMLElement | null>(null);
  const focused = useRef<FocusedItem | null>(null);
  const selectorsRef = useRef(selectors);
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const previous = focused.current;
    if (previous && !previous.item.isConnected && isFocusLost(element)) {
      findSuccessor(element, previous, selectorsRef.current)?.focus();
    }
    // Items may have moved: take the neighbours again from this render.
    focused.current = findFocusedItem(
      element,
      getComposedActiveElement(element),
      selectorsRef.current,
    );
  });
  // Native listeners, since a React Aria toolbar does not forward focus handlers.
  return useCallback((element: HTMLElement | null) => {
    root.current = element;
    if (!element) return undefined;
    const onFocusIn = (event: FocusEvent) => {
      focused.current = findFocusedItem(
        element,
        event.target as Element | null,
        selectorsRef.current,
      );
    };
    // Focus moving elsewhere on the page forgets the item; an item leaving the page moves it nowhere.
    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget;
      if (isNode(next) && !element.contains(next)) focused.current = null;
    };
    element.addEventListener('focusin', onFocusIn);
    element.addEventListener('focusout', onFocusOut);
    return () => {
      root.current = null;
      element.removeEventListener('focusin', onFocusIn);
      element.removeEventListener('focusout', onFocusOut);
    };
  }, []);
}
