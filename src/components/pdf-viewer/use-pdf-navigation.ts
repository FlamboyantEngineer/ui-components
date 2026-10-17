import { useCallback, useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { useResizeObserver } from '../../utils/use-resize-observer.js';
import { clamp } from '../../utils/clamp.js';
import type { PdfTextContent, PdfViewport } from './pdf-engine.js';
import type { PdfPageRect, PdfRect } from './page-geometry.js';
import type { LoadedPdf } from './use-pdf-document.js';
import { useLatest } from './use-latest.js';
import type { PagePixelRect, PdfPagesController } from './use-pdf-pages.js';

export interface UsePdfNavigationOptions {
  /** The page the caller wants the reader on, zero-based; `undefined` leaves the viewer in charge. */
  page?: number | undefined;
  onPageChange?: ((pageIndex: number) => void) | undefined;
  /** A rectangle to bring into view, in points. */
  revealRect?: PdfPageRect | null | undefined;
  isReady: boolean;
  /** CSS pixels per point. */
  scale: number;
  pageCount: number;
  scrollerRef: RefObject<HTMLElement | null>;
  pages: Pick<PdfPagesController, 'currentPage' | 'elements' | 'scrollToPage'>;
}

export interface UsePageViewportsOptions<
  V extends PdfViewport = PdfViewport,
  C extends PdfTextContent = PdfTextContent,
> {
  loaded: LoadedPdf<V, C> | null;
  nearPages: ReadonlySet<number> | null;
  scale: number;
  onPageViewports?: ((viewports: ReadonlyMap<number, V>) => void) | undefined;
}

/** Where a request sends the reader: a page, or a rectangle on it in points. */
interface NavigationRequest {
  pageIndex: number;
  rect: PdfRect | null;
}

function toRectKey(rect: PdfPageRect | null | undefined): string {
  return rect ? [rect.pageIndex, rect.left, rect.top, rect.width, rect.height].join(' ') : '';
}

function scaleRect(rect: PdfRect, scale: number): PagePixelRect {
  return {
    left: rect.left * scale,
    top: rect.top * scale,
    width: rect.width * scale,
    height: rect.height * scale,
  };
}

/**
 * Whether a new `page` repeats a page the viewer reported that the caller had not caught up with.
 * Reports the caller has now passed are dropped, and an echo of the latest clears the list.
 */
function consumeEcho(reported: number[], page: number): boolean {
  const at = reported.lastIndexOf(page);
  if (at === -1) {
    reported.length = 0;
    return false;
  }
  reported.splice(0, at + 1);
  return true;
}

/** Turns changes of `page` and `revealRect` into one pending request each. */
function useNavigationRequests(
  options: Pick<UsePdfNavigationOptions, 'page' | 'revealRect' | 'pages'>,
  reported: RefObject<number[]>,
): RefObject<NavigationRequest | null> {
  const { page, revealRect } = options;
  const pending = useRef<NavigationRequest | null>(null);
  const latest = useLatest(options);
  useLayoutEffect(() => {
    if (page === undefined || consumeEcho(reported.current, page)) return;
    if (page !== latest.current.pages.currentPage)
      pending.current = { pageIndex: page, rect: null };
  }, [page, latest, reported]);
  const rectKey = toRectKey(revealRect);
  useLayoutEffect(() => {
    const rect = latest.current.revealRect;
    if (rect) pending.current = { pageIndex: rect.pageIndex, rect };
  }, [rectKey, latest]);
  return pending;
}

/**
 * Going to a page or a rectangle on request, once per request: a request waits until the document
 * has opened, its page is laid out and the viewer is shown, and is then carried out. The page the
 * reader is on is reported whenever it changes.
 */
export function usePdfNavigation(options: UsePdfNavigationOptions): void {
  const { isReady, scale, pageCount, scrollerRef, pages } = options;
  const { currentPage, elements, scrollToPage } = pages;
  const reported = useRef<number[]>([]);
  const pending = useNavigationRequests(options, reported);
  const latest = useLatest(options);

  const serve = useCallback(() => {
    const request = pending.current;
    const scroller = scrollerRef.current;
    if (!request || !scroller || scroller.clientHeight === 0 || pageCount === 0) return;
    const pageIndex = clamp(request.pageIndex, 0, pageCount - 1);
    if (!elements.current.has(pageIndex)) return;
    pending.current = null;
    scrollToPage(pageIndex, request.rect ? scaleRect(request.rect, scale) : undefined);
  }, [elements, pageCount, pending, scale, scrollToPage, scrollerRef]);
  useLayoutEffect(serve);
  // A hidden viewer measures nothing; being shown again is a resize.
  useResizeObserver([scrollerRef], serve);

  const lastReport = useRef<number | null>(null);
  useEffect(() => {
    if (!isReady || pending.current || lastReport.current === currentPage) return;
    lastReport.current = currentPage;
    const { page, onPageChange } = latest.current;
    if (page === currentPage) return;
    if (page !== undefined) reported.current.push(currentPage);
    onPageChange?.(currentPage);
  }, [currentPage, isReady, latest, pending]);
}

/** Reports the viewports of the pages that render whenever that set or the zoom changes. */
export function usePageViewports<V extends PdfViewport, C extends PdfTextContent>({
  loaded,
  nearPages,
  scale,
  onPageViewports,
}: UsePageViewportsOptions<V, C>): void {
  const latest = useLatest(onPageViewports);
  useEffect(() => {
    const viewports = new Map<number, V>();
    loaded?.pages.forEach((_, pageIndex) => {
      if (nearPages && !nearPages.has(pageIndex)) return;
      const viewport = loaded.getViewport(pageIndex, scale);
      if (viewport) viewports.set(pageIndex, viewport);
    });
    latest.current?.(viewports);
  }, [latest, loaded, nearPages, scale]);
}
