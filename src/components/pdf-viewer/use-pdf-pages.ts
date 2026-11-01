'use client';

import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { useNearPages, type NearPages } from './use-near-pages.js';
import { measureInScroller } from '../../utils/scroll-geometry.js';

interface UsePdfPagesOptions {
  scrollerRef: RefObject<HTMLElement | null>;
  /** The open document; a new one starts at its first page. */
  document: object | null;
  pageCount: number;
}

/** A rectangle on a page in CSS pixels from the top-left corner of its bitmap. */
export interface PagePixelRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface PdfPagesController {
  /** Pages within a screen of the view, which render; `null` when every page renders. */
  nearPages: ReadonlySet<number> | null;
  /** The page that fills most of the view, zero-based. */
  currentPage: number;
  /** Every page element, by page index. */
  elements: NearPages['elements'];
  registerPage(pageIndex: number, element: HTMLElement | null): void;
  /**
   * Scrolls a page, or a rectangle on it, to where the first page sits when the view is at the top.
   */
  scrollToPage(pageIndex: number, rect?: PagePixelRect): void;
  /** Scrolls an element inside a page into the middle of the view unless it is fully visible. */
  revealElement(element: HTMLElement): void;
  /** Call from the scroller's scroll handler. */
  handleScroll(): void;
  /** Records the reader's position before the page sizes change. */
  captureAnchor(): void;
  /** Returns to the recorded position after the page sizes changed. */
  restoreAnchor(): void;
}

/** Where the reader is, kept across a zoom change. */
interface ScrollAnchor {
  pageIndex: number;
  /** How far down the page the scroller's top edge is, as a fraction of the page height. */
  fraction: number;
  /** The horizontal centre of the view, as a fraction of the scroll width. */
  centre: number;
}

interface ScrollAnchorOptions extends Pick<UsePdfPagesOptions, 'scrollerRef' | 'document'> {
  elements: NearPages['elements'];
  /** Reports the page the reader is on whenever the anchor is recorded. */
  onPageChange(pageIndex: number): void;
}

function visibleHeight(element: HTMLElement, view: DOMRect): number {
  const box = element.getBoundingClientRect();
  return Math.max(0, Math.min(box.bottom, view.bottom) - Math.max(box.top, view.top));
}

function findMostVisiblePage(elements: ReadonlyMap<number, HTMLElement>, view: DOMRect): number {
  let best = -1;
  let bestHeight = 0;
  for (const [pageIndex, element] of elements) {
    const height = visibleHeight(element, view);
    if (height > bestHeight || (height === bestHeight && height > 0 && pageIndex < best)) {
      best = pageIndex;
      bestHeight = height;
    }
  }
  return best;
}

function measureAnchor(scroller: HTMLElement, page: HTMLElement, pageIndex: number): ScrollAnchor {
  const box = measureInScroller(page, scroller);
  return {
    pageIndex,
    fraction: box.height > 0 ? (scroller.scrollTop - box.top) / box.height : 0,
    centre:
      scroller.scrollWidth > 0
        ? (scroller.scrollLeft + scroller.clientWidth / 2) / scroller.scrollWidth
        : 0.5,
  };
}

function scrollToAnchor(scroller: HTMLElement, page: HTMLElement, anchor: ScrollAnchor) {
  const box = measureInScroller(page, scroller);
  scroller.scrollTop = box.top + anchor.fraction * box.height;
  scroller.scrollLeft = anchor.centre * scroller.scrollWidth - scroller.clientWidth / 2;
}

/** The scroll position that shows a span, centred, unless the view already shows all of it. */
function revealSpan(start: number, size: number, view: { start: number; size: number }): number {
  if (start >= view.start && start + size <= view.start + view.size) return view.start;
  return start + size / 2 - view.size / 2;
}

function revealInScroller(scroller: HTMLElement, element: HTMLElement) {
  const box = measureInScroller(element, scroller);
  const { scrollTop, scrollLeft } = scroller;
  scroller.scrollTop = revealSpan(box.top, box.height, {
    start: scrollTop,
    size: scroller.clientHeight,
  });
  scroller.scrollLeft = revealSpan(box.left, box.width, {
    start: scrollLeft,
    size: scroller.clientWidth,
  });
}

/**
 * The reader's place: recorded on scroll (once per frame) and before a zoom, restored after it, and
 * reset to the top for a new document.
 */
function useScrollAnchor({ scrollerRef, document, elements, onPageChange }: ScrollAnchorOptions) {
  const anchor = useRef<ScrollAnchor | null>(null);
  const frame = useRef<{ view: Window; id: number } | null>(null);
  const cancelFrame = useCallback(() => {
    const pending = frame.current;
    frame.current = null;
    if (pending) pending.view.cancelAnimationFrame(pending.id);
  }, []);

  useLayoutEffect(() => {
    cancelFrame();
    anchor.current = null;
    const scroller = scrollerRef.current;
    if (scroller) {
      scroller.scrollTop = 0;
      scroller.scrollLeft = 0;
    }
    return cancelFrame;
  }, [cancelFrame, document, scrollerRef]);

  const captureAnchor = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const pageIndex = findMostVisiblePage(elements.current, scroller.getBoundingClientRect());
    const page = elements.current.get(pageIndex);
    if (page) anchor.current = measureAnchor(scroller, page, pageIndex);
    if (pageIndex >= 0) onPageChange(pageIndex);
  }, [elements, onPageChange, scrollerRef]);

  const restoreAnchor = useCallback(() => {
    const scroller = scrollerRef.current;
    const saved = anchor.current;
    const page = saved ? elements.current.get(saved.pageIndex) : undefined;
    if (scroller && saved && page) scrollToAnchor(scroller, page, saved);
  }, [elements, scrollerRef]);

  const handleScroll = useCallback(() => {
    const view = scrollerRef.current?.ownerDocument.defaultView;
    if (!view || frame.current !== null) return;
    const pending = { view, id: 0 };
    frame.current = pending;
    pending.id = view.requestAnimationFrame(() => {
      if (frame.current !== pending) return;
      frame.current = null;
      captureAnchor();
    });
  }, [captureAnchor, scrollerRef]);

  return { captureAnchor, restoreAnchor, handleScroll };
}

/**
 * The page elements of a viewer: which are near the view, which one the reader is on, scrolling to a
 * page or an element, and keeping the reader's place when the zoom changes.
 */
export function usePdfPages({
  scrollerRef,
  document,
  pageCount,
}: UsePdfPagesOptions): PdfPagesController {
  const { elements, nearPages, registerPage } = useNearPages(scrollerRef);
  const [position, setPosition] = useState({ document, currentPage: 0 });
  if (position.document !== document) setPosition({ document, currentPage: 0 });
  const setCurrentPage = useCallback(
    (currentPage: number) =>
      setPosition((previous) =>
        previous.currentPage === currentPage ? previous : { ...previous, currentPage },
      ),
    [],
  );
  const anchor = useScrollAnchor({ scrollerRef, document, elements, onPageChange: setCurrentPage });

  // A page lands where the first page sits when the view is at the top. The position is recorded
  // at once, so a zoom applied before the scroll event keeps it.
  const { captureAnchor } = anchor;
  const scrollToPage = useCallback(
    (pageIndex: number, rect?: PagePixelRect) => {
      const scroller = scrollerRef.current;
      const page = elements.current.get(pageIndex);
      const first = elements.current.get(0);
      if (!scroller || !page || !first) return;
      const inset = rect ? page.clientTop + rect.top : 0;
      scroller.scrollTop = page.offsetTop - first.offsetTop + inset;
      if (rect) {
        scroller.scrollLeft = revealSpan(
          page.offsetLeft + page.clientLeft + rect.left,
          rect.width,
          {
            start: scroller.scrollLeft,
            size: scroller.clientWidth,
          },
        );
      }
      captureAnchor();
      setCurrentPage(pageIndex);
    },
    [captureAnchor, elements, scrollerRef, setCurrentPage],
  );

  const revealElement = useCallback(
    (element: HTMLElement) => {
      if (scrollerRef.current) revealInScroller(scrollerRef.current, element);
    },
    [scrollerRef],
  );

  return {
    ...anchor,
    nearPages,
    currentPage: Math.min(position.currentPage, Math.max(0, pageCount - 1)),
    elements,
    registerPage,
    scrollToPage,
    revealElement,
  };
}
