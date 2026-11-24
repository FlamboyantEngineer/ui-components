'use client';

import { type RefObject, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { measureScale } from '../../utils/element-scale.js';
import { measureInScroller } from '../../utils/scroll-geometry.js';
import { useLatest } from '../../utils/use-latest.js';
import { measurePdfScrollPosition, type PdfScrollPosition } from './page-scroll-position.js';
import { type NearPages, useNearPages } from './use-near-pages.js';

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
  /** Reports a shared scroll measurement once the view is measured. */
  observePosition(report: (position: PdfScrollPosition) => void): () => void;
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

interface ScrollAnchorOptions extends UsePdfPagesOptions {
  elements: NearPages['elements'];
  nearPages: NearPages['nearPages'];
  /** Reports the page the reader is on whenever the anchor is recorded. */
  onPageChange(pageIndex: number): void;
}

function measureAnchor(
  scroller: HTMLElement,
  view: DOMRect,
  { box, pageIndex }: NonNullable<PdfScrollPosition['mostVisible']>,
): ScrollAnchor {
  // The fraction is the same in client and layout pixels, so it can use the measured page box.
  const paddingTop = view.top + scroller.clientTop * measureScale(scroller).y;
  return {
    pageIndex,
    fraction: box.height > 0 ? (paddingTop - box.top) / box.height : 0,
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
function useScrollAnchor({
  scrollerRef,
  document,
  pageCount,
  elements,
  nearPages,
  onPageChange,
}: ScrollAnchorOptions) {
  const anchor = useRef<ScrollAnchor | null>(null);
  const frame = useRef<{ view: Window; id: number } | null>(null);
  const reporter = useRef<((position: PdfScrollPosition) => void) | null>(null);
  const nearPagesRef = useLatest(nearPages);
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
    if (!scroller) return null;
    const pages = elements.current;
    const near = pages.size === pageCount ? nearPagesRef.current : null;
    const position = measurePdfScrollPosition(scroller, pages, near);
    const page = position.mostVisible;
    if (page) {
      anchor.current = measureAnchor(scroller, position.view, page);
      onPageChange(page.pageIndex);
    }
    return position;
  }, [elements, nearPagesRef, onPageChange, pageCount, scrollerRef]);

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
      const position = captureAnchor();
      if (position) reporter.current?.(position);
    });
  }, [captureAnchor, scrollerRef]);

  const observePosition = useCallback(
    (report: (position: PdfScrollPosition) => void) => {
      reporter.current = report;
      handleScroll();
      return () => {
        if (reporter.current === report) reporter.current = null;
      };
    },
    [handleScroll],
  );

  return { captureAnchor, restoreAnchor, handleScroll, observePosition };
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
  const anchor = useScrollAnchor({
    scrollerRef,
    document,
    pageCount,
    elements,
    nearPages,
    onPageChange: setCurrentPage,
  });

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
