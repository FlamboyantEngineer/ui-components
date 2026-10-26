import { useCallback } from 'react';
import { findNextZoomLevel } from '../zoom-control/zoom-control.js';
import { pdfZoomLevels } from './pdf-zoom.js';
import { useLatest } from '../../utils/use-latest.js';
/** The viewer shortcut a key pressed with Ctrl or Command stands for. */
export function readShortcut(key) {
    switch (key.toLowerCase()) {
        case 'f':
            return 'find';
        case '+':
        case '=':
            return 'zoom-in';
        case '-':
            return 'zoom-out';
        case '0':
            return 'zoom-reset';
        default:
            return null;
    }
}
/** The page a page key leads to, or `null` when the key keeps its native scrolling. */
export function readPageKey(key, { currentPage, pageCount, isPageFit, }) {
    if (key === 'Home')
        return 0;
    if (key === 'End')
        return pageCount - 1;
    // A page that fits the view turns with Page Up and Page Down; a larger one scrolls through.
    if (!isPageFit)
        return null;
    if (key === 'PageDown')
        return Math.min(currentPage + 1, pageCount - 1);
    if (key === 'PageUp')
        return Math.max(currentPage - 1, 0);
    return null;
}
/**
 * The viewer's keyboard: Ctrl or Command with F focuses the find field, with + and - steps the zoom
 * and with 0 returns to the opening zoom, instead of the browser's own. In the page scroller, Home
 * and End go to the first and last page, and Page Up and Page Down turn pages that fit the view.
 */
export function usePdfKeyboard(options) {
    const latest = useLatest(options);
    const onViewerKeyDown = useCallback((event) => {
        if (!(event.ctrlKey || event.metaKey) || event.altKey)
            return;
        const shortcut = readShortcut(event.key);
        if (event.shiftKey && shortcut !== 'zoom-in')
            return;
        const { isReady, zoom, defaultZoom, findFieldRef } = latest.current;
        const field = findFieldRef.current;
        if (shortcut === 'find' && field) {
            event.preventDefault();
            field.focus();
            field.select();
            return;
        }
        if (!isReady || shortcut === null || shortcut === 'find')
            return;
        event.preventDefault();
        if (shortcut === 'zoom-reset')
            return zoom.setZoom(defaultZoom);
        const level = findNextZoomLevel(pdfZoomLevels, zoom.percent, shortcut === 'zoom-in' ? 1 : -1);
        if (level !== undefined)
            zoom.setZoom(level);
    }, [latest]);
    const onScrollerKeyDown = useCallback((event) => {
        const { isReady, pages, pageCount, zoom } = latest.current;
        const isOwn = event.target instanceof Node && event.currentTarget.contains(event.target);
        if (!isReady || !isOwn || event.ctrlKey || event.metaKey || event.altKey)
            return;
        const pageIndex = readPageKey(event.key, {
            currentPage: pages.currentPage,
            pageCount,
            isPageFit: zoom.zoom === 'page-fit',
        });
        if (pageIndex === null)
            return;
        event.preventDefault();
        pages.scrollToPage(pageIndex);
    }, [latest]);
    return { onViewerKeyDown, onScrollerKeyDown };
}
//# sourceMappingURL=use-pdf-keyboard.js.map