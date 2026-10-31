'use client';

// Keyboard focus around content that turns inert while its region loads.

import { useLayoutEffect, useRef, type RefObject } from 'react';
import { containsComposed, getComposedActiveElement } from '../../utils/focus-target.js';

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
 * Focus is read in the region's own tree and followed into shadow roots, so a region in a shadow
 * root, or an element inside a shadow host in the content, is found and returned to.
 */
export function useBlockedFocus({ rootRef, contentRef, isBlocked }: BlockedFocusOptions) {
  const returnTo = useRef<HTMLElement | null>(null);
  // A layout effect runs before the browser moves focus out of the newly inert content.
  useLayoutEffect(() => {
    const root = rootRef.current;
    const content = contentRef.current;
    if (!root || !content) return;
    const active = getComposedActiveElement(root) as HTMLElement | null;
    if (isBlocked) {
      if (active && containsComposed(content, active)) {
        returnTo.current = active;
        root.focus({ preventScroll: true });
      }
      return;
    }
    const target = returnTo.current;
    returnTo.current = null;
    // Focus is lost when nothing in the whole document holds it, wherever the region lives.
    const { activeElement: pageActive, body } = root.ownerDocument;
    const isLost = !pageActive || pageActive === body;
    if (target?.isConnected && (active === root || isLost)) {
      target.focus({ preventScroll: true });
    }
  }, [rootRef, contentRef, isBlocked]);
}
