import { jsx as _jsx } from "react/jsx-runtime";
import { useRef, useState } from 'react';
import { useLocale } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import { mergeClassNames } from '../../core/hooks.js';
import { Modal } from '../modal/modal.js';
import { defaultZoomLevels, findNextZoomLevel } from '../zoom-control/zoom-control.js';
import { resolveMediaKey } from './media-layout.js';
import { MediaStage } from './media-stage.js';
import { MediaHeaderActions, MediaThumbnails, isImageItem, mediaViewerHooks as hooks, } from './media-viewer-parts.js';
/** Whether the arrow keys scroll the image: focus is in the viewport and the image is wider. */
function isPanning(viewport, target) {
    return (viewport !== null &&
        target instanceof Node &&
        viewport.contains(target) &&
        viewport.scrollWidth > viewport.clientWidth);
}
/** The zoom a key asks for, or the current one when there is no level that way. */
function stepZoom(zoom, command) {
    return findNextZoomLevel(defaultZoomLevels, zoom, command === 'zoom-in' ? 1 : -1) ?? zoom;
}
/**
 * A lightbox over the page, on the library's `Modal`: it shows one file of a set at a time with its
 * name and caption, moves to the previous and next file from buttons, a thumbnail strip and the
 * arrow keys, and zooms (`ZoomControl`, `+` and `-`), turns and scrolls images. Other files, such as
 * PDFs, render through `renderItem`. Each file with a download URL offers a Download link. Escape
 * closes it.
 */
export function MediaViewer({ items, selectedKey, defaultSelectedKey, onSelectionChange, renderItem, className, ...rest }) {
    const { direction } = useLocale();
    const [key, setKey] = useControllableState(selectedKey, defaultSelectedKey ?? items[0]?.id, (next) => {
        if (next !== undefined)
            onSelectionChange?.(next);
    });
    const [ownView, setView] = useState({ key, zoom: 100, rotation: 0 });
    const viewportRef = useRef(null);
    const index = Math.max(0, items.findIndex((entry) => entry.id === key));
    const item = items[index];
    if (!item)
        return null;
    const view = ownView.key === item.id ? ownView : { key: item.id, zoom: 100, rotation: 0 };
    // Moving to another item shows it afresh, so coming back to one shows it at 100% again.
    if (view !== ownView)
        setView(view);
    const move = (offset) => {
        const target = items[index + offset];
        return target ? () => setKey(target.id) : undefined;
    };
    const onKeyDown = (event) => {
        const panning = isPanning(viewportRef.current, event.target);
        const command = resolveMediaKey(event.nativeEvent, direction, panning);
        if (!command)
            return;
        event.preventDefault();
        if (command === 'previous' || command === 'next')
            move(command === 'next' ? 1 : -1)?.();
        else if (isImageItem(item))
            setView({ ...view, zoom: stepZoom(view.zoom, command) });
    };
    return (_jsx(Modal, { ...rest, className: mergeClassNames(hooks.className, className), title: item.name, description: item.caption, size: "full", bodyLayout: "column", showCloseButton: true, initialFocus: viewportRef, onKeyDown: onKeyDown, headerActions: _jsx(MediaHeaderActions, { item: item, position: index + 1, count: items.length, zoom: view.zoom, onZoomChange: (zoom) => setView({ ...view, zoom }), onRotate: () => setView({ ...view, rotation: (view.rotation + 90) % 360 }) }), footerContent: items.length > 1 ? (_jsx(MediaThumbnails, { items: items, current: item.id, onSelect: setKey })) : null, children: _jsx(MediaStage, { item: item, zoom: view.zoom, rotation: view.rotation, viewportRef: viewportRef, hasSiblings: items.length > 1, onPrevious: move(-1), onNext: move(1), renderItem: renderItem }) }));
}
//# sourceMappingURL=media-viewer.js.map