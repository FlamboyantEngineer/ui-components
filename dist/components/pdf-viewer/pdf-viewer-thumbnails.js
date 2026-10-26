import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { ListBox, ListBoxItem } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { useElementSize } from '../../utils/use-element-size.js';
import { useInView } from '../../utils/use-in-view.js';
import { pdfViewerHooks as hooks } from './styling-hooks.js';
import { drawPage, measureCanvasPixels } from './use-page-render.js';
import { toPageRotation } from './use-pdf-document.js';
const noSize = { width: 0, height: 0 };
function readSelectedPage(keys) {
    if (keys === 'all')
        return null;
    const [key] = keys;
    return typeof key === 'number' ? key : null;
}
/**
 * One page drawn as wide as its item, and only while the item is within a sidebar's height of the
 * view. The stylesheet sizes the item; the canvas follows it.
 */
function PdfThumbnailCanvas({ view, pageIndex, }) {
    // The item mounts with the canvas, inside React Aria's collection, so both are held in state.
    const [canvas, setCanvas] = useState(null);
    const item = canvas?.parentElement ?? null;
    const isInView = useInView(item, { scrollOffset: 1 });
    const width = useElementSize(item)?.width ?? 0;
    const page = view.sizes[pageIndex] ?? noSize;
    const height = page.width > 0 ? (width * page.height) / page.width : 0;
    const pixels = isInView ? measureCanvasPixels(width, height) : noSize;
    useEffect(() => {
        const pdfPage = view.pages[pageIndex];
        if (!canvas || !pdfPage || pixels.width === 0 || page.width === 0)
            return undefined;
        const rotation = toPageRotation(pdfPage, view.rotation);
        const viewport = pdfPage.getViewport({ scale: width / page.width, rotation });
        return drawPage({ loaded: view, page: pdfPage, viewport }, canvas);
    }, [canvas, page.width, pageIndex, pixels.height, pixels.width, view, width]);
    return (_jsx("canvas", { ...hooks.slot('thumbnail-canvas'), ref: setCanvas, width: pixels.width, height: pixels.height, style: { width, height }, "aria-hidden": "true" }));
}
/** The pages as thumbnails, the current one selected; choosing one goes to its page. */
export function PdfViewerThumbnails({ view, currentPage, onPageChange, }) {
    const strings = useUiStrings();
    return (_jsx(ListBox, { "aria-label": strings.pages, className: hooks.slotClass('thumbnails'), selectionMode: "single", disallowEmptySelection: true, selectedKeys: [currentPage], onSelectionChange: (keys) => {
            const pageIndex = readSelectedPage(keys);
            if (pageIndex !== null)
                onPageChange(pageIndex);
        }, children: view.pages.map((_, pageIndex) => (_jsxs(ListBoxItem, { id: pageIndex, textValue: strings.pageNumber(pageIndex + 1), "aria-label": strings.pageNumber(pageIndex + 1), className: hooks.slotClass('thumbnail'), children: [_jsx(PdfThumbnailCanvas, { view: view, pageIndex: pageIndex }), _jsx("span", { ...hooks.slot('thumbnail-label'), children: pageIndex + 1 })] }, pageIndex))) }));
}
//# sourceMappingURL=pdf-viewer-thumbnails.js.map