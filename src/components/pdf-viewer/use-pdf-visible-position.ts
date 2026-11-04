'use client';

import { type RefObject, useEffect, useRef } from 'react';
import { useLatest } from '../../utils/use-latest.js';
import { measurePageFrame } from './page-geometry.js';

/** Where the top edge of the view falls in the document. */
export interface PdfVisiblePosition {
  /** The page at the top edge, zero-based: the next page when the edge falls between two. */
  pageIndex: number;
  /** How far down that page the edge falls, in points from its top as displayed; 0 above it. */
  top: number;
}

interface UsePdfVisiblePositionOptions {
  scrollerRef: RefObject<HTMLElement | null>;
  elements: RefObject<ReadonlyMap<number, HTMLElement>>;
  /** CSS pixels per point. */
  scale: number;
  /** The open document: a new one reports its position even where the last one stood. */
  document: object | null;
  /** Changes whenever the pages move without a scroll, such as a turn of the pages. */
  layout: unknown;
  onVisiblePositionChange?: ((position: PdfVisiblePosition) => void) | undefined;
}

/** Positions closer than this, in points, are the same position. */
const precision = 100;

/** The page under the scroller's top edge and how far down it the edge is. */
function measureVisiblePosition(
  scroller: HTMLElement,
  elements: ReadonlyMap<number, HTMLElement>,
  scale: number,
): PdfVisiblePosition | null {
  const edge = scroller.getBoundingClientRect().top;
  const ordered = [...elements].sort(([a], [b]) => a - b);
  const found =
    ordered.find(([, page]) => page.getBoundingClientRect().bottom > edge) ?? ordered.at(-1);
  if (!found) return null;
  const [pageIndex, page] = found;
  const frame = measurePageFrame(page, scale);
  const top = Math.max(0, (edge - frame.origin.top) / (scale > 0 ? scale : 1));
  return { pageIndex, top: Math.round(top * precision) / precision };
}

/**
 * Reports where the top edge of the view falls as the reader scrolls, zooms, turns the pages or
 * resizes the viewer: measured once per frame and reported only when it moves.
 */
export function usePdfVisiblePosition({
  scrollerRef,
  elements,
  scale,
  document,
  layout,
  onVisiblePositionChange,
}: UsePdfVisiblePositionOptions): void {
  const latest = useLatest({ elements, scale, onVisiblePositionChange });
  const reported = useRef('');
  useEffect(() => {
    reported.current = '';
  }, [document]);
  const isWatching = onVisiblePositionChange !== undefined;
  useEffect(() => {
    const scroller = scrollerRef.current;
    const view = scroller?.ownerDocument.defaultView;
    if (!scroller || !view || !isWatching) return undefined;
    let frame: number | undefined;
    const measure = () => {
      frame = undefined;
      const current = latest.current;
      const position = measureVisiblePosition(scroller, current.elements.current, current.scale);
      const key = position ? `${position.pageIndex} ${position.top}` : '';
      if (!position || key === reported.current) return;
      reported.current = key;
      current.onVisiblePositionChange?.(position);
    };
    const schedule = () => {
      frame ??= view.requestAnimationFrame(measure);
    };
    schedule();
    scroller.addEventListener('scroll', schedule, { passive: true });
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
    resize?.observe(scroller);
    return () => {
      if (frame !== undefined) view.cancelAnimationFrame(frame);
      scroller.removeEventListener('scroll', schedule);
      resize?.disconnect();
    };
  }, [document, isWatching, latest, layout, scale, scrollerRef]);
}
