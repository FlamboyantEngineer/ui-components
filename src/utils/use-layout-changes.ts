'use client';

import { type RefObject, useEffect } from 'react';
import { observeViewport } from './observe-viewport.js';
import { useLatest } from './use-latest.js';

/**
 * Calls `measure` at most once per animation frame whenever the element or one of its children
 * resizes, its content changes anywhere inside it, an image in it loads, or the document's fonts
 * finish loading: the changes that move text metrics without re-rendering the owner.
 */
export function useLayoutChanges(ref: RefObject<HTMLElement | null>, measure: () => void): void {
  const latest = useLatest(measure);
  useEffect(() => {
    const element = ref.current;
    const view = element?.ownerDocument.defaultView;
    if (!element || !view) return undefined;
    const observer = observeViewport(element, view, {
      measure: () => latest.current(),
      subtree: true,
      fonts: true,
    });
    return () => observer.disconnect();
  }, [ref, latest]);
}
