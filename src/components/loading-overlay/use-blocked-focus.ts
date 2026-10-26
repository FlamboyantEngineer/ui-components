// Keyboard focus around content that turns inert while its region loads.

import { useLayoutEffect, useRef, type RefObject } from 'react';

interface BlockedFocusOptions {
  /** The region's root, which holds focus while the content is blocked. */
  rootRef: RefObject<HTMLElement | null>;
  /** The content that turns inert. */
  contentRef: RefObject<HTMLElement | null>;
  isBlocked: boolean;
}

/**
 * Keeps keyboard focus in place while the content is inert, where browsers would drop it to the
 * document body: focus inside the content moves to the root as blocking starts, and returns to the
 * element that had it once blocking ends, unless the reader has moved focus elsewhere meanwhile.
 */
export function useBlockedFocus({ rootRef, contentRef, isBlocked }: BlockedFocusOptions) {
  const returnTo = useRef<HTMLElement | null>(null);
  // A layout effect runs before the browser moves focus out of the newly inert content.
  useLayoutEffect(() => {
    const root = rootRef.current;
    const content = contentRef.current;
    if (!root || !content) return;
    const active = root.ownerDocument.activeElement as HTMLElement | null;
    if (isBlocked) {
      if (active && content.contains(active)) {
        returnTo.current = active;
        root.focus({ preventScroll: true });
      }
      return;
    }
    const target = returnTo.current;
    returnTo.current = null;
    if (target?.isConnected && (active === root || active === root.ownerDocument.body)) {
      target.focus({ preventScroll: true });
    }
  }, [rootRef, contentRef, isBlocked]);
}
