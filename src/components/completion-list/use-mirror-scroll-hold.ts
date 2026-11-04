'use client';

import { type RefObject, useCallback, useLayoutEffect, useRef } from 'react';
import { getComposedActiveElement } from '../../utils/composed-focus.js';
import { getOwnerWindow } from '../../utils/owner-window.js';

/**
 * Keeps a list open while a mirror layer of its control scrolls. An editor that draws its text in
 * a layer under the focused control, such as a highlighted copy under a text area, scrolls that
 * layer with the control and places the list on a caret marker inside it. React Aria closes a
 * non-modal popover when an element holding its anchor scrolls; a layer holding the anchor but not
 * the focused control is such a mirror, so its scroll moves the list instead of closing it.
 *
 * Returns whether a close request comes from such a scroll. The listener runs before React Aria's,
 * which a popover registers on the same window after layout.
 */
export function useMirrorScrollHold(anchorRef: RefObject<Element | null>, isOpen: boolean) {
  const isHolding = useRef(false);
  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!isOpen || !anchor) return undefined;
    const owner = getOwnerWindow(anchor);
    let release: number | undefined;
    const onScroll = (event: Event) => {
      const target = event.composedPath()[0];
      if (!(target instanceof owner.Node) || !target.contains(anchor)) return;
      const focused = getComposedActiveElement(anchor);
      if (!focused || target.contains(focused)) return;
      isHolding.current = true;
      // The hold lasts for this scroll's listeners only.
      owner.clearTimeout(release);
      release = owner.setTimeout(() => {
        isHolding.current = false;
      });
    };
    owner.addEventListener('scroll', onScroll, true);
    return () => {
      owner.removeEventListener('scroll', onScroll, true);
      owner.clearTimeout(release);
      isHolding.current = false;
    };
  }, [anchorRef, isOpen]);
  return useCallback(() => isHolding.current, []);
}
