import { useCallback, useRef } from 'react';
import type { RichTextController } from './rich-text-controller.js';

/** How long after a command focus may still come back to the overlay's trigger, in milliseconds. */
const RETURN_WINDOW = 1000;

/**
 * Sends focus back to the document after a command chosen in a menu, select or popover. Those
 * overlays keep focus inside while open and give it back to their trigger once they close, so after
 * `request` the document takes focus when the trigger gets it back shortly after: pass `ref` to the trigger or
 * to an element around it.
 */
export function useFocusReturn(controller: RichTextController) {
  const requestedAt = useRef(0);
  const { focus } = controller;
  const onFocus = useCallback(() => {
    if (Date.now() - requestedAt.current > RETURN_WINDOW) return;
    requestedAt.current = 0;
    focus();
  }, [focus]);
  const ref = useCallback(
    (element: HTMLElement | null) => {
      element?.addEventListener('focusin', onFocus);
      return () => element?.removeEventListener('focusin', onFocus);
    },
    [onFocus],
  );
  const request = useCallback(() => {
    requestedAt.current = Date.now();
  }, []);
  return { request, ref };
}
