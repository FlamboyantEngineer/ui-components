import { useCallback, useEffect, useReducer, useRef, useState, type RefObject } from 'react';
import { useResizeObserver } from './use-resize-observer.js';

/** Whether content is hidden past each edge of a scrolling strip, including a partly visible item. */
export interface ScrollStripOverflow {
  start: boolean;
  end: boolean;
}

export interface ScrollStripOptions {
  /** The strip's scrolling axis. A horizontal strip also scrolls with the vertical wheel. */
  orientation?: 'horizontal' | 'vertical' | undefined;
  /** Called after wheel input scrolled the strip. */
  onWheelScroll?: (() => void) | undefined;
}

export interface ScrollStripState {
  overflow: ScrollStripOverflow;
  /** Schedules a fresh measurement; call it from the strip's scroll handler and after content changes. */
  syncOverflow: () => void;
}

// Popups opened inside a strip scroll themselves, so their wheel input is left alone.
const POPUP_SELECTOR = '[role="menu"], [role="listbox"], [role="dialog"]';
const LINE_HEIGHT = 16;

function frameApi(element: Element | null) {
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

/**
 * Tracks whether a scrolling strip (a row of tabs or tools) hides content past either edge, so the
 * stylesheet can draw a fade there, and lets the vertical wheel scroll a horizontal strip. Scrolling
 * stays free: no snapping, paging or stepper buttons. Measurements coalesce to one read per animation
 * frame and resync when the strip or its children resize and when children mount or unmount. Right-to-
 * left strips report and scroll from their inline start.
 */
export function useScrollStripOverflow(
  stripRef: RefObject<HTMLElement | null>,
  { orientation = 'horizontal', onWheelScroll }: ScrollStripOptions = {},
): ScrollStripState {
  const horizontal = orientation === 'horizontal';
  const onWheelScrollRef = useRef(onWheelScroll);
  useEffect(() => {
    onWheelScrollRef.current = onWheelScroll;
  }, [onWheelScroll]);

  const [overflow, setOverflow] = useState<ScrollStripOverflow>({ start: false, end: false });
  const pending = useRef<{ id: number; cancel: (id: number) => void } | null>(null);

  const syncOverflow = useCallback(() => {
    if (pending.current) return;
    const frames = frameApi(stripRef.current);
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

  useEffect(() => {
    const strip = stripRef.current;
    const Observer = strip?.ownerDocument.defaultView?.MutationObserver;
    if (!strip || !Observer) return undefined;
    // A new child can be wider than the space it fills without resizing the strip itself.
    const mutations = new Observer(() => {
      refreshTargets();
      syncOverflow();
    });
    mutations.observe(strip, { childList: true });
    return () => mutations.disconnect();
  }, [stripRef, syncOverflow]);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip || !horizontal) return undefined;
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) return;
      const path = event.composedPath();
      const index = path.indexOf(strip);
      if (index < 0) return;
      const insidePopup = path
        .slice(0, index)
        .some((node) => node instanceof Element && node.matches(POPUP_SELECTOR));
      if (insidePopup) return;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (delta === 0) return;
      const range = Math.max(0, strip.scrollWidth - strip.clientWidth);
      if (range === 0) return;
      const unit =
        event.deltaMode === 1 ? LINE_HEIGHT : event.deltaMode === 2 ? strip.clientWidth : 1;
      // Right-to-left scroll positions run from 0 down to -range.
      const rtl = isRtl(strip);
      const offset = (rtl ? -delta : delta) * unit;
      const next = Math.min(rtl ? 0 : range, Math.max(rtl ? -range : 0, strip.scrollLeft + offset));
      if (next === strip.scrollLeft) return;
      event.preventDefault();
      strip.scrollLeft = next;
      onWheelScrollRef.current?.();
    };
    strip.addEventListener('wheel', onWheel, { capture: true, passive: false });
    return () => strip.removeEventListener('wheel', onWheel, { capture: true });
  }, [horizontal, stripRef]);

  return { overflow, syncOverflow };
}
