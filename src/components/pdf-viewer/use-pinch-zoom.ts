'use client';

import { useEffect, type RefObject } from 'react';
import type { PdfEngine } from './pdf-engine.js';
import { resolveZoomPercent } from './pdf-zoom.js';
import { useLatest } from '../../utils/use-latest.js';
import type { PdfZoomState } from './use-pdf-zoom.js';

interface UsePinchZoomOptions {
  /** The engine of the open document, whose touch manager tells pinches from drags. */
  engine: Pick<PdfEngine, 'TouchManager'> | null;
  scrollerRef: RefObject<HTMLElement | null>;
  /** The page column, scaled as a whole while the fingers move. */
  pagesRef: RefObject<HTMLElement | null>;
  zoom: Pick<PdfZoomState, 'percent' | 'setZoom'> & Partial<Pick<PdfZoomState, 'levels'>>;
}

/**
 * Two fingers pinching over the pages scale the page column with them, about the point between
 * them, and the zoom they reached applies when they lift; two fingers dragging scroll the pages, and
 * one finger keeps the browser's own scrolling. The pages are drawn again only once, at the end,
 * so the element under a finger stays in place for the whole gesture.
 */
export function usePinchZoom({ engine, scrollerRef, pagesRef, zoom }: UsePinchZoomOptions): void {
  const latest = useLatest(zoom);
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!engine || !scroller) return undefined;
    const controller = new AbortController();
    let target: number | null = null;
    let activeColumn: HTMLElement | null = null;
    const clear = () => {
      target = null;
      if (!activeColumn) return;
      activeColumn.style.transform = '';
      activeColumn.style.transformOrigin = '';
      activeColumn = null;
    };
    const manager = new engine.TouchManager({
      container: scroller,
      signal: controller.signal,
      onPinching(origin, previousDistance, distance) {
        const column = pagesRef.current;
        if (controller.signal.aborted || previousDistance <= 0 || !column) return;
        if (column !== activeColumn) {
          clear();
          activeColumn = column;
        }
        const { percent } = latest.current;
        if (target === null) {
          const box = column.getBoundingClientRect();
          column.style.transformOrigin = `${(origin[0] ?? 0) - box.left}px ${(origin[1] ?? 0) - box.top}px`;
        }
        const reached = (target ?? percent) * (distance / previousDistance);
        target = resolveZoomPercent({
          zoom: reached,
          page: null,
          available: null,
          zoomLevels: latest.current.levels,
        });
        column.style.transform = `scale(${target / percent})`;
      },
      onPinchEnd() {
        if (controller.signal.aborted) return;
        const reached = target;
        clear();
        if (reached !== null) latest.current.setZoom(reached);
      },
      onPanning(deltaX, deltaY) {
        if (controller.signal.aborted) return;
        scroller.scrollLeft -= deltaX;
        scroller.scrollTop -= deltaY;
      },
    });
    return () => {
      controller.abort();
      clear();
      manager.destroy();
    };
  }, [engine, latest, pagesRef, scrollerRef]);
}
