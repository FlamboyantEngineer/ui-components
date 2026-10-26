import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';

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

export interface ScrollEdgesOptions {
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

function isSameEdges(left: ScrollEdges, right: ScrollEdges): boolean {
  return (Object.keys(left) as Array<keyof ScrollEdges>).every((key) => left[key] === right[key]);
}

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
 * waiting for an animation frame, so scrolling and resizing schedule none). Scrolling to the top or
 * bottom calls the edge callbacks; with `stickToBottom` a viewport scrolled to the bottom follows
 * new content until the reader scrolls up.
 */
export function useScrollEdges(
  viewport: RefObject<HTMLDivElement | null>,
  { enabled, stickToBottom, onTopReached, onBottomReached }: ScrollEdgesOptions,
): { edges: ScrollEdges; onScroll: () => void } {
  const [edges, setEdges] = useState(noEdges);
  const previous = useRef(noEdges);
  const isPinned = useRef(true);
  const latest = useRef({ stickToBottom, onTopReached, onBottomReached });
  useLayoutEffect(() => {
    latest.current = { stickToBottom, onTopReached, onBottomReached };
  });

  const read = useCallback(
    (fromScroll: boolean) => {
      const element = viewport.current;
      if (!element) return;
      const next = readScrollEdges(element);
      const before = previous.current;
      previous.current = next;
      if (fromScroll) {
        isPinned.current = next.yEnd <= 1;
        if (before.yStart > 0 && next.yStart === 0) latest.current.onTopReached?.();
        if (before.yEnd > 0 && next.yEnd === 0) latest.current.onBottomReached?.();
      }
      setEdges((current) => (isSameEdges(current, next) ? current : next));
    },
    [viewport],
  );

  useEffect(() => {
    const element = viewport.current;
    const view = element?.ownerDocument.defaultView;
    if (!enabled || !element || !view) return undefined;
    const onChange = () => {
      if (latest.current.stickToBottom && isPinned.current)
        element.scrollTop = element.scrollHeight;
      read(false);
    };
    const resize =
      typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(onChange) : null;
    const observeChildren = () => {
      resize?.disconnect();
      for (const target of [element, ...element.children]) resize?.observe(target);
    };
    const mutations = new view.MutationObserver(() => {
      observeChildren();
      onChange();
    });
    mutations.observe(element, { childList: true });
    observeChildren();
    onChange();
    return () => {
      resize?.disconnect();
      mutations.disconnect();
    };
  }, [enabled, read, viewport]);

  const onScroll = useCallback(() => read(true), [read]);
  return { edges: enabled ? edges : noEdges, onScroll };
}
