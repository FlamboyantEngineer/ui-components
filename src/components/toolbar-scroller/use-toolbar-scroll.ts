'use client';

import { useMemo, useRef, type FocusEvent } from 'react';
import { useLocale } from '../../primitives/index.js';
import {
  scrollStripPage,
  scrollStripTo,
  useScrollStripOverflow,
} from '../../utils/use-scroll-strip-overflow.js';

type Edge = 'start' | 'end';

/** How far the visible overlays (scroll buttons, fades) cover each side of the strip, in pixels. */
function measureCoveredInsets(strip: HTMLElement, overlays: readonly Element[]) {
  const box = strip.getBoundingClientRect();
  let left = 0;
  let right = 0;
  for (const overlay of overlays) {
    if (!(overlay instanceof HTMLElement) || overlay.hidden) continue;
    const rect = overlay.getBoundingClientRect();
    const overlap = Math.min(rect.right, box.right) - Math.max(rect.left, box.left);
    if (rect.width === 0 || overlap <= 0) continue;
    if (rect.left + rect.right < box.left + box.right) left = Math.max(left, rect.right - box.left);
    else right = Math.max(right, box.right - rect.left);
  }
  return { left, right };
}

/** Scrolls the strip so a focused tool lies clear of the overlays beside the strip that cover it. */
function revealTool(strip: HTMLElement, tool: Element) {
  const overlays = Array.from(strip.parentElement?.children ?? []).filter((node) => node !== strip);
  const insets = measureCoveredInsets(strip, overlays);
  const box = strip.getBoundingClientRect();
  const item = tool.getBoundingClientRect();
  const visibleLeft = box.left + insets.left;
  const visibleRight = box.right - insets.right;
  let delta = 0;
  if (item.left < visibleLeft) delta = item.left - visibleLeft;
  else if (item.right > visibleRight) delta = item.right - visibleRight;
  if (delta !== 0) scrollStripTo(strip, strip.scrollLeft + delta, 'instant');
}

/**
 * A horizontal strip of tools that scrolls between edge controls drawn beside it: the strip's ref,
 * which edges hide tools, paging toward an edge, and a focus handler for the strip's parent that
 * scrolls a focused tool clear of those controls. With `isActive` false the strip is left alone.
 */
export function useToolbarScroll(isActive = true) {
  const rtl = useLocale().direction === 'rtl';
  const stripRef = useRef<HTMLDivElement | null>(null);
  // The overflow tracking sees the strip only while active, so an inactive strip gets no listeners.
  const activeRef = useMemo(
    () => ({
      get current() {
        return isActive ? stripRef.current : null;
      },
    }),
    [isActive],
  );
  const { overflow: edges, syncOverflow } = useScrollStripOverflow(activeRef);
  const pageToward = (edge: Edge) => {
    if (!stripRef.current) return;
    scrollStripPage(stripRef.current, { edge, rtl });
    syncOverflow();
  };
  const onFocus = (event: FocusEvent<HTMLElement>) => {
    const strip = stripRef.current;
    if (isActive && strip && event.target !== strip && strip.contains(event.target)) {
      revealTool(strip, event.target);
    }
  };
  return { stripRef, edges, syncOverflow, pageToward, onFocus };
}
