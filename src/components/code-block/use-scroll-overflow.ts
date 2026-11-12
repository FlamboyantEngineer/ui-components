'use client';

import { type RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { isOverflowing } from '../../utils/is-overflowing.js';
import { listenFontsLoaded } from '../../utils/listen-fonts-loaded.js';
import { useResizeObserver } from '../../utils/use-resize-observer.js';

/** Content changes that can widen or lengthen the text without resizing the element: nodes, text, classes, styles. */
const contentChanges: MutationObserverInit = {
  childList: true,
  subtree: true,
  characterData: true,
  attributeFilter: ['class', 'style'],
};

/** Whether the element's window reports resizes, and so reports a newly watched element once. */
function reportsResizes(element: HTMLElement | null): boolean {
  return typeof element?.ownerDocument.defaultView?.ResizeObserver === 'function';
}

/**
 * Whether the element's content is wider or taller than its box, so it scrolls, measured after each render, whenever the
 * element resizes, whenever its content changes outside React (such as asynchronous highlighting),
 * and whenever the document's fonts finish loading, which changes text metrics in a box of fixed
 * size. The first render leaves its measurement to the resize observer, which reports a new element
 * before the frame paints: a page that mounts many blocks at once is then laid out once for all of
 * them, not once for each.
 */
export function useScrollOverflow(ref: RefObject<HTMLElement | null>): boolean {
  const [overflowing, setOverflowing] = useState(false);
  const measure = useCallback(() => {
    const element = ref.current;
    if (element) {
      setOverflowing(isOverflowing(element, 'horizontal') || isOverflowing(element, 'vertical'));
    }
  }, [ref]);
  const isFirstRender = useRef(true);
  useResizeObserver([ref], measure);
  // An unchanged result sets the same state, which React skips, so measuring every render settles.
  useLayoutEffect(() => {
    const isFirst = isFirstRender.current;
    isFirstRender.current = false;
    if (!isFirst || !reportsResizes(ref.current)) measure();
  });
  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const observer = new MutationObserver(measure);
    observer.observe(element, contentChanges);
    const stopFonts = listenFontsLoaded(element, measure);
    return () => {
      observer.disconnect();
      stopFonts();
    };
  }, [ref, measure]);
  return overflowing;
}
