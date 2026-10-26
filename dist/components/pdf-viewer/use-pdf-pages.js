import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useNearPages } from './use-near-pages.js';
function visibleHeight(element, view) {
    const box = element.getBoundingClientRect();
    return Math.max(0, Math.min(box.bottom, view.bottom) - Math.max(box.top, view.top));
}
function findMostVisiblePage(elements, view) {
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
function measureAnchor(scroller, page, pageIndex) {
    const view = scroller.getBoundingClientRect();
    const box = page.getBoundingClientRect();
    return {
        pageIndex,
        fraction: box.height > 0 ? (view.top - box.top) / box.height : 0,
        centre: scroller.scrollWidth > 0
            ? (scroller.scrollLeft + scroller.clientWidth / 2) / scroller.scrollWidth
            : 0.5,
    };
}
function scrollToAnchor(scroller, page, anchor) {
    const box = page.getBoundingClientRect();
    scroller.scrollTop +=
        box.top - scroller.getBoundingClientRect().top + anchor.fraction * box.height;
    scroller.scrollLeft = anchor.centre * scroller.scrollWidth - scroller.clientWidth / 2;
}
/** The scroll position that shows a span, centred, unless the view already shows all of it. */
function revealSpan(start, size, view) {
    if (start >= view.start && start + size <= view.start + view.size)
        return view.start;
    return start + size / 2 - view.size / 2;
}
function revealInScroller(scroller, element) {
    const view = scroller.getBoundingClientRect();
    const box = element.getBoundingClientRect();
    const { scrollTop, scrollLeft } = scroller;
    scroller.scrollTop = revealSpan(scrollTop + box.top - view.top, box.height, {
        start: scrollTop,
        size: view.height,
    });
    scroller.scrollLeft = revealSpan(scrollLeft + box.left - view.left, box.width, {
        start: scrollLeft,
        size: view.width,
    });
}
/**
 * The reader's place: recorded on scroll (once per frame) and before a zoom, restored after it, and
 * reset to the top for a new document.
 */
function useScrollAnchor({ scrollerRef, document, elements, onPageChange }) {
    const anchor = useRef(null);
    const frame = useRef(null);
    const cancelFrame = useCallback(() => {
        const pending = frame.current;
        frame.current = null;
        if (pending)
            pending.view.cancelAnimationFrame(pending.id);
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
        if (!scroller)
            return;
        const pageIndex = findMostVisiblePage(elements.current, scroller.getBoundingClientRect());
        const page = elements.current.get(pageIndex);
        if (page)
            anchor.current = measureAnchor(scroller, page, pageIndex);
        if (pageIndex >= 0)
            onPageChange(pageIndex);
    }, [elements, onPageChange, scrollerRef]);
    const restoreAnchor = useCallback(() => {
        const scroller = scrollerRef.current;
        const saved = anchor.current;
        const page = saved ? elements.current.get(saved.pageIndex) : undefined;
        if (scroller && saved && page)
            scrollToAnchor(scroller, page, saved);
    }, [elements, scrollerRef]);
    const handleScroll = useCallback(() => {
        const view = scrollerRef.current?.ownerDocument.defaultView;
        if (!view || frame.current !== null)
            return;
        const pending = { view, id: 0 };
        frame.current = pending;
        pending.id = view.requestAnimationFrame(() => {
            if (frame.current !== pending)
                return;
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
export function usePdfPages({ scrollerRef, document, pageCount, }) {
    const { elements, nearPages, registerPage } = useNearPages(scrollerRef);
    const [position, setPosition] = useState({ document, currentPage: 0 });
    if (position.document !== document)
        setPosition({ document, currentPage: 0 });
    const setCurrentPage = useCallback((currentPage) => setPosition((previous) => previous.currentPage === currentPage ? previous : { ...previous, currentPage }), []);
    const anchor = useScrollAnchor({ scrollerRef, document, elements, onPageChange: setCurrentPage });
    // A page lands where the first page sits when the view is at the top. The position is recorded
    // at once, so a zoom applied before the scroll event keeps it.
    const { captureAnchor } = anchor;
    const scrollToPage = useCallback((pageIndex, rect) => {
        const scroller = scrollerRef.current;
        const page = elements.current.get(pageIndex);
        const first = elements.current.get(0);
        if (!scroller || !page || !first)
            return;
        const inset = rect ? page.clientTop + rect.top : 0;
        scroller.scrollTop = page.offsetTop - first.offsetTop + inset;
        if (rect) {
            scroller.scrollLeft = revealSpan(page.offsetLeft + page.clientLeft + rect.left, rect.width, {
                start: scroller.scrollLeft,
                size: scroller.clientWidth,
            });
        }
        captureAnchor();
        setCurrentPage(pageIndex);
    }, [captureAnchor, elements, scrollerRef, setCurrentPage]);
    const revealElement = useCallback((element) => {
        if (scrollerRef.current)
            revealInScroller(scrollerRef.current, element);
    }, [scrollerRef]);
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
//# sourceMappingURL=use-pdf-pages.js.map