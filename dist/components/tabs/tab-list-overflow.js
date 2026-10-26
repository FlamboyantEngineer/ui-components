import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useResizeObserver } from '../../utils/use-resize-observer.js';
function prefersReducedMotion() {
    return typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false;
}
function isOverflowing(list, orientation) {
    return orientation === 'vertical'
        ? list.scrollHeight > list.clientHeight + 1
        : list.scrollWidth > list.clientWidth + 1;
}
/**
 * Scrolls an overflowing list so `tab` sits as close to its middle as the scroll range allows.
 * Right-to-left lists scroll with negative offsets.
 */
function centerTab(list, tab, orientation) {
    if (!isOverflowing(list, orientation))
        return;
    const listBox = list.getBoundingClientRect();
    const tabBox = tab.getBoundingClientRect();
    const vertical = orientation === 'vertical';
    const range = vertical
        ? list.scrollHeight - list.clientHeight
        : list.scrollWidth - list.clientWidth;
    const position = vertical ? list.scrollTop : list.scrollLeft;
    const delta = vertical
        ? tabBox.top + tabBox.height / 2 - (listBox.top + list.clientTop + list.clientHeight / 2)
        : tabBox.left + tabBox.width / 2 - (listBox.left + list.clientLeft + list.clientWidth / 2);
    const rtl = !vertical && getComputedStyle(list).direction === 'rtl';
    const [min, max] = rtl ? [-range, 0] : [0, range];
    const target = Math.min(Math.max(position + delta, min), max);
    const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
    if (typeof list.scrollTo === 'function') {
        list.scrollTo(vertical ? { top: target, behavior } : { left: target, behavior });
    }
    else if (vertical) {
        list.scrollTop = target;
    }
    else {
        list.scrollLeft = target;
    }
}
/** Whether the list's tabs do not fit, measured after every commit and when the list resizes. */
export function useListOverflow(listRef, orientation) {
    const [overflowing, setOverflowing] = useState(false);
    const measure = useCallback(() => {
        const list = listRef.current;
        if (list)
            setOverflowing(isOverflowing(list, orientation));
    }, [listRef, orientation]);
    // Tabs added, removed or relabelled re-render the list.
    useLayoutEffect(measure);
    useResizeObserver([listRef], measure);
    return overflowing;
}
/** Scrolls the selected tab toward the middle of an overflowing list, once per selection. */
export function useCenterSelectedTab(listRef, { orientation, selectedKey }) {
    const latestKey = useRef(selectedKey);
    const centeredKey = useRef(null);
    const frame = useRef(null);
    // Tabs mount after the collection is built, so this checks every commit. Centering waits a frame:
    // the first press into the list moves focus there, and React Aria then restores the list's
    // previous scroll position.
    useEffect(() => {
        latestKey.current = selectedKey;
        if (selectedKey === null || centeredKey.current === selectedKey || frame.current !== null)
            return;
        frame.current = requestAnimationFrame(() => {
            frame.current = null;
            const list = listRef.current;
            const tab = list?.querySelector('[role="tab"][aria-selected="true"]');
            if (!list || !tab)
                return;
            centeredKey.current = latestKey.current;
            centerTab(list, tab, orientation);
        });
    });
    useEffect(() => () => {
        if (frame.current !== null)
            cancelAnimationFrame(frame.current);
    }, []);
}
//# sourceMappingURL=tab-list-overflow.js.map