import { useLayoutEffect, useMemo, useReducer, useRef, useState, } from 'react';
import { measureCommit, measureContentBox, tolerance, } from './overflow-measure.js';
import { flushSync } from 'react-dom';
import { useResizeObserver } from './use-resize-observer.js';
export { resolveOverflowCount } from './overflow-measure.js';
const maxCorrections = 4;
const noItems = Object.freeze([]);
function isSameList(left, right) {
    if (left === right)
        return true;
    if (!left || left.length !== right.length)
        return false;
    return left.every((item, index) => Object.is(item, right[index]));
}
function isSameRoom(container, known) {
    const { width, height } = measureContentBox(container);
    return Math.abs(width - known.width) <= tolerance && Math.abs(height - known.height) <= tolerance;
}
/** Item positions in the order they are kept: highest priority first, then from the kept end. */
function resolveKeepOrder(priorityKey, collapseFrom) {
    const priorities = priorityKey === '' ? [] : priorityKey.split(',').map(Number);
    const order = priorities.map((_, index) => index);
    return order.sort((left, right) => (priorities[right] ?? 0) - (priorities[left] ?? 0) ||
        (collapseFrom === 'start' ? right - left : left - right));
}
function splitItems(items, visibleCount, order) {
    const indices = items.map((_, index) => index);
    if (visibleCount >= items.length) {
        return { visibleItems: items, hiddenItems: noItems, visibleIndices: indices };
    }
    const kept = new Set(order.slice(0, visibleCount));
    const visibleIndices = indices.filter((index) => kept.has(index));
    return {
        visibleItems: visibleIndices.map((index) => items[index]),
        hiddenItems: indices.filter((index) => !kept.has(index)).map((index) => items[index]),
        visibleIndices,
    };
}
/**
 * Measures again, before the browser paints, once a renderer that commits after the hook (a React
 * Aria collection fills in its items one render later) puts the awaited children in place.
 */
function useLateChildren(elements, measured, remeasure) {
    useLayoutEffect(() => {
        const container = elements.container.current;
        const Observer = container?.ownerDocument.defaultView?.MutationObserver;
        if (!container || !Observer)
            return undefined;
        const observer = new Observer(() => {
            if (!measured.current.isAwaitingChildren)
                return;
            measured.current.isAwaitingChildren = false;
            flushSync(remeasure);
        });
        for (const target of [container, elements.itemContainer.current]) {
            if (target)
                observer.observe(target, { childList: true });
        }
        return () => observer.disconnect();
    }, [elements, measured, remeasure]);
}
/** Asks for a new measurement when the container's box or a rendered element's size changes. */
function useOverflowObserver(elements, measured, remeasure) {
    useResizeObserver(() => {
        const element = elements.container.current;
        if (!element)
            return [];
        const nested = elements.itemContainer.current;
        const children = [...element.children, ...(nested ? nested.children : [])].map((child) => ({
            element: child,
            box: 'border-box',
        }));
        return [element, ...children];
    }, (entries) => {
        const container = elements.container.current;
        const changed = entries.some(({ target }) => {
            if (target === container)
                return !isSameRoom(container, measured.current.room);
            const known = measured.current.observed.get(target);
            const size = target.getBoundingClientRect().width;
            return known === undefined || Math.abs(known - size) > tolerance;
        });
        if (changed)
            remeasure();
    });
}
/** The elements the row measures, and the stable callback refs that record them. */
function useOverflowElements() {
    const elements = useRef({
        container: { current: null },
        itemContainer: { current: null },
        indicator: { current: null },
    }).current;
    const refs = useMemo(() => {
        const record = (key) => (node) => {
            elements[key].current = node;
        };
        return {
            containerRef: record('container'),
            itemContainerRef: record('itemContainer'),
            indicatorRef: record('indicator'),
        };
    }, [elements]);
    return { elements, refs };
}
function createMeasureCache() {
    return {
        sizes: [],
        indicatorSize: 0,
        room: { width: -1, height: -1 },
        observed: new WeakMap(),
        corrections: 0,
        isAwaitingChildren: false,
    };
}
/** The order items are kept in, and a key of the priorities it was resolved from. */
function useKeepOrder(items, { getPriority, collapseFrom }) {
    const orderKey = items
        .map((item, index) => {
        const priority = getPriority?.(item, index) ?? 0;
        return Number.isFinite(priority) ? priority : 0;
    })
        .join(',');
    const order = useMemo(() => resolveKeepOrder(orderKey, collapseFrom), [orderKey, collapseFrom]);
    return { order, orderKey };
}
/**
 * Measures which items fit in one row of a container and which overflow, for a row that collapses
 * items into a "+N" count or a "more" menu. Hidden items are not rendered. A new item list, new
 * priorities, and any change to the container's box or a rendered element's size render every item
 * once to measure it; the measuring commit and the solved one run back to back, before the browser
 * paints.
 */
export function useOverflowItems({ items, collapseFrom = 'end', getPriority, }) {
    const { elements, refs } = useOverflowElements();
    const cache = useRef(createMeasureCache());
    const [generation, remeasure] = useReducer((count) => count + 1, 0);
    const { order, orderKey } = useKeepOrder(items, { getPriority, collapseFrom });
    const [state, setState] = useState({
        items: null,
        collapseFrom,
        order: orderKey,
        generation,
        visibleCount: items.length,
    });
    useOverflowObserver(elements, cache, remeasure);
    useLateChildren(elements, cache, remeasure);
    const isStale = !isSameList(state.items, items) ||
        state.collapseFrom !== collapseFrom ||
        state.order !== orderKey ||
        state.generation !== generation;
    const rendered = useMemo(() => {
        if (!isStale)
            return splitItems(items, state.visibleCount, order);
        // A measuring commit renders every item, keeping the indicator it had so it stays mounted.
        const previous = splitItems(state.items ?? items, state.visibleCount, resolveKeepOrder(state.order, state.collapseFrom));
        return {
            visibleItems: items,
            hiddenItems: previous.hiddenItems,
            visibleIndices: items.map((_, index) => index),
        };
    }, [items, isStale, state, order]);
    useLayoutEffect(() => {
        const element = elements.container.current;
        if (!element)
            return;
        const measured = cache.current;
        const visibleCount = measureCommit({
            element,
            itemContainer: elements.itemContainer.current,
            indicator: elements.indicator.current,
            measured,
            items,
            rendered,
            order,
            collapseFrom,
            isStale,
        });
        measured.isAwaitingChildren = visibleCount === null;
        if (visibleCount === null)
            return;
        const changed = visibleCount !== state.visibleCount;
        if (!isStale && (!changed || measured.corrections >= maxCorrections)) {
            measured.corrections = 0;
            return;
        }
        measured.corrections = isStale ? 0 : measured.corrections + 1;
        setState({ items, collapseFrom, order: orderKey, generation, visibleCount });
    }, [
        elements,
        items,
        rendered,
        order,
        orderKey,
        collapseFrom,
        isStale,
        state.visibleCount,
        generation,
    ]);
    return {
        ...refs,
        visibleItems: rendered.visibleItems,
        hiddenItems: rendered.hiddenItems,
    };
}
//# sourceMappingURL=use-overflow-items.js.map