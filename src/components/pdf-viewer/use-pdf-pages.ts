import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';

export interface UsePdfPagesOptions {
  scrollerRef: RefObject<HTMLElement | null>;
  /** The open document; a new one starts at its first page. */
  document: object | null;
  pageCount: number;
}

export interface PdfPagesController {
  /** Pages within a screen of the view, which render; `null` when every page renders. */
  nearPages: ReadonlySet<number> | null;
  /** The page that fills most of the view, zero-based. */
  currentPage: number;
  registerPage(pageIndex: number, element: HTMLElement | null): void;
  scrollToPage(pageIndex: number): void;
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
  const view = scroller.getBoundingClientRect();
  const box = page.getBoundingClientRect();
  return {
    pageIndex,
    fraction: box.height > 0 ? (view.top - box.top) / box.height : 0,
    centre:
      scroller.scrollWidth > 0
        ? (scroller.scrollLeft + scroller.clientWidth / 2) / scroller.scrollWidth
        : 0.5,
  };
}

function revealInScroller(scroller: HTMLElement, element: HTMLElement) {
  const view = scroller.getBoundingClientRect();
  const box = element.getBoundingClientRect();
  if (box.top < view.top || box.bottom > view.bottom) {
    scroller.scrollTop += box.top - view.top - (view.height - box.height) / 2;
  }
  if (box.left < view.left || box.right > view.right) {
    scroller.scrollLeft += box.left - view.left - (view.width - box.width) / 2;
  }
}

/** Tracks which pages are near the view with an `IntersectionObserver` rooted at the scroller. */
function useNearPages(scrollerRef: RefObject<HTMLElement | null>) {
  const elements = useRef(new Map<number, HTMLElement>());
  const indexes = useRef(new WeakMap<Element, number>());
  const observer = useRef<IntersectionObserver | null>(null);
  const [nearPages, setNearPages] = useState<ReadonlySet<number> | null>(() =>
    typeof IntersectionObserver === 'undefined' ? null : new Set(),
  );

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return undefined;
    const created = new IntersectionObserver(
      (entries) =>
        setNearPages((previous) => {
          const next = new Set(previous);
          for (const entry of entries) {
            const pageIndex = indexes.current.get(entry.target);
            if (pageIndex === undefined) continue;
            if (entry.isIntersecting) next.add(pageIndex);
            else next.delete(pageIndex);
          }
          return next;
        }),
      { root, rootMargin: '100% 0px' },
    );
    for (const element of elements.current.values()) created.observe(element);
    observer.current = created;
    return () => {
      created.disconnect();
      observer.current = null;
    };
  }, [scrollerRef]);

  const registerPage = useCallback((pageIndex: number, element: HTMLElement | null) => {
    const previous = elements.current.get(pageIndex);
    if (previous) observer.current?.unobserve(previous);
    if (element) {
      elements.current.set(pageIndex, element);
      indexes.current.set(element, pageIndex);
      observer.current?.observe(element);
    } else {
      elements.current.delete(pageIndex);
    }
  }, []);

  return { elements, nearPages, registerPage };
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
  const anchor = useRef<ScrollAnchor | null>(null);
  const frame = useRef(0);
  if (position.document !== document) setPosition({ document, currentPage: 0 });
  const setCurrentPage = useCallback(
    (currentPage: number) =>
      setPosition((previous) =>
        previous.currentPage === currentPage ? previous : { ...previous, currentPage },
      ),
    [],
  );

  useLayoutEffect(() => {
    anchor.current = null;
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollTop = 0;
    scroller.scrollLeft = 0;
  }, [document, scrollerRef]);

  const captureAnchor = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const pageIndex = findMostVisiblePage(elements.current, scroller.getBoundingClientRect());
    const page = elements.current.get(pageIndex);
    if (page) anchor.current = measureAnchor(scroller, page, pageIndex);
    if (pageIndex >= 0) setCurrentPage(pageIndex);
  }, [elements, scrollerRef, setCurrentPage]);

  const handleScroll = useCallback(() => {
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      captureAnchor();
    });
  }, [captureAnchor]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const restoreAnchor = useCallback(() => {
    const scroller = scrollerRef.current;
    const saved = anchor.current;
    const page = saved ? elements.current.get(saved.pageIndex) : undefined;
    if (!scroller || !saved || !page) return;
    const box = page.getBoundingClientRect();
    scroller.scrollTop +=
      box.top - scroller.getBoundingClientRect().top + saved.fraction * box.height;
    scroller.scrollLeft = saved.centre * scroller.scrollWidth - scroller.clientWidth / 2;
  }, [elements, scrollerRef]);

  // A page lands where the first page sits when the view is at the top.
  const scrollToPage = useCallback(
    (pageIndex: number) => {
      const scroller = scrollerRef.current;
      const page = elements.current.get(pageIndex);
      const first = elements.current.get(0);
      if (!scroller || !page || !first) return;
      scroller.scrollTop = page.offsetTop - first.offsetTop;
      setCurrentPage(pageIndex);
    },
    [elements, scrollerRef, setCurrentPage],
  );

  const revealElement = useCallback(
    (element: HTMLElement) => {
      if (scrollerRef.current) revealInScroller(scrollerRef.current, element);
    },
    [scrollerRef],
  );

  return {
    nearPages,
    currentPage: Math.min(position.currentPage, Math.max(0, pageCount - 1)),
    registerPage,
    scrollToPage,
    revealElement,
    handleScroll,
    captureAnchor,
    restoreAnchor,
  };
}
