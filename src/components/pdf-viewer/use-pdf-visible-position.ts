'use client';

import { type RefObject, useEffect, useRef } from 'react';
import { useLatest } from '../../utils/use-latest.js';
import { useResizeObserver } from '../../utils/use-resize-observer.js';
import type { PdfPagesController } from './use-pdf-pages.js';

/** Where the top edge of the view falls in the document. */
export interface PdfVisiblePosition {
  /** The page at the top edge, zero-based: the next page when the edge falls between two. */
  pageIndex: number;
  /** How far down that page the edge falls, in points from its top as displayed; 0 above it. */
  top: number;
}

interface UsePdfVisiblePositionOptions {
  scrollerRef: RefObject<HTMLElement | null>;
  pages: Pick<PdfPagesController, 'handleScroll' | 'observePosition'>;
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

/**
 * Reports where the top edge of the view falls as the reader scrolls, zooms, turns the pages or
 * resizes the viewer: measured once per frame and reported only when it moves.
 */
export function usePdfVisiblePosition({
  scrollerRef,
  pages,
  scale,
  document,
  layout,
  onVisiblePositionChange,
}: UsePdfVisiblePositionOptions): void {
  const { handleScroll, observePosition } = pages;
  const latest = useLatest({ scale, onVisiblePositionChange });
  const reported = useRef('');
  useEffect(() => {
    reported.current = '';
  }, [document]);
  const isWatching = onVisiblePositionChange !== undefined;
  useResizeObserver([isWatching ? scrollerRef : null], handleScroll);
  useEffect(() => {
    if (!isWatching) return undefined;
    return observePosition(({ view, atTop }) => {
      const { scale, onVisiblePositionChange } = latest.current;
      if (!atTop || !onVisiblePositionChange) return;
      const { pageIndex, box, element } = atTop;
      const depth = Math.max(0, (view.top - box.top - element.clientTop) / (scale > 0 ? scale : 1));
      const top = Math.round(depth * precision) / precision;
      const key = `${pageIndex} ${top}`;
      if (reported.current === key) return;
      reported.current = key;
      onVisiblePositionChange({ pageIndex, top });
    });
  }, [document, isWatching, latest, layout, observePosition, scale]);
}
