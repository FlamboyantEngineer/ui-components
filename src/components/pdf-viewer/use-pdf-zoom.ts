'use client';

import { type RefObject, useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { getOwnerWindow } from '../../utils/owner-window.js';
import { useLatest } from '../../utils/use-latest.js';
import { useResizeObserver } from '../../utils/use-resize-observer.js';
import { createWheelStepCounter, isZoomWheel } from '../../utils/use-wheel-steps.js';
import { toWheelPixels } from '../../utils/wheel-scroll.js';
import { findNextZoomLevel } from '../zoom-control/zoom-control.js';
import {
  findLargestPage,
  type PdfSize,
  type PdfZoom,
  resolveZoomLevels,
  resolveZoomPercent,
  toCssScale,
} from './pdf-zoom.js';
import type { PdfPagesController } from './use-pdf-pages.js';

interface UsePdfZoomOptions {
  defaultZoom: PdfZoom;
  zoomLevels?: readonly number[] | undefined;
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
  /** The resolved zoom ladder used by every zoom gesture. */
  levels: readonly number[];
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
  { setZoom, levels }: Pick<PdfZoomState, 'setZoom' | 'levels'>,
) {
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return undefined;
    // React registers wheel listeners as passive, so only a native listener can prevent the
    // browser's own zoom.
    // A trackpad pinch sends many small deltas: they add up to whole steps, one level each.
    const count = createWheelStepCounter();
    const onWheel = (event: WheelEvent) => {
      if (!isZoomWheel(event)) return;
      event.preventDefault();
      const { y } = toWheelPixels(event, { width: scroller.clientWidth, height: 400 });
      if (y === 0) return;
      // A wheel that counts in lines or pages, as some mice do, steps once per event.
      const direction = event.deltaMode === 0 ? count(y) : y < 0 ? 1 : -1;
      if (direction === null) return;
      const level = findNextZoomLevel(levels, percent, direction);
      if (level !== undefined) setZoom(level);
    };
    scroller.addEventListener('wheel', onWheel, { passive: false });
    return () => scroller.removeEventListener('wheel', onWheel);
  }, [percent, scrollerRef, setZoom, levels]);
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
  const levels = resolveZoomLevels(options.zoomLevels);
  const percent = resolveZoomPercent({ zoom, page: largest, available, zoomLevels: levels });
  const scale = toCssScale(percent);
  const latest = useLatest(options);

  const setZoom = useCallback(
    (next: PdfZoom) => {
      captureAnchor();
      setZoomState(next);
    },
    [captureAnchor],
  );
  useWheelZoom(scrollerRef, percent, { setZoom, levels });
  useLayoutEffect(() => restoreAnchor(), [scale, restoreAnchor]);
  useEffect(() => {
    if (largest) latest.current.onZoomChange?.(percent);
  }, [largest, percent, latest]);

  return { zoom, percent, scale, setZoom, levels };
}
