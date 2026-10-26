import { findMaximum } from '../../utils/find-maximum.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { observeViewport } from './observe-viewport.js';
const emptyMetrics = {
    width: 0,
    height: 0,
    contentWidth: 0,
    contentHeight: 0,
    top: 0,
    left: 0,
    header: 0,
    rtl: false,
    lift: 0,
    trackX: 0,
    trackY: 0,
};
function isSameMetrics(left, right) {
    return Object.keys(left).every((key) => left[key] === right[key]);
}
/** Space below content shorter than the viewport, which the horizontal thumb rises over. */
function measureLift(element) {
    if (element.scrollHeight > element.clientHeight + 1 || element.children.length === 0)
        return 0;
    const top = element.getBoundingClientRect().top;
    const bottom = findMaximum(element.children, (child) => child.getBoundingClientRect().bottom - top, 0);
    return Math.max(0, Math.floor(element.clientHeight - bottom));
}
function measureHeaders(headers) {
    return findMaximum(headers, (header) => header.getBoundingClientRect().height, 0);
}
function readMetrics(element, tracks, header) {
    const rtl = element.ownerDocument.defaultView?.getComputedStyle(element).direction === 'rtl';
    return {
        width: element.clientWidth,
        height: element.clientHeight,
        contentWidth: element.scrollWidth,
        contentHeight: element.scrollHeight,
        top: element.scrollTop,
        // Right-to-left positions run from 0 down to the negative range; measure from the left.
        left: rtl ? element.scrollWidth - element.clientWidth + element.scrollLeft : element.scrollLeft,
        header,
        rtl,
        lift: measureLift(element),
        trackX: tracks.x?.clientWidth ?? 0,
        trackY: tracks.y?.clientHeight ?? 0,
    };
}
/**
 * Measures a natively scrolling viewport for overlay thumbs: its size, content size and position,
 * its registered headers and the tracks the stylesheet places. Re-measures once per animation frame
 * when any of them resizes, the content changes or `schedule` is called.
 */
export function useOverlayMetrics({ viewport, enabled, headerInset, }) {
    const headers = useRef(new Set());
    const tracks = useRef({ x: null, y: null });
    const observer = useRef(null);
    const [metrics, setMetrics] = useState(emptyMetrics);
    const registerHeader = useCallback((element) => {
        if (!element)
            return undefined;
        headers.current.add(element);
        observer.current?.observe();
        return () => {
            headers.current.delete(element);
            observer.current?.observe();
        };
    }, []);
    const verticalTrackRef = useCallback((element) => {
        tracks.current.y = element;
        observer.current?.observe();
    }, []);
    const horizontalTrackRef = useCallback((element) => {
        tracks.current.x = element;
        observer.current?.observe();
    }, []);
    const schedule = useCallback(() => observer.current?.schedule(), []);
    useEffect(() => {
        const element = viewport.current;
        const view = element?.ownerDocument.defaultView;
        if (!enabled || !element || !view)
            return undefined;
        const measure = () => {
            const header = headerInset ? measureHeaders(headers.current) : 0;
            const next = readMetrics(element, tracks.current, header);
            setMetrics((previous) => (isSameMetrics(previous, next) ? previous : next));
        };
        const getExtraTargets = () => [...headers.current, tracks.current.x, tracks.current.y];
        const current = observeViewport(element, view, { measure, getExtraTargets, subtree: true });
        observer.current = current;
        return () => {
            observer.current = null;
            current.disconnect();
        };
    }, [enabled, headerInset, viewport]);
    return {
        metrics,
        schedule,
        registerHeader: enabled && headerInset ? registerHeader : undefined,
        verticalTrackRef,
        horizontalTrackRef,
    };
}
//# sourceMappingURL=use-overlay-metrics.js.map