'use client';

import { useEffect, useLayoutEffect, useState, type RefObject } from 'react';
import { autoUpdateOverlay } from './overlay-auto-update.js';

export interface FollowAnchorOptions {
  /** The element the overlay is placed against. */
  anchorRef: RefObject<Element | null>;
  /** Whether the overlay is open; a closed one follows nothing. */
  isOpen: boolean;
  /** Where the overlay points when it is not the anchor's box, such as a point; a new value places it again. */
  target?: unknown;
}

/**
 * Keeps an open React Aria overlay on its anchor as the page moves under it: any scroll in the
 * anchor's document, a resize of its window, a change of the anchor's size or a new `target`.
 * Returns the overlay's `shouldUpdatePosition`. React Aria places an open overlay again only when
 * one of its position inputs changes, so each move turns it off for one render and back on, which
 * makes React Aria measure afresh without closing or redrawing the overlay.
 */
export function useFollowAnchor({ anchorRef, isOpen, target }: FollowAnchorOptions): boolean {
  const [isPaused, setPaused] = useState(false);
  // Boxed, since a target may be a function, which state would call.
  const [last, setLast] = useState({ target });
  if (!Object.is(last.target, target)) {
    setLast({ target });
    if (isOpen) setPaused(true);
  }
  // A parent layout update can replace the target while the prior commit is already paused.
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- The paused render must commit so React Aria measures afresh before resuming.
    if (isPaused) setPaused(false);
  }, [isPaused, target]);
  useEffect(() => {
    const anchor = anchorRef.current;
    if (!isOpen || !anchor) return undefined;
    let isStarting = true;
    const stop = autoUpdateOverlay({
      anchor,
      update: () => {
        // React Aria already placed the overlay as it opened.
        if (!isStarting) setPaused(true);
      },
    });
    isStarting = false;
    return stop;
  }, [anchorRef, isOpen]);
  return !isPaused;
}
