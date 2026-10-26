import { useCallback } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { copyText } from '../../utils/clipboard.js';
import { useMenuController } from '../context-menu/context-menu.js';
import { findPageIndex, locateRange, measurePageFrame, toPagePoint, } from './page-geometry.js';
import { useLatest } from '../../utils/use-latest.js';
/** The selected text and its range, when the selection lies inside `scroller`. */
function readSelection(scroller) {
    const selection = scroller.ownerDocument.getSelection();
    if (!selection || selection.rangeCount === 0)
        return null;
    const text = selection.toString();
    const range = selection.getRangeAt(0);
    if (!text.trim() || !scroller.contains(range.commonAncestorContainer))
        return null;
    return { text, range };
}
/** Copy, then the caller's entries when the selection can be placed on a page. */
function listSelectionEntries({ options, copyLabel }, { text, range }) {
    const { loaded, scale, elements, getSelectionMenuItems } = options;
    const copy = { id: 'copy', label: copyLabel, onAction: () => void copyText(text) };
    const located = locateRange(range, elements.current, scale);
    const viewport = located ? loaded?.getViewport(located.pageIndex, scale) : undefined;
    if (!located || !viewport || !getSelectionMenuItems)
        return [copy];
    return [copy, ...getSelectionMenuItems({ ...located, text, viewport })];
}
/** The caller's entries for the spot on a page the pointer is over. */
function listPageEntries({ options, target, client, }) {
    const { loaded, scale, elements, getPageMenuItems } = options;
    const pageIndex = findPageIndex(target instanceof Node ? target : null, elements.current);
    const page = elements.current.get(pageIndex);
    const viewport = loaded?.getViewport(pageIndex, scale);
    if (!page || !viewport || !getPageMenuItems)
        return [];
    const point = toPagePoint(client, measurePageFrame(page, scale));
    return getPageMenuItems({ pageIndex, point, viewport });
}
/**
 * The document's context menu: a secondary click never opens the browser's menu over the pages.
 * Over a selection inside the viewer it offers Copy and the caller's selection entries; elsewhere on
 * a page, the caller's page entries; with no entries, nothing opens.
 */
export function usePdfContextMenu(options) {
    const controller = useMenuController();
    const strings = useUiStrings();
    const latest = useLatest(options);
    const onContextMenu = useCallback((event) => {
        // A menu of the caller's own content has already answered the gesture.
        if (event.defaultPrevented)
            return;
        event.preventDefault();
        const scroller = latest.current.scrollerRef.current;
        const selection = scroller ? readSelection(scroller) : null;
        const request = {
            options: latest.current,
            target: event.target,
            client: { left: event.clientX, top: event.clientY },
            copyLabel: strings.copy,
        };
        const entries = selection
            ? listSelectionEntries(request, selection)
            : listPageEntries(request);
        if (entries.length > 0)
            controller.open({ x: event.clientX, y: event.clientY }, { items: entries });
    }, [controller, latest, strings.copy]);
    return { controller, onContextMenu };
}
//# sourceMappingURL=use-pdf-context-menu.js.map