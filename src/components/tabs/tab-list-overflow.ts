'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import type { Key, Orientation } from '../../core/props.js';
import { useLayoutChanges } from '../../utils/use-layout-changes.js';
import { clamp } from '../../utils/clamp.js';
import { isOverflowing } from '../../utils/is-overflowing.js';
import { prefersReducedMotion } from '../../utils/prefers-reduced-motion.js';
import { getOwnerWindow } from '../../utils/owner-window.js';
import { measureInScroller } from '../../utils/scroll-geometry.js';

interface ListScrollOptions {
  orientation: Orientation;
  selectedKey: Key | null;
}

/**
 * Scrolls an overflowing list so `tab` sits as close to its middle as the scroll range allows.
 * Right-to-left lists scroll with negative offsets.
 */
function centerTab(list: HTMLElement, tab: HTMLElement, orientation: Orientation) {
  if (!isOverflowing(list, orientation)) return;
  const tabBox = measureInScroller(tab, list);
  const vertical = orientation === 'vertical';
  const range = vertical
    ? list.scrollHeight - list.clientHeight
    : list.scrollWidth - list.clientWidth;
  const position = vertical ? list.scrollTop : list.scrollLeft;
  const delta = vertical
    ? tabBox.top + tabBox.height / 2 - (position + list.clientHeight / 2)
    : tabBox.left + tabBox.width / 2 - (position + list.clientWidth / 2);
  const rtl = !vertical && getOwnerWindow(list).getComputedStyle(list).direction === 'rtl';
  const [min, max] = rtl ? [-range, 0] : [0, range];
  const target = clamp(position + delta, min, max);
  const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth';
  if (typeof list.scrollTo === 'function') {
    list.scrollTo(vertical ? { top: target, behavior } : { left: target, behavior });
  } else if (vertical) {
    list.scrollTop = target;
  } else {
    list.scrollLeft = target;
  }
}

/**
 * Whether the list's tabs do not fit, measured after every commit and, once a frame, when the list
 * or a tab resizes, a tab's content changes outside a render of the list, or fonts load.
 */
export function useListOverflow(
  listRef: RefObject<HTMLElement | null>,
  orientation: Orientation,
): boolean {
  const [overflowing, setOverflowing] = useState(false);
  const measure = useCallback(() => {
    const list = listRef.current;
    if (list) setOverflowing(isOverflowing(list, orientation));
  }, [listRef, orientation]);

  // Tabs added, removed or relabelled re-render the list.
  useLayoutEffect(measure);

  useLayoutChanges(listRef, measure);

  return overflowing;
}

/** Scrolls the selected tab toward the middle of an overflowing list, once per selection. */
export function useCenterSelectedTab(
  listRef: RefObject<HTMLElement | null>,
  { orientation, selectedKey }: ListScrollOptions,
): void {
  const latestKey = useRef(selectedKey);
  const centeredKey = useRef<Key | null>(null);
  // Cancels the centering frame, in the window that runs it.
  const frame = useRef<(() => void) | null>(null);

  // Tabs mount after the collection is built, so this checks every commit. Centering waits a frame:
  // the first press into the list moves focus there, and React Aria then restores the list's
  // previous scroll position.
  useEffect(() => {
    latestKey.current = selectedKey;
    if (selectedKey === null || centeredKey.current === selectedKey || frame.current !== null)
      return;
    const view = getOwnerWindow(listRef.current);
    const id = view.requestAnimationFrame(() => {
      frame.current = null;
      const list = listRef.current;
      const tab = list?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
      if (!list || !tab) return;
      centeredKey.current = latestKey.current;
      centerTab(list, tab, orientation);
    });
    frame.current = () => view.cancelAnimationFrame(id);
  });

  useEffect(
    () => () => {
      frame.current?.();
    },
    [],
  );
}
