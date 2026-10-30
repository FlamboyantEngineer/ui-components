'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';

/**
 * When overlay scrollbars show: `auto` while an axis overflows, `always` on every scrolling axis
 * even when the content fits, `scroll` while scrolling, `hover` while the pointer is over the region
 * or it scrolls.
 */
export type ScrollRegionScrollbarVisibility = 'auto' | 'always' | 'scroll' | 'hover';

interface ScrollActivity {
  /** From a scroll until the hide delay passes without one. */
  isScrolling: boolean;
  /** A mouse or pen pointer is over the region. */
  isHovering: boolean;
  /** Overlay tracks show, before counting a focused or dragged thumb. */
  isScrollbarVisible: boolean;
  onScroll: () => void;
  onPointerEnter: (event: PointerEvent) => void;
  onPointerLeave: (event: PointerEvent) => void;
}

/** A timer that runs its latest callback once after `delay`, restarting on each start. */
function useRestartingTimer() {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const cancel = useCallback(() => clearTimeout(timer.current), []);
  const start = useCallback(
    (delay: number, callback: () => void) => {
      cancel();
      timer.current = setTimeout(callback, delay);
    },
    [cancel],
  );
  useEffect(() => cancel, [cancel]);
  return useMemo(() => ({ start, cancel }), [start, cancel]);
}

/**
 * Whether the region is scrolling or hovered, and whether its overlay scrollbars show for the
 * visibility mode. Scrolling and a pointer that left keep them shown for `hideDelay` milliseconds.
 */
export function useScrollActivity(
  visibility: ScrollRegionScrollbarVisibility,
  hideDelay: number,
): ScrollActivity {
  const [isScrolling, setScrolling] = useState(false);
  const [isHovering, setHovering] = useState(false);
  const [isLingering, setLingering] = useState(false);
  const scrollTimer = useRestartingTimer();
  const leaveTimer = useRestartingTimer();

  const onScroll = useCallback(() => {
    setScrolling(true);
    scrollTimer.start(hideDelay, () => setScrolling(false));
  }, [hideDelay, scrollTimer]);
  const onPointerEnter = useCallback(
    (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      leaveTimer.cancel();
      setHovering(true);
      setLingering(false);
    },
    [leaveTimer],
  );
  const onPointerLeave = useCallback(
    (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      setHovering(false);
      setLingering(true);
      leaveTimer.start(hideDelay, () => setLingering(false));
    },
    [hideDelay, leaveTimer],
  );

  const isScrollbarVisible =
    visibility === 'scroll'
      ? isScrolling
      : visibility === 'hover'
        ? isHovering || isLingering || isScrolling
        : true;
  return { isScrolling, isHovering, isScrollbarVisible, onScroll, onPointerEnter, onPointerLeave };
}
