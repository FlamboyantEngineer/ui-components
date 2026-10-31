'use client';

import { useCallback, useRef } from 'react';
import { useLatest } from './use-latest.js';

/** How long after a request focus may still come back to the overlay's trigger, in milliseconds. */
const handbackWindow = 1000;

export interface FocusHandback {
  /** Asks for the hand-back the next time the trigger gets focus back, shortly after. */
  request: () => void;
  /** For the trigger, or an element around it. */
  ref: (element: HTMLElement | null) => (() => void) | undefined;
}

/**
 * Hands focus on to an editor after a choice in a menu, select or popover. Those overlays keep
 * focus inside while open and give it back to their trigger once they close, so after `request`
 * `focus` runs when the trigger (or the element under `ref`) gets focus back shortly after.
 */
export function useFocusHandback(focus: () => void): FocusHandback {
  const requestedAt = useRef(0);
  const latestFocus = useLatest(focus);
  const ref = useCallback(
    (element: HTMLElement | null) => {
      if (!element) return undefined;
      const onFocus = () => {
        if (Date.now() - requestedAt.current > handbackWindow) return;
        requestedAt.current = 0;
        latestFocus.current();
      };
      element.addEventListener('focusin', onFocus);
      return () => element.removeEventListener('focusin', onFocus);
    },
    [latestFocus],
  );
  const request = useCallback(() => {
    requestedAt.current = Date.now();
  }, []);
  return { request, ref };
}
