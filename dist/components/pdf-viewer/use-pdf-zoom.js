import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useResizeObserver } from '../../utils/use-resize-observer.js';
import { findNextZoomLevel } from '../zoom-control/zoom-control.js';
import { findLargestPage, pdfZoomLevels, resolveZoomPercent, toCssScale, } from './pdf-zoom.js';
import { useLatest } from '../../utils/use-latest.js';
function measurePadding(element) {
    if (!element)
        return { width: 0, height: 0 };
    const style = getComputedStyle(element);
    const sum = (...values) => values.reduce((total, value) => total + (Number.parseFloat(value) || 0), 0);
    return {
        width: sum(style.paddingLeft, style.paddingRight),
        height: sum(style.paddingTop, style.paddingBottom),
    };
}
/** The space the page column offers a page: the scroller's client box less the column's padding. */
function useAvailableSize(scrollerRef, pagesRef) {
    const [available, setAvailable] = useState(null);
    const measure = useCallback(() => {
        const scroller = scrollerRef.current;
        if (!scroller || scroller.clientWidth === 0)
            return;
        const inset = measurePadding(pagesRef.current);
        const width = scroller.clientWidth - inset.width;
        const height = scroller.clientHeight - inset.height;
        setAvailable((previous) => previous?.width === width && previous.height === height ? previous : { width, height });
    }, [pagesRef, scrollerRef]);
    useResizeObserver([scrollerRef], measure);
    return available;
}
/** Ctrl or Command with the wheel steps the zoom instead of zooming the whole page. */
function useWheelZoom(scrollerRef, percent, setZoom) {
    useEffect(() => {
        const scroller = scrollerRef.current;
        if (!scroller)
            return undefined;
        // React registers wheel listeners as passive, so only a native listener can prevent the
        // browser's own zoom.
        const onWheel = (event) => {
            if (!event.ctrlKey && !event.metaKey)
                return;
            event.preventDefault();
            if (event.deltaY === 0)
                return;
            const level = findNextZoomLevel(pdfZoomLevels, percent, event.deltaY < 0 ? 1 : -1);
            if (level !== undefined)
                setZoom(level);
        };
        scroller.addEventListener('wheel', onWheel, { passive: false });
        return () => scroller.removeEventListener('wheel', onWheel);
    }, [percent, scrollerRef, setZoom]);
}
/**
 * The viewer's zoom: a percentage or a fit mode, resolved against the page column's size whenever it
 * changes, with the reader's place kept across every change.
 */
export function usePdfZoom(options) {
    const { defaultZoom, sizes, scrollerRef, pagesRef, pages } = options;
    const { captureAnchor, restoreAnchor } = pages;
    const [zoom, setZoomState] = useState(defaultZoom);
    const available = useAvailableSize(scrollerRef, pagesRef);
    const largest = useMemo(() => findLargestPage(sizes), [sizes]);
    const percent = resolveZoomPercent({ zoom, page: largest, available });
    const scale = toCssScale(percent);
    const latest = useLatest(options);
    const setZoom = useCallback((next) => {
        captureAnchor();
        setZoomState(next);
    }, [captureAnchor]);
    useWheelZoom(scrollerRef, percent, setZoom);
    useLayoutEffect(() => restoreAnchor(), [scale, restoreAnchor]);
    useEffect(() => {
        if (largest)
            latest.current.onZoomChange?.(percent);
    }, [largest, percent, latest]);
    return { zoom, percent, scale, setZoom };
}
//# sourceMappingURL=use-pdf-zoom.js.map