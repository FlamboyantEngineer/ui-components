'use client';

import { type RefObject, useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { getOwnerWindow } from '../../utils/owner-window.js';
import { useLatest } from '../../utils/use-latest.js';
import { useResizeObserver } from '../../utils/use-resize-observer.js';
import { findNextZoomLevel } from '../zoom-control/zoom-control.js';
import {
  findLargestPage,
  type PdfSize,
  type PdfZoom,
  pdfZoomLevels,
  resolveZoomPercent,
  toCssScale,
} from './pdf-zoom.js';
import type { PdfPagesController } from './use-pdf-pages.js';

interface UsePdfZoomOptions {
  defaultZoom: PdfZoom;
  /** Page sizes in points; a fit holds for the largest. */
  sizes: readonly PdfSize[];
  scrollerRef: RefObject<HTMLElement | null>;
  /** The page column, whose padding a fit leaves free. */
  pagesRef: RefObject<HTMLElement | null>;
  pages: Pick<PdfPagesController, 'captureAnchor' | 'restoreAnchor'>;
  onZoomChange?: ((percent: number) => void) | undefined;
}

export interface PdfZoomState {
  /** The requested zoom: a percentage or a fit mode. */
  zoom: PdfZoom;
  /** The applied zoom in percent. */
  percent: number;
  /** CSS pixels per point at the applied zoom. */
  scale: number;
  setZoom(zoom: PdfZoom): void;
}

function measurePadding(element: HTMLElement | null): PdfSize {
  if (!element) return { width: 0, height: 0 };
  const style = getOwnerWindow(element).getComputedStyle(element);
  const sum = (...values: string[]) =>
    values.reduce((total, value) => total + (Number.parseFloat(value) || 0), 0);
  return {
    width: sum(style.paddingLeft, style.paddingRight),
    height: sum(style.paddingTop, style.paddingBottom),
  };
}

/** The space the page column offers a page: the scroller's client box less the column's padding. */
function useAvailableSize(
  scrollerRef: RefObject<HTMLElement | null>,
  pagesRef: RefObject<HTMLElement | null>,
): PdfSize | null {
  const [available, setAvailable] = useState<PdfSize | null>(null);
  const measure = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller || scroller.clientWidth === 0) return;
    const inset = measurePadding(pagesRef.current);
    const width = scroller.clientWidth - inset.width;
    const height = scroller.clientHeight - inset.height;
    setAvailable((previous) =>
      previous?.width === width && previous.height === height ? previous : { width, height },
    );
  }, [pagesRef, scrollerRef]);
  useResizeObserver([scrollerRef], measure);
  return available;
}

/** Ctrl or Command with the wheel steps the zoom instead of zooming the whole page. */
function useWheelZoom(
  scrollerRef: RefObject<HTMLElement | null>,
  percent: number,
  setZoom: (zoom: PdfZoom) => void,
) {
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return undefined;
    // React registers wheel listeners as passive, so only a native listener can prevent the
    // browser's own zoom.
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      if (event.deltaY === 0) return;
      const level = findNextZoomLevel(pdfZoomLevels, percent, event.deltaY < 0 ? 1 : -1);
      if (level !== undefined) setZoom(level);
    };
    scroller.addEventListener('wheel', onWheel, { passive: false });
    return () => scroller.removeEventListener('wheel', onWheel);
  }, [percent, scrollerRef, setZoom]);
}

/**
 * The viewer's zoom: a percentage or a fit mode, resolved against the page column's size whenever it
 * changes, with the reader's place kept across every change.
 */
export function usePdfZoom(options: UsePdfZoomOptions): PdfZoomState {
  const { defaultZoom, sizes, scrollerRef, pagesRef, pages } = options;
  const { captureAnchor, restoreAnchor } = pages;
  const [zoom, setZoomState] = useState<PdfZoom>(defaultZoom);
  const available = useAvailableSize(scrollerRef, pagesRef);
  const largest = useMemo(() => findLargestPage(sizes), [sizes]);
  const percent = resolveZoomPercent({ zoom, page: largest, available });
  const scale = toCssScale(percent);
  const latest = useLatest(options);

  const setZoom = useCallback(
    (next: PdfZoom) => {
      captureAnchor();
      setZoomState(next);
    },
    [captureAnchor],
  );
  useWheelZoom(scrollerRef, percent, setZoom);
  useLayoutEffect(() => restoreAnchor(), [scale, restoreAnchor]);
  useEffect(() => {
    if (largest) latest.current.onZoomChange?.(percent);
  }, [largest, percent, latest]);

  return { zoom, percent, scale, setZoom };
}
