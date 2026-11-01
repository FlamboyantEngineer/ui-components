'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react';
import { useResizeObserver } from '../../utils/use-resize-observer.js';
import { clamp } from '../../utils/clamp.js';
import type { PdfTarget } from './pdf-destination.js';
import type { PdfTextContent, PdfViewport } from './pdf-engine.js';
import type { PdfPageRect, PdfRect } from './page-geometry.js';
import type { LoadedPdf } from './use-pdf-document.js';
import { useLatest } from '../../utils/use-latest.js';
import type { PagePixelRect, PdfPagesController } from './use-pdf-pages.js';

interface UsePdfNavigationOptions {
  /** The page the caller wants the reader on, zero-based; `undefined` leaves the viewer in charge. */
  page?: number | undefined;
  onPageChange?: ((pageIndex: number) => void) | undefined;
  /** The page a document opens at when `page` is not set, zero-based. */
  defaultPage?: number | undefined;
  /** The open document; a new one opens at `defaultPage`. */
  document: object | null;
  /** A rectangle to bring into view, in points. */
  revealRect?: PdfPageRect | null | undefined;
  isReady: boolean;
  /** CSS pixels per point. */
  scale: number;
  pageCount: number;
  scrollerRef: RefObject<HTMLElement | null>;
  pages: Pick<PdfPagesController, 'currentPage' | 'elements' | 'scrollToPage'>;
  /** Find: each new `revealKey` while it has matches brings one into view. */
  search?: { total: number; revealKey: number } | undefined;
}

interface UsePageViewportsOptions<
  V extends PdfViewport = PdfViewport,
  C extends PdfTextContent = PdfTextContent,
> {
  loaded: LoadedPdf<V, C> | null;
  nearPages: ReadonlySet<number> | null;
  scale: number;
  onPageViewports?: ((viewports: ReadonlyMap<number, V>) => void) | undefined;
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

/**
 * The request a newly opened document starts with: the caller's `revealRect`, else its `page`, else
 * `defaultPage`, else none. A destination, looked up once the document has opened, comes after.
 */
function toOpeningRequest({
  revealRect,
  page,
  defaultPage,
}: Pick<UsePdfNavigationOptions, 'revealRect' | 'page' | 'defaultPage'>): PdfTarget | null {
  if (revealRect) return { pageIndex: revealRect.pageIndex, rect: revealRect };
  const pageIndex = page ?? defaultPage;
  return pageIndex === undefined ? null : { pageIndex, rect: null };
}

/**
 * Turns each newly opened document, and changes of `page` and `revealRect`, into one pending
 * request each. A new document drops the previous document's request and page reports, and starts
 * with the caller's current request even when its value has not changed.
 */
function useNavigationRequests(
  options: Pick<
    UsePdfNavigationOptions,
    'page' | 'defaultPage' | 'document' | 'revealRect' | 'pages'
  >,
  reportedRef: RefObject<number[]>,
  startRequest: () => number,
): RefObject<PdfTarget | null> {
  const { page, revealRect, document } = options;
  const pendingRef = useRef<PdfTarget | null>(null);
  const latestRef = useLatest(options);
  useLayoutEffect(() => {
    if (!document) return;
    reportedRef.current.length = 0;
    startRequest();
    pendingRef.current = toOpeningRequest(latestRef.current);
  }, [document, latestRef, reportedRef, startRequest]);
  useLayoutEffect(() => {
    if (page === undefined || consumeEcho(reportedRef.current, page)) return;
    startRequest();
    if (page !== latestRef.current.pages.currentPage)
      pendingRef.current = { pageIndex: page, rect: null };
  }, [page, latestRef, reportedRef, startRequest]);
  const rectKey = toRectKey(revealRect);
  useLayoutEffect(() => {
    const rect = latestRef.current.revealRect;
    if (!rect) return;
    startRequest();
    pendingRef.current = { pageIndex: rect.pageIndex, rect };
  }, [rectKey, latestRef, startRequest]);
  return pendingRef;
}

/** The order of navigation requests: only a request made after every other may still land. */
export interface PdfNavigationOrder {
  /** Counts a new navigation request and returns its ticket, superseding every earlier one. */
  startRequest(): number;
  /** Goes to `target` for the request with `ticket`, unless a newer request has started. */
  goTo(target: PdfTarget, ticket: number): void;
}

/** Starts a request each time find brings a match into view. */
function useRevealRequests(
  search: UsePdfNavigationOptions['search'],
  startRequest: () => number,
): void {
  const revealKey = search && search.total > 0 ? search.revealKey : null;
  useEffect(() => {
    if (revealKey !== null) startRequest();
  }, [revealKey, startRequest]);
}

/**
 * Going to a page or a rectangle on request, once per request: a request waits until the document
 * has opened, its page is laid out and the viewer is shown, and is then carried out. The page the
 * reader is on is reported whenever it changes. Every request is counted in one order: a new
 * document, the caller's `page` or `revealRect`, find revealing a match, and the viewer's own
 * requests started with `startRequest`; `goTo` lands only for the latest.
 */
export function usePdfNavigation(options: UsePdfNavigationOptions): PdfNavigationOrder {
  const { isReady, scale, pageCount, scrollerRef, pages } = options;
  const { currentPage, elements, scrollToPage } = pages;
  const reported = useRef<number[]>([]);
  const requestRef = useRef(0);
  const startRequest = useCallback(() => {
    requestRef.current += 1;
    return requestRef.current;
  }, []);
  const pendingRef = useNavigationRequests(options, reported, startRequest);
  useRevealRequests(options.search, startRequest);
  const latestRef = useLatest(options);
  // The page a request just went to: commits from before it landed report nothing.
  const landingRef = useRef<number | null>(null);

  const serve = useCallback(() => {
    const request = pendingRef.current;
    const scroller = scrollerRef.current;
    if (!request || !scroller || scroller.clientHeight === 0 || pageCount === 0) return;
    const pageIndex = clamp(request.pageIndex, 0, pageCount - 1);
    if (!elements.current.has(pageIndex)) return;
    pendingRef.current = null;
    // Already on its page, the request moves no page and leaves no commit to wait for.
    landingRef.current = pageIndex === latestRef.current.pages.currentPage ? null : pageIndex;
    scrollToPage(pageIndex, request.rect ? scaleRect(request.rect, scale) : undefined);
  }, [elements, latestRef, pageCount, pendingRef, scale, scrollToPage, scrollerRef]);
  useLayoutEffect(serve);
  // A hidden viewer measures nothing; being shown again is a resize.
  useResizeObserver([scrollerRef], serve);

  const lastReport = useRef<number | null>(null);
  useEffect(() => {
    if (!isReady || pendingRef.current) return;
    if (landingRef.current !== null) {
      if (landingRef.current !== currentPage) return;
      landingRef.current = null;
    }
    if (lastReport.current === currentPage) return;
    lastReport.current = currentPage;
    const { page, onPageChange } = latestRef.current;
    if (page === currentPage) return;
    if (page !== undefined) reported.current.push(currentPage);
    onPageChange?.(currentPage);
  }, [currentPage, isReady, latestRef, pendingRef]);

  const goTo = useCallback(
    (target: PdfTarget, ticket: number) => {
      if (ticket !== requestRef.current) return;
      pendingRef.current = target;
      serve();
    },
    [pendingRef, serve],
  );
  return useMemo(() => ({ startRequest, goTo }), [goTo, startRequest]);
}

/** Reports the viewports of the pages that render whenever that set or the zoom changes. */
export function usePageViewports<V extends PdfViewport, C extends PdfTextContent>({
  loaded,
  nearPages,
  scale,
  onPageViewports,
}: UsePageViewportsOptions<V, C>): void {
  const latestRef = useLatest(onPageViewports);
  useEffect(() => {
    const viewports = new Map<number, V>();
    loaded?.pages.forEach((_, pageIndex) => {
      if (nearPages && !nearPages.has(pageIndex)) return;
      const viewport = loaded.getViewport(pageIndex, scale);
      if (viewport) viewports.set(pageIndex, viewport);
    });
    latestRef.current?.(viewports);
  }, [latestRef, loaded, nearPages, scale]);
}
