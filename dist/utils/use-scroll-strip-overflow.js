import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState, } from 'react';
import { useResizeObserver } from './use-resize-observer.js';
/** Fraction of the visible width a page scroll moves a strip. */
const pageFraction = 0.8;
// Popups opened inside a strip scroll themselves, so their wheel input is left alone.
const popupSelector = '[role="menu"], [role="listbox"], [role="dialog"]';
const wheelLineHeight = 16;
function getFrameApi(element) {
    const view = element?.ownerDocument.defaultView ?? window;
    return {
        request: (callback) => view.requestAnimationFrame(callback),
        cancel: (id) => view.cancelAnimationFrame(id),
    };
}
function isRtl(element) {
    const view = element.ownerDocument.defaultView;
    return view ? view.getComputedStyle(element).direction === 'rtl' : false;
}
/** Whether wheel input reached the strip itself rather than a modified wheel or a popup inside it. */
function isStripWheel(strip, event) {
    if (event.ctrlKey || event.metaKey)
        return false;
    const path = event.composedPath();
    const index = path.indexOf(strip);
    if (index < 0)
        return false;
    return !path
        .slice(0, index)
        .some((node) => node instanceof Element && node.matches(popupSelector));
}
/** The strip's next scroll position for wheel input along its dominant axis, or null for none. */
function resolveWheelScrollPosition(strip, event) {
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    const range = Math.max(0, strip.scrollWidth - strip.clientWidth);
    if (delta === 0 || range === 0)
        return null;
    const unit = event.deltaMode === 1 ? wheelLineHeight : event.deltaMode === 2 ? strip.clientWidth : 1;
    // Right-to-left scroll positions run from 0 down to -range.
    const rtl = isRtl(strip);
    const offset = (rtl ? -delta : delta) * unit;
    const next = Math.min(rtl ? 0 : range, Math.max(rtl ? -range : 0, strip.scrollLeft + offset));
    return next === strip.scrollLeft ? null : next;
}
/**
 * Attaches `attach` to the strip element and detaches it when the element or `attach` changes,
 * checking after every commit like `useResizeObserver`, so a strip that mounts after the first
 * render, or is replaced, is attached too. `attach` should keep its identity between renders.
 */
function useStripAttachment(stripRef, attach) {
    const attached = useRef(null);
    useLayoutEffect(() => {
        const strip = stripRef.current;
        const current = attached.current;
        if (current?.strip === strip && current.attach === attach)
            return;
        current?.detach();
        attached.current = strip && attach ? { strip, attach, detach: attach(strip) } : null;
    });
    useLayoutEffect(() => () => {
        attached.current?.detach();
        attached.current = null;
    }, []);
}
/** Lets the vertical wheel scroll a horizontal strip. */
function useWheelScrolling(stripRef, horizontal, onWheelScroll) {
    const onWheelScrollRef = useRef(onWheelScroll);
    useEffect(() => {
        onWheelScrollRef.current = onWheelScroll;
    }, [onWheelScroll]);
    const attach = useCallback((strip) => {
        const onWheel = (event) => {
            if (!isStripWheel(strip, event))
                return;
            const next = resolveWheelScrollPosition(strip, event);
            if (next === null)
                return;
            event.preventDefault();
            strip.scrollLeft = next;
            onWheelScrollRef.current?.();
        };
        strip.addEventListener('wheel', onWheel, { capture: true, passive: false });
        return () => strip.removeEventListener('wheel', onWheel, { capture: true });
    }, []);
    useStripAttachment(stripRef, horizontal ? attach : null);
}
/**
 * Scrolls a strip to a physical `scrollLeft`. `auto` follows the stylesheet's `scroll-behavior`;
 * `instant` skips any smooth scrolling, for focus that must land at once.
 */
export function scrollStripTo(strip, left, behavior) {
    if (typeof strip.scrollTo === 'function')
        strip.scrollTo({ left, behavior });
    else
        strip.scrollLeft = left;
}
/**
 * Scrolls a horizontal strip by most of its visible width toward its `start` or `end` edge, as a
 * scroll button does. Right-to-left strips (`rtl`, from the locale) scroll with negative offsets.
 */
export function scrollStripPage(strip, { edge, rtl }) {
    const step = Math.max(1, strip.clientWidth * pageFraction);
    const range = Math.max(0, strip.scrollWidth - strip.clientWidth);
    const position = Math.abs(strip.scrollLeft) + (edge === 'end' ? step : -step);
    const next = Math.min(range, Math.max(0, position));
    scrollStripTo(strip, rtl ? -next : next, 'auto');
}
/**
 * Tracks whether a scrolling strip (a row of tabs or tools) hides content past either edge, so the
 * stylesheet can draw a fade there, and lets the vertical wheel scroll a horizontal strip. Scrolling
 * stays free: no snapping, paging or stepper buttons. Measurements coalesce to one read per animation
 * frame and resync when the strip or its children resize and when children mount or unmount. A strip
 * that mounts after the first render, or is replaced, is followed too. Right-to-left strips report
 * and scroll from their inline start.
 */
export function useScrollStripOverflow(stripRef, { orientation = 'horizontal', onWheelScroll } = {}) {
    const horizontal = orientation === 'horizontal';
    useWheelScrolling(stripRef, horizontal, onWheelScroll);
    const [overflow, setOverflow] = useState({ start: false, end: false });
    const pending = useRef(null);
    const syncOverflow = useCallback(() => {
        if (pending.current)
            return;
        const frames = getFrameApi(stripRef.current);
        const id = frames.request(() => {
            pending.current = null;
            const strip = stripRef.current;
            if (!strip)
                return;
            const position = Math.abs(horizontal ? strip.scrollLeft : strip.scrollTop);
            const visible = horizontal ? strip.clientWidth : strip.clientHeight;
            const total = horizontal ? strip.scrollWidth : strip.scrollHeight;
            const start = position > 1;
            const end = position + visible < total - 1;
            setOverflow((current) => current.start === start && current.end === end ? current : { start, end });
        });
        pending.current = { id, cancel: frames.cancel };
    }, [horizontal, stripRef]);
    useEffect(() => {
        syncOverflow();
        return () => {
            if (pending.current)
                pending.current.cancel(pending.current.id);
            pending.current = null;
        };
    }, [syncOverflow]);
    const [, refreshTargets] = useReducer((generation) => generation + 1, 0);
    useResizeObserver(() => {
        const strip = stripRef.current;
        return strip ? [strip, ...Array.from(strip.children)] : [];
    }, syncOverflow);
    const observeChildren = useCallback((strip) => {
        const Observer = strip.ownerDocument.defaultView?.MutationObserver;
        // A strip that mounts late is measured as it arrives.
        syncOverflow();
        if (!Observer)
            return () => undefined;
        // A new child can be wider than the space it fills without resizing the strip itself.
        const mutations = new Observer(() => {
            refreshTargets();
            syncOverflow();
        });
        mutations.observe(strip, { childList: true });
        return () => mutations.disconnect();
    }, [syncOverflow]);
    useStripAttachment(stripRef, observeChildren);
    return { overflow, syncOverflow };
}
//# sourceMappingURL=use-scroll-strip-overflow.js.map