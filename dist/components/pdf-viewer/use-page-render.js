import { useEffect, useState } from 'react';
import { createAnnotationLayer, createTextLayer, } from './pdf-engine.js';
// The engine's own default ceiling for one page bitmap.
const maxCanvasPixels = 2 ** 25;
const ignore = () => undefined;
/** Builds the page's text layer in `container` and reports it once rendered; returns a cancel. */
function buildTextLayer({ loaded, pageIndex, viewport }, container, onRendered) {
    let layer = null;
    let isCancelled = false;
    loaded
        .getTextContent(pageIndex)
        .then((content) => {
        if (isCancelled)
            return undefined;
        const created = createTextLayer(loaded.engine, {
            textContentSource: content,
            container,
            viewport,
        });
        layer = created;
        return created.render().then(() => {
            if (!isCancelled)
                onRendered(created);
        });
    })
        .catch(ignore);
    return () => {
        isCancelled = true;
        layer?.cancel();
        container.replaceChildren();
    };
}
function isLink(annotation) {
    return (typeof annotation === 'object' &&
        annotation !== null &&
        'subtype' in annotation &&
        annotation.subtype === 'Link');
}
/**
 * Builds the page's links in `div` when it has any; returns a cancel. Other annotations show as the
 * bitmap draws them.
 */
function buildAnnotationLayer({ loaded, page, viewport }, div, linkService) {
    let layer = null;
    let isCancelled = false;
    page
        .getAnnotations({ intent: 'display' })
        .then((annotations) => {
        const links = annotations.filter(isLink);
        if (isCancelled || links.length === 0)
            return undefined;
        layer = createAnnotationLayer(loaded.engine, { div, page, viewport, linkService });
        return layer.render({
            annotations: links,
            viewport,
            div,
            page,
            linkService,
            renderForms: false,
        });
    })
        .catch(ignore);
    return () => {
        isCancelled = true;
        layer?.destroy();
        div.replaceChildren();
    };
}
/**
 * Starts drawing a page bitmap into `canvas`, scaled from the viewport to the canvas's device
 * pixels, with its annotations' appearances unless the document hides them.
 */
export function renderPageBitmap({ loaded, page, viewport }, canvas) {
    const ratio = viewport.width > 0 ? canvas.width / viewport.width : 1;
    return page.render({
        canvas,
        viewport,
        transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0],
        annotationMode: loaded.hidesAnnotations
            ? loaded.engine.AnnotationMode.DISABLE
            : loaded.engine.AnnotationMode.ENABLE,
    });
}
/** Draws a page bitmap into `canvas`; returns a cancel. */
export function drawPage(bitmap, canvas) {
    const task = renderPageBitmap(bitmap, canvas);
    task.promise.catch(ignore);
    return () => task.cancel();
}
/** A page bitmap's size in device pixels, capped so a deep zoom stays within memory. */
export function measureCanvasPixels(width, height) {
    const area = width * height;
    const deviceRatio = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
    const ratio = area > 0 ? Math.min(deviceRatio, Math.sqrt(maxCanvasPixels / area)) : 0;
    return { width: Math.floor(width * ratio), height: Math.floor(height * ratio) };
}
/**
 * Draws a page into its canvas and builds its text and annotation layers while the page is near
 * the view, again at every scale and rotation. Returns the text layer once it has rendered.
 */
export function usePageRender({ loaded, pageIndex, scale, isNear, canvasRef, layerRef, annotationLayerRef, linkService, }) {
    const [textLayer, setTextLayer] = useState(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = layerRef.current;
        const annotationLayer = annotationLayerRef.current;
        const page = loaded.pages[pageIndex];
        const viewport = loaded.getViewport(pageIndex, scale);
        if (!isNear || !canvas || !container || !annotationLayer || !page || !viewport) {
            return undefined;
        }
        const drawing = { loaded, page, pageIndex, viewport };
        const cancels = [
            drawPage(drawing, canvas),
            buildTextLayer(drawing, container, setTextLayer),
            loaded.hidesAnnotations ? null : buildAnnotationLayer(drawing, annotationLayer, linkService),
        ];
        return () => {
            for (const cancel of cancels)
                cancel?.();
            setTextLayer(null);
        };
    }, [annotationLayerRef, canvasRef, isNear, layerRef, linkService, loaded, pageIndex, scale]);
    return textLayer;
}
//# sourceMappingURL=use-page-render.js.map