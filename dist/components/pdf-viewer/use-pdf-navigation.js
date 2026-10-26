import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { useResizeObserver } from '../../utils/use-resize-observer.js';
import { clamp } from '../../utils/clamp.js';
import { useLatest } from '../../utils/use-latest.js';
function toRectKey(rect) {
    return rect ? [rect.pageIndex, rect.left, rect.top, rect.width, rect.height].join(' ') : '';
}
function scaleRect(rect, scale) {
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
function consumeEcho(reported, page) {
    const at = reported.lastIndexOf(page);
    if (at === -1) {
        reported.length = 0;
        return false;
    }
    reported.splice(0, at + 1);
    return true;
}
/**
 * Turns a new document with `defaultPage`, and changes of `page` and `revealRect`, into one pending
 * request each.
 */
function useNavigationRequests(options, reported) {
    const { page, revealRect, document } = options;
    const pending = useRef(null);
    const latest = useLatest(options);
    useLayoutEffect(() => {
        const { defaultPage, page: current } = latest.current;
        if (document && defaultPage !== undefined && current === undefined) {
            pending.current = { pageIndex: defaultPage, rect: null };
        }
    }, [document, latest]);
    useLayoutEffect(() => {
        if (page === undefined || consumeEcho(reported.current, page))
            return;
        if (page !== latest.current.pages.currentPage)
            pending.current = { pageIndex: page, rect: null };
    }, [page, latest, reported]);
    const rectKey = toRectKey(revealRect);
    useLayoutEffect(() => {
        const rect = latest.current.revealRect;
        if (rect)
            pending.current = { pageIndex: rect.pageIndex, rect };
    }, [rectKey, latest]);
    return pending;
}
/**
 * Going to a page or a rectangle on request, once per request: a request waits until the document
 * has opened, its page is laid out and the viewer is shown, and is then carried out. The page the
 * reader is on is reported whenever it changes. `goTo` makes a request of the viewer's own.
 */
export function usePdfNavigation(options) {
    const { isReady, scale, pageCount, scrollerRef, pages } = options;
    const { currentPage, elements, scrollToPage } = pages;
    const reported = useRef([]);
    const pending = useNavigationRequests(options, reported);
    const latest = useLatest(options);
    const serve = useCallback(() => {
        const request = pending.current;
        const scroller = scrollerRef.current;
        if (!request || !scroller || scroller.clientHeight === 0 || pageCount === 0)
            return;
        const pageIndex = clamp(request.pageIndex, 0, pageCount - 1);
        if (!elements.current.has(pageIndex))
            return;
        pending.current = null;
        scrollToPage(pageIndex, request.rect ? scaleRect(request.rect, scale) : undefined);
    }, [elements, pageCount, pending, scale, scrollToPage, scrollerRef]);
    useLayoutEffect(serve);
    // A hidden viewer measures nothing; being shown again is a resize.
    useResizeObserver([scrollerRef], serve);
    const lastReport = useRef(null);
    useEffect(() => {
        if (!isReady || pending.current || lastReport.current === currentPage)
            return;
        lastReport.current = currentPage;
        const { page, onPageChange } = latest.current;
        if (page === currentPage)
            return;
        if (page !== undefined)
            reported.current.push(currentPage);
        onPageChange?.(currentPage);
    }, [currentPage, isReady, latest, pending]);
    const goTo = useCallback((target) => {
        pending.current = target;
        serve();
    }, [pending, serve]);
    return { goTo };
}
/** Reports the viewports of the pages that render whenever that set or the zoom changes. */
export function usePageViewports({ loaded, nearPages, scale, onPageViewports, }) {
    const latest = useLatest(onPageViewports);
    useEffect(() => {
        const viewports = new Map();
        loaded?.pages.forEach((_, pageIndex) => {
            if (nearPages && !nearPages.has(pageIndex))
                return;
            const viewport = loaded.getViewport(pageIndex, scale);
            if (viewport)
                viewports.set(pageIndex, viewport);
        });
        latest.current?.(viewports);
    }, [latest, loaded, nearPages, scale]);
}
//# sourceMappingURL=use-pdf-navigation.js.map