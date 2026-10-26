import { useEffect, useLayoutEffect, useRef } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { clamp } from '../../utils/clamp.js';
import { useElementSize } from '../../utils/use-element-size.js';
import { defaultZoomLevels, findNextZoomLevel } from '../zoom-control/zoom-control.js';
import { fitDiagramViewport, zoomDiagramViewport } from './diagram-model.js';
export const diagramZoomRange = [
    defaultZoomLevels[0],
    defaultZoomLevels[defaultZoomLevels.length - 1],
];
const fitPadding = 24;
const revealMargin = 16;
const wheelZoomRate = 1 / 300;
const startViewport = { x: 0, y: 0, zoom: 100 };
/** The pan offset along one axis that brings `[start, end]` inside `[0, size]`. */
function revealAxis(offset, [start, end], size) {
    if (start < revealMargin)
        return offset + revealMargin - start;
    if (end > size - revealMargin)
        return offset - Math.min(end - size + revealMargin, start - revealMargin);
    return offset;
}
/** The wheel pans the view, or zooms it around the pointer with Ctrl or Command. */
function useWheel(element, state) {
    const latest = useRef(state);
    latest.current = state;
    useEffect(() => {
        if (!element)
            return undefined;
        // React registers wheel listeners as passive, so only a native listener can keep the page from
        // scrolling or zooming.
        const onWheel = (event) => {
            event.preventDefault();
            const { viewport, setViewport, zoomTo } = latest.current;
            if (event.ctrlKey || event.metaKey) {
                const box = element.getBoundingClientRect();
                const at = { x: event.clientX - box.left, y: event.clientY - box.top };
                zoomTo(viewport.zoom * 2 ** (-event.deltaY * wheelZoomRate), at);
                return;
            }
            setViewport({ ...viewport, x: viewport.x - event.deltaX, y: viewport.y - event.deltaY });
        };
        element.addEventListener('wheel', onWheel, { passive: false });
        return () => element.removeEventListener('wheel', onWheel);
    }, [element]);
}
/**
 * The canvas's pan and zoom, controlled or not. Without a viewport from the caller, the view fits
 * every node once the viewport element is first measured.
 */
export function useDiagramViewport(options) {
    const { element, bounds } = options;
    const isGiven = options.viewport !== undefined || options.defaultViewport !== undefined;
    const [viewport, setViewport] = useControllableState(options.viewport, options.defaultViewport ?? startViewport, options.onViewportChange);
    const size = useElementSize(element, { box: 'client' });
    const zoomTo = (zoom, at) => {
        const point = at ?? { x: (size?.width ?? 0) / 2, y: (size?.height ?? 0) / 2 };
        const next = clamp(zoom, diagramZoomRange[0], diagramZoomRange[1]);
        setViewport(zoomDiagramViewport(viewport, { zoom: next, at: point }));
    };
    const fit = () => {
        if (!size || !bounds)
            return;
        const padded = {
            x: bounds.x - fitPadding,
            y: bounds.y - fitPadding,
            width: bounds.width + fitPadding * 2,
            height: bounds.height + fitPadding * 2,
        };
        setViewport(fitDiagramViewport({ bounds: padded, size, zoomRange: [diagramZoomRange[0], 100] }));
    };
    const reveal = (rect) => {
        if (!size)
            return;
        const factor = viewport.zoom / 100;
        const x = revealAxis(viewport.x, [viewport.x + rect.x * factor, viewport.x + (rect.x + rect.width) * factor], size.width);
        const y = revealAxis(viewport.y, [viewport.y + rect.y * factor, viewport.y + (rect.y + rect.height) * factor], size.height);
        if (x !== viewport.x || y !== viewport.y)
            setViewport({ ...viewport, x, y });
    };
    const stepZoom = (direction) => {
        const level = findNextZoomLevel(defaultZoomLevels, viewport.zoom, direction);
        if (level !== undefined)
            zoomTo(level);
    };
    const state = { viewport, setViewport, zoomTo, stepZoom, fit, reveal, size };
    useWheel(element, state);
    const fitted = useRef(isGiven);
    const latestFit = useRef(fit);
    latestFit.current = fit;
    useLayoutEffect(() => {
        // An unstyled viewport may measure empty before the host stylesheet loads; fit once it has room.
        if (fitted.current || !size || size.width === 0 || size.height === 0 || !bounds)
            return;
        fitted.current = true;
        latestFit.current();
    }, [size, bounds]);
    return state;
}
//# sourceMappingURL=use-diagram-viewport.js.map