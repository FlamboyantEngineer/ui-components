import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useRef } from 'react';
import { highlightTextRuns } from './highlights.js';
import { pdfViewerHooks as hooks } from './styling-hooks.js';
import { measureCanvasPixels, usePageRender } from './use-page-render.js';
/** Marks the page's matches in its text layer and brings a newly current match into view. */
function useMatchHighlights({ textLayer, ranges, revealKey, revealElement, }) {
    const revealed = useRef(-1);
    useEffect(() => {
        if (!textLayer || ranges.length === 0)
            return undefined;
        const highlighted = highlightTextRuns({
            runs: textLayer.textDivs,
            texts: textLayer.textContentItemsStr,
            ranges,
        });
        if (highlighted.current && revealed.current !== revealKey) {
            revealed.current = revealKey;
            revealElement(highlighted.current);
        }
        return highlighted.restore;
    }, [ranges, revealElement, revealKey, textLayer]);
}
/**
 * One page: its bitmap with the selectable text layer and the links over it, sized to the zoom.
 */
export function PdfViewerPage({ loaded, pageIndex, scale, isNear, ranges, revealKey, pages, linkService, renderOverlay, }) {
    const { registerPage, revealElement } = pages;
    const canvasRef = useRef(null);
    const layerRef = useRef(null);
    const annotationLayerRef = useRef(null);
    const pageRef = useCallback((element) => registerPage(pageIndex, element), [pageIndex, registerPage]);
    const textLayer = usePageRender({
        loaded,
        pageIndex,
        scale,
        isNear,
        canvasRef,
        layerRef,
        annotationLayerRef,
        linkService,
    });
    useMatchHighlights({ textLayer, ranges, revealKey, revealElement });
    const size = loaded.sizes[pageIndex] ?? { width: 0, height: 0 };
    const width = size.width * scale;
    const height = size.height * scale;
    const pixels = isNear ? measureCanvasPixels(width, height) : { width: 0, height: 0 };
    const viewport = isNear ? loaded.getViewport(pageIndex, scale) : undefined;
    return (_jsxs("div", { ...hooks.slot('page'), ref: pageRef, style: { position: 'relative', width, height }, children: [_jsx("canvas", { ...hooks.slot('canvas'), ref: canvasRef, width: pixels.width, height: pixels.height, style: { position: 'absolute', left: 0, top: 0, width, height }, "aria-hidden": "true" }), _jsx("div", { ...hooks.slot('text-layer'), ref: layerRef, style: { position: 'absolute', inset: 0 } }), _jsx("div", { ...hooks.slot('annotation-layer'), ref: annotationLayerRef, style: { position: 'absolute', inset: 0, pointerEvents: 'none' } }), renderOverlay && viewport ? (_jsx("div", { ...hooks.slot('overlay'), style: { position: 'absolute', inset: 0, pointerEvents: 'none' }, children: renderOverlay({ pageIndex, viewport }) })) : null] }));
}
//# sourceMappingURL=pdf-viewer-page.js.map