'use client';

import { type RefObject, useEffect, useLayoutEffect, useRef } from 'react';
import { containsComposed, getDeepActiveElement } from '../../utils/composed-focus.js';
import { isHTMLElement } from '../../utils/is-element.js';
import { getOwnerDocument } from '../../utils/owner-window.js';
import { usePortalContainer } from '../portal/portal.js';

/**
 * Hands focus back to where it was before the palette opened as soon as it closes, rather than
 * once its exit animation ends and React Aria unmounts it: the reader keeps typing on the page
 * while the palette fades. The leaving overlay turns `inert`, so its focus containment cannot pull
 * focus back and nothing in it takes a press or a key; reopening it during the fade lifts that.
 * Focus moves only when it is still in the leaving palette (or lost to the body), and only to an
 * element still in the document; otherwise React Aria's own return stands.
 */
export function useReturnFocusOnClose(isOpen: boolean, overlayRef: RefObject<HTMLElement | null>) {
  const returnTo = useRef<HTMLElement | null>(null);
  // The palette's document is its portal container's, which may be another window's, and the
  // overlay is not there yet while the palette is closed.
  const container = usePortalContainer();
  useEffect(() => {
    const owner = getOwnerDocument(container);
    const remember = (event: FocusEvent) => {
      const target = event.composedPath()[0];
      if (!isHTMLElement(target)) return;
      if (overlayRef.current && containsComposed(overlayRef.current, target)) return;
      returnTo.current = target;
    };
    owner.addEventListener('focusin', remember, true);
    return () => owner.removeEventListener('focusin', remember, true);
  }, [container, overlayRef]);
  const wasOpen = useRef(isOpen);
  useLayoutEffect(() => {
    const closed = wasOpen.current && !isOpen;
    wasOpen.current = isOpen;
    const overlay = overlayRef.current;
    if (!overlay) return undefined;
    if (isOpen) overlay.inert = false;
    if (!closed) return undefined;
    // React Aria lifts the palette's focus containment once it marks the overlay as leaving, a
    // render after this one; hand focus back on the next frame, when that has happened.
    const owner = getOwnerDocument(overlay);
    const view = owner.defaultView;
    const frame = view?.requestAnimationFrame(() => {
      if (!overlay.isConnected) return;
      overlay.inert = true;
      const target = returnTo.current;
      const active = getDeepActiveElement(owner);
      const isInPalette = !active || active === owner.body || containsComposed(overlay, active);
      if (target?.isConnected && isInPalette) target.focus({ preventScroll: true });
    });
    return () => {
      if (frame !== undefined) view?.cancelAnimationFrame(frame);
    };
  }, [isOpen, overlayRef]);
}
