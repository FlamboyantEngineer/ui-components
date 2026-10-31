'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { isShallowEqual } from '../../utils/is-shallow-equal.js';
import { useLatest } from '../../utils/use-latest.js';
import type { SharedViewportObserver } from './use-shared-viewport-observer.js';

/** How far the content reaches past each edge of the viewport, in whole pixels. */
export interface ScrollEdges {
  /** Scrolled past the top. */
  yStart: number;
  /** Left below the bottom. */
  yEnd: number;
  /** Scrolled past the inline start (the left edge, or the right edge right to left). */
  xStart: number;
  /** Left beyond the inline end. */
  xEnd: number;
}

interface ScrollEdgesOptions {
  /** Measure at all; a region that scrolls on no axis has no edges. */
  enabled: boolean;
  /** Keep the viewport at the bottom while the reader is there. */
  stickToBottom: boolean;
  /** Called when scrolling reaches the top. */
  onTopReached?: (() => void) | undefined;
  /** Called when scrolling reaches the bottom. */
  onBottomReached?: (() => void) | undefined;
}

const noEdges: ScrollEdges = { yStart: 0, yEnd: 0, xStart: 0, xEnd: 0 };

/** The distances from the viewport's edges to the content's, in whole pixels. */
export function readScrollEdges(element: HTMLElement): ScrollEdges {
  const rtl = element.ownerDocument.defaultView?.getComputedStyle(element).direction === 'rtl';
  const rangeX = Math.max(0, element.scrollWidth - element.clientWidth);
  // Right-to-left positions run from 0 down to the negative range; measure from the left.
  const fromLeft = rtl ? rangeX + element.scrollLeft : element.scrollLeft;
  const toRight = rangeX - fromLeft;
  const distance = (value: number) => Math.max(0, Math.round(value));
  return {
    yStart: distance(element.scrollTop),
    yEnd: distance(element.scrollHeight - element.clientHeight - element.scrollTop),
    xStart: distance(rtl ? toRight : fromLeft),
    xEnd: distance(rtl ? fromLeft : toRight),
  };
}

/**
 * The viewport's edge distances, read when it scrolls, resizes or its children change (without
 * waiting for an animation frame), and once a frame when content deeper inside changes, through the
 * region's shared observer. Scrolling to the top or bottom calls the edge callbacks; with `stickToBottom` a viewport scrolled to the bottom follows
 * new content until the reader scrolls up.
 */
export function useScrollEdges(
  viewportRef: RefObject<HTMLDivElement | null>,
  observer: SharedViewportObserver,
  { enabled, stickToBottom, onTopReached, onBottomReached }: ScrollEdgesOptions,
): { edges: ScrollEdges; onScroll: () => void } {
  const [edges, setEdges] = useState(noEdges);
  const previous = useRef(noEdges);
  const isPinned = useRef(true);
  const lastRange = useRef(0);
  const latestRef = useLatest({ stickToBottom, onTopReached, onBottomReached });

  const read = useCallback(
    (fromScroll: boolean) => {
      const element = viewportRef.current;
      if (!element) return;
      // A scroll that comes with a new extent is the browser's (scroll anchoring or clamping on a
      // content change), not the reader's, so it keeps the reader's pin.
      const range = element.scrollHeight - element.clientHeight;
      const isReader = fromScroll && range === lastRange.current;
      lastRange.current = range;
      if (!isReader && latestRef.current.stickToBottom && isPinned.current)
        element.scrollTop = element.scrollHeight;
      const next = readScrollEdges(element);
      const before = previous.current;
      previous.current = next;
      if (isReader) isPinned.current = next.yEnd <= 1;
      if (fromScroll) {
        if (before.yStart > 0 && next.yStart === 0) latestRef.current.onTopReached?.();
        if (before.yEnd > 0 && next.yEnd === 0) latestRef.current.onBottomReached?.();
      }
      setEdges((current) => (isShallowEqual(current, next) ? current : next));
    },
    [viewportRef, latestRef],
  );

  useEffect(() => {
    if (!enabled) return undefined;
    return observer.subscribe(() => read(false));
  }, [enabled, observer, read]);

  const onScroll = useCallback(() => read(true), [read]);
  return { edges: enabled ? edges : noEdges, onScroll };
}
