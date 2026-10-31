'use client';

import { useCallback, useEffect, useLayoutEffect, useState, type RefObject } from 'react';
import { isOverflowing } from '../../utils/is-overflowing.js';
import { useResizeObserver } from '../../utils/use-resize-observer.js';

/** Content changes that can widen the text without resizing the element: nodes, text, classes, styles. */
const contentChanges: MutationObserverInit = {
  childList: true,
  subtree: true,
  characterData: true,
  attributeFilter: ['class', 'style'],
};

/**
 * Whether the element's content is wider than its box, measured after each render, whenever the
 * element resizes, whenever its content changes outside React (such as asynchronous highlighting),
 * and whenever the document's fonts finish loading, which changes text metrics in a box of fixed
 * size.
 */
export function useHorizontalOverflow(ref: RefObject<HTMLElement | null>): boolean {
  const [overflowing, setOverflowing] = useState(false);
  const measure = useCallback(() => {
    const element = ref.current;
    if (element) setOverflowing(isOverflowing(element, 'horizontal'));
  }, [ref]);
  useResizeObserver([ref], measure);
  // An unchanged result sets the same state, which React skips, so measuring every render settles.
  useLayoutEffect(() => {
    measure();
  });
  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const observer = new MutationObserver(measure);
    observer.observe(element, contentChanges);
    const fonts = element.ownerDocument.fonts as FontFaceSet | undefined;
    fonts?.addEventListener('loadingdone', measure);
    return () => {
      observer.disconnect();
      fonts?.removeEventListener('loadingdone', measure);
    };
  }, [ref, measure]);
  return overflowing;
}
