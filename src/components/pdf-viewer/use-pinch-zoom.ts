import { useEffect, useRef, type RefObject } from 'react';
import type { PdfEngine } from './pdf-engine.js';
import { resolveZoomPercent } from './pdf-zoom.js';
import { useLatest } from './use-latest.js';
import type { PdfZoomState } from './use-pdf-zoom.js';

export interface UsePinchZoomOptions {
  /** The engine of the open document, whose touch manager tells pinches from drags. */
  engine: Pick<PdfEngine, 'TouchManager'> | null;
  scrollerRef: RefObject<HTMLElement | null>;
  /** The page column, scaled as a whole while the fingers move. */
  pagesRef: RefObject<HTMLElement | null>;
  zoom: Pick<PdfZoomState, 'percent' | 'setZoom'>;
}

/**
 * Two fingers pinching over the pages scale the page column with them, about the point between
 * them, and the zoom they reached applies when they lift; two fingers dragging scroll the pages, and
 * one finger keeps the browser's own scrolling. The pages are drawn again only once, at the end,
 * so the element under a finger stays in place for the whole gesture.
 */
export function usePinchZoom({ engine, scrollerRef, pagesRef, zoom }: UsePinchZoomOptions): void {
  const latest = useLatest(zoom);
  // The zoom the gesture has reached, ahead of the render that applies it.
  const target = useRef<number | null>(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!engine || !scroller) return undefined;
    const controller = new AbortController();
    const manager = new engine.TouchManager({
      container: scroller,
      signal: controller.signal,
      onPinching(origin, previousDistance, distance) {
        const column = pagesRef.current;
        if (previousDistance <= 0 || !column) return;
        const { percent } = latest.current;
        if (target.current === null) {
          const box = column.getBoundingClientRect();
          column.style.transformOrigin = `${(origin[0] ?? 0) - box.left}px ${(origin[1] ?? 0) - box.top}px`;
        }
        const reached = (target.current ?? percent) * (distance / previousDistance);
        target.current = resolveZoomPercent({ zoom: reached, page: null, available: null });
        column.style.transform = `scale(${target.current / percent})`;
      },
      onPinchEnd() {
        const reached = target.current;
        target.current = null;
        const column = pagesRef.current;
        if (column) {
          column.style.transform = '';
          column.style.transformOrigin = '';
        }
        if (reached !== null) latest.current.setZoom(reached);
      },
      onPanning(deltaX, deltaY) {
        scroller.scrollLeft -= deltaX;
        scroller.scrollTop -= deltaY;
      },
    });
    return () => {
      manager.destroy();
      controller.abort();
    };
  }, [engine, latest, pagesRef, scrollerRef]);
}
