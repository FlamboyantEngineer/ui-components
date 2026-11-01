'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
  type RefObject,
} from 'react';
import type { Orientation } from '../core/props.js';
import { useResizeObserver } from './use-resize-observer.js';
import { isElement } from './is-element.js';

/** Whether content is hidden past each edge of a scrolling strip, including a partly visible item. */
export interface ScrollStripOverflow {
  start: boolean;
  end: boolean;
}

export interface ScrollStripOptions {
  /** The strip's scrolling axis. A horizontal strip also scrolls with the vertical wheel. */
  orientation?: Orientation | undefined;
  /** Called after wheel input scrolled the strip. */
  onWheelScroll?: (() => void) | undefined;
}

export interface ScrollStripState {
  overflow: ScrollStripOverflow;
  /** Schedules a fresh measurement; call it from the strip's scroll handler and after content changes. */
  syncOverflow: () => void;
}

/** Fraction of the visible width a page scroll moves a strip. */
const pageFraction = 0.8;

// Popups opened inside a strip scroll themselves, so their wheel input is left alone.
const popupSelector = '[role="menu"], [role="listbox"], [role="dialog"]';
const wheelLineHeight = 16;

function getFrameApi(element: Element | null) {
  const view = element?.ownerDocument.defaultView ?? window;
  return {
    request: (callback: FrameRequestCallback) => view.requestAnimationFrame(callback),
    cancel: (id: number) => view.cancelAnimationFrame(id),
  };
}

function isRtl(element: Element): boolean {
  const view = element.ownerDocument.defaultView;
  return view ? view.getComputedStyle(element).direction === 'rtl' : false;
}

/** Whether wheel input reached the strip itself rather than a modified wheel or a popup inside it. */
function isStripWheel(strip: HTMLElement, event: WheelEvent): boolean {
  if (event.ctrlKey || event.metaKey) return false;
  const path = event.composedPath();
  const index = path.indexOf(strip);
  if (index < 0) return false;
  return !path.slice(0, index).some((node) => isElement(node) && node.matches(popupSelector));
}

/**
 * What wheel input does to the strip along its dominant axis: `null` when the strip has no wheel
 * travel to own (no delta, or nothing overflows), else the clamped next scroll position, which is
 * the current one at the bound the wheel pushes toward.
 */
function resolveWheelScrollPosition(strip: HTMLElement, event: WheelEvent): number | null {
  const isHorizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
  const delta = isHorizontal ? event.deltaX : event.deltaY;
  const range = Math.max(0, strip.scrollWidth - strip.clientWidth);
  if (delta === 0 || range === 0) return null;
  const unit =
    event.deltaMode === 1 ? wheelLineHeight : event.deltaMode === 2 ? strip.clientWidth : 1;
  // Right-to-left scroll positions run from 0 down to -range. Horizontal travel is physical and
  // keeps its sign; vertical travel means "toward the inline end", which is leftward there.
  const rtl = isRtl(strip);
  const offset = (rtl && !isHorizontal ? -delta : delta) * unit;
  return Math.min(rtl ? 0 : range, Math.max(rtl ? -range : 0, strip.scrollLeft + offset));
}

type StripAttachment = (strip: HTMLElement) => () => void;

/**
 * Attaches `attach` to the strip element and detaches it when the element or `attach` changes,
 * checking after every commit like `useResizeObserver`, so a strip that mounts after the first
 * render, or is replaced, is attached too. `attach` should keep its identity between renders.
 */
function useStripAttachment(
  stripRef: RefObject<HTMLElement | null>,
  attach: StripAttachment | null,
): void {
  const attached = useRef<{ strip: HTMLElement; attach: StripAttachment; detach: () => void }>(
    null,
  );
  useLayoutEffect(() => {
    const strip = stripRef.current;
    const current = attached.current;
    if (current?.strip === strip && current.attach === attach) return;
    current?.detach();
    attached.current = strip && attach ? { strip, attach, detach: attach(strip) } : null;
  });
  useLayoutEffect(
    () => () => {
      attached.current?.detach();
      attached.current = null;
    },
    [],
  );
}

/**
 * Lets the vertical wheel scroll a horizontal strip. An overflowing strip owns the wheel under the
 * pointer, at its bounds too, so the page never scrolls behind it; a strip that fits leaves it.
 */
function useWheelScrolling(
  stripRef: RefObject<HTMLElement | null>,
  horizontal: boolean,
  onWheelScroll: (() => void) | undefined,
): void {
  const onWheelScrollRef = useRef(onWheelScroll);
  useEffect(() => {
    onWheelScrollRef.current = onWheelScroll;
  }, [onWheelScroll]);

  const attach = useCallback((strip: HTMLElement) => {
    const onWheel = (event: WheelEvent) => {
      if (!isStripWheel(strip, event)) return;
      const next = resolveWheelScrollPosition(strip, event);
      if (next === null) return;
      event.preventDefault();
      if (next === strip.scrollLeft) return;
      strip.scrollLeft = next;
      onWheelScrollRef.current?.();
    };
    strip.addEventListener('wheel', onWheel, { capture: true, passive: false });
    return () => strip.removeEventListener('wheel', onWheel, { capture: true });
  }, []);
  useStripAttachment(stripRef, horizontal ? attach : null);
}

/**
 * Scrolls a strip to a physical `scrollLeft`. `auto` follows the stylesheet's `scroll-behavior`;
 * `instant` skips any smooth scrolling, for focus that must land at once.
 */
export function scrollStripTo(strip: HTMLElement, left: number, behavior: ScrollBehavior): void {
  if (typeof strip.scrollTo === 'function') strip.scrollTo({ left, behavior });
  else strip.scrollLeft = left;
}

/**
 * Scrolls a horizontal strip by most of its visible width toward its `start` or `end` edge, as a
 * scroll button does. Right-to-left strips (`rtl`, from the locale) scroll with negative offsets.
 */
export function scrollStripPage(
  strip: HTMLElement,
  { edge, rtl }: { edge: 'start' | 'end'; rtl: boolean },
): void {
  const step = Math.max(1, strip.clientWidth * pageFraction);
  const range = Math.max(0, strip.scrollWidth - strip.clientWidth);
  const position = Math.abs(strip.scrollLeft) + (edge === 'end' ? step : -step);
  const next = Math.min(range, Math.max(0, position));
  scrollStripTo(strip, rtl ? -next : next, 'auto');
}

/**
 * Tracks whether a scrolling strip (a row of tabs or tools) hides content past either edge, so the
 * stylesheet can draw a fade there, and lets the vertical wheel scroll a horizontal strip, which keeps
 * the wheel from the page while it overflows, at its bounds too. Scrolling
 * stays free: no snapping, paging or stepper buttons. Measurements coalesce to one read per animation
 * frame and resync when the strip or its children resize and when children mount or unmount. A strip
 * that mounts after the first render, or is replaced, is followed too. Right-to-left strips report
 * and scroll from their inline start.
 */
export function useScrollStripOverflow(
  stripRef: RefObject<HTMLElement | null>,
  { orientation = 'horizontal', onWheelScroll }: ScrollStripOptions = {},
): ScrollStripState {
  const horizontal = orientation === 'horizontal';
  useWheelScrolling(stripRef, horizontal, onWheelScroll);
  const [overflow, setOverflow] = useState<ScrollStripOverflow>({ start: false, end: false });
  const pending = useRef<{ id: number; cancel: (id: number) => void } | null>(null);

  const syncOverflow = useCallback(() => {
    if (pending.current) return;
    const frames = getFrameApi(stripRef.current);
    const id = frames.request(() => {
      pending.current = null;
      const strip = stripRef.current;
      if (!strip) return;
      const position = Math.abs(horizontal ? strip.scrollLeft : strip.scrollTop);
      const visible = horizontal ? strip.clientWidth : strip.clientHeight;
      const total = horizontal ? strip.scrollWidth : strip.scrollHeight;
      const start = position > 1;
      const end = position + visible < total - 1;
      setOverflow((current) =>
        current.start === start && current.end === end ? current : { start, end },
      );
    });
    pending.current = { id, cancel: frames.cancel };
  }, [horizontal, stripRef]);

  useEffect(() => {
    syncOverflow();
    return () => {
      if (pending.current) pending.current.cancel(pending.current.id);
      pending.current = null;
    };
  }, [syncOverflow]);

  const [, refreshTargets] = useReducer((generation: number) => generation + 1, 0);
  useResizeObserver(() => {
    const strip = stripRef.current;
    return strip ? [strip, ...Array.from(strip.children)] : [];
  }, syncOverflow);

  const observeChildren = useCallback(
    (strip: HTMLElement) => {
      const Observer = strip.ownerDocument.defaultView?.MutationObserver;
      // A strip that mounts late is measured as it arrives.
      syncOverflow();
      if (!Observer) return () => undefined;
      // A new child can be wider than the space it fills without resizing the strip itself.
      const mutations = new Observer(() => {
        refreshTargets();
        syncOverflow();
      });
      mutations.observe(strip, { childList: true });
      return () => mutations.disconnect();
    },
    [syncOverflow],
  );
  useStripAttachment(stripRef, observeChildren);

  return { overflow, syncOverflow };
}
