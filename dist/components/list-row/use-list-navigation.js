import { createContext, useCallback, useContext, useId, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, } from 'react';
import { clamp } from '../../utils/clamp.js';
import { useForwardedRef } from '../../utils/use-forwarded-ref.js';
const navigationKeys = new Set(['ArrowDown', 'ArrowUp', 'Home', 'End']);
export const RowRegistryContext = createContext(null);
/** Which row holds the single tab stop. Rows subscribe by id, so a move re-renders only two rows. */
function createActiveRowStore() {
    let activeId = null;
    const listeners = new Map();
    const notify = (id) => {
        if (id === null)
            return;
        for (const listener of listeners.get(id) ?? [])
            listener();
    };
    return {
        getActiveId: () => activeId,
        subscribe(id, listener) {
            const set = listeners.get(id) ?? new Set();
            listeners.set(id, set);
            set.add(listener);
            return () => {
                set.delete(listener);
                if (set.size === 0)
                    listeners.delete(id);
            };
        },
        setActiveId(next) {
            if (next === activeId)
                return;
            const previous = activeId;
            activeId = next;
            notify(previous);
            notify(next);
        },
    };
}
/** Neighbours of `id` in `order`, nearest first, the next one before the previous at equal distance. */
function findNeighbours(order, id) {
    const index = order.indexOf(id);
    if (index < 0)
        return [];
    const result = [];
    for (let distance = 1; distance < order.length; distance += 1) {
        const after = order[index + distance];
        if (after !== undefined)
            result.push(after);
        const before = index - distance >= 0 ? order[index - distance] : undefined;
        if (before !== undefined)
            result.push(before);
    }
    return result;
}
function isNavigationKey(event) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
        return false;
    return !event.defaultPrevented && navigationKeys.has(event.key);
}
/** The row a navigation key moves to from row `index`, without wrapping. */
function resolveTargetIndex(key, index, last) {
    if (key === 'Home')
        return 0;
    if (key === 'End')
        return last;
    return clamp(index + (key === 'ArrowDown' ? 1 : -1), 0, last);
}
function isFocusLost(document) {
    return document.activeElement === null || document.activeElement === document.body;
}
/**
 * After the row `removed` unregisters: hands the tab stop to the same row's replacement primary or
 * its nearest neighbour, and moves focus there when the removed row held it and focus fell out.
 */
function recoverFromRemoval(state, removed) {
    const { list, rows, store, focusedId, hasEntered } = state;
    if (!list.current?.isConnected)
        return;
    const candidates = hasEntered.current ? [removed.id, ...removed.neighbours] : [];
    const nextId = candidates.find((candidate) => rows.nodes.current.has(candidate)) ??
        rows.read()[0]?.[0] ??
        null;
    if (store.getActiveId() === removed.id)
        store.setActiveId(nextId);
    if (focusedId.current !== removed.id || !isFocusLost(removed.node.ownerDocument))
        return;
    if (nextId === null)
        focusedId.current = null;
    else
        rows.nodes.current.get(nextId)?.focus();
}
function useOrderedRows(list, { primaryClass, onRead }) {
    const nodes = useRef(new Map());
    const order = useRef([]);
    const isReadQueued = useRef(false);
    const read = useCallback(() => {
        const ids = new Map([...nodes.current].map(([id, node]) => [node, id]));
        const primaries = [...(list.current?.querySelectorAll(`.${primaryClass}`) ?? [])];
        const rows = primaries.flatMap((node) => {
            const id = ids.get(node);
            return id === undefined ? [] : [[id, node]];
        });
        order.current = rows.map(([id]) => id);
        onRead(order.current);
        return rows;
    }, [list, primaryClass, onRead]);
    const queueRead = useCallback(() => {
        if (isReadQueued.current)
            return;
        isReadQueued.current = true;
        queueMicrotask(() => {
            isReadQueued.current = false;
            read();
        });
    }, [read]);
    // Keyed moves and inserts change the order without any registration.
    useLayoutEffect(() => {
        const element = list.current;
        const Observer = element?.ownerDocument.defaultView?.MutationObserver;
        if (!element || !Observer)
            return;
        const observer = new Observer(read);
        observer.observe(element, { childList: true, subtree: true });
        read();
        return () => observer.disconnect();
    }, [list, read]);
    return useMemo(() => ({ nodes, order, read, queueRead }), [read, queueRead]);
}
function useRowRegistry(state) {
    const { list, rows, store, focusedId, hasEntered } = state;
    const register = useCallback((id, node) => {
        rows.nodes.current.set(id, node);
        if (store.getActiveId() === null)
            store.setActiveId(id);
        // A row enabled without a DOM change escapes the observer; one read serves a whole batch.
        rows.queueRead();
        return () => {
            // The order snapshot still holds the row: compute its neighbours before it is gone.
            const neighbours = findNeighbours(rows.order.current, id);
            if (rows.nodes.current.get(id) === node)
                rows.nodes.current.delete(id);
            queueMicrotask(() => recoverFromRemoval({ list, rows, store, focusedId, hasEntered }, { id, node, neighbours }));
        };
    }, [list, rows, store, focusedId, hasEntered]);
    return useMemo(() => ({
        register,
        subscribe: store.subscribe,
        getActiveId: store.getActiveId,
        activate: (id) => {
            focusedId.current = id;
            hasEntered.current = true;
            store.setActiveId(id);
        },
    }), [register, store, focusedId, hasEntered]);
}
/**
 * A list's single tab stop and arrow navigation: ArrowUp, ArrowDown, Home and End move focus between
 * the registered rows' primary controls in document order, and focus recovers when a row goes.
 */
export function useListNavigation({ primaryClass, onNavigatePastStart, handleRef, ref, }) {
    const [list, setRef] = useForwardedRef(ref);
    const [store] = useState(createActiveRowStore);
    const hasEntered = useRef(false);
    // Until focus enters the list, the tab stop follows the first row as rows come and go.
    const onRead = useCallback((order) => {
        if (!hasEntered.current && order[0] !== undefined)
            store.setActiveId(order[0]);
    }, [store]);
    const rows = useOrderedRows(list, { primaryClass, onRead });
    const focusedId = useRef(null);
    const registry = useRowRegistry({ list, rows, store, focusedId, hasEntered });
    useImperativeHandle(handleRef, () => ({ focusFirst: () => rows.read()[0]?.[1].focus() }), [rows]);
    const onKeyDown = (event) => {
        if (!isNavigationKey(event))
            return;
        const ordered = rows.read();
        const index = ordered.findIndex(([, node]) => node === event.target);
        // Keys typed in trailing controls (inputs, menus) keep their own behaviour.
        if (index < 0)
            return;
        event.preventDefault();
        if (index === 0 && event.key === 'ArrowUp' && onNavigatePastStart)
            return onNavigatePastStart();
        ordered[resolveTargetIndex(event.key, index, ordered.length - 1)]?.[1].focus();
    };
    const onBlurCapture = (event) => {
        const next = event.relatedTarget;
        if (!(next instanceof Node) || !event.currentTarget.contains(next))
            focusedId.current = null;
    };
    return { registry, setRef, onKeyDown, onBlurCapture };
}
/**
 * A row's place in its list's single tab stop, registered while it is enabled. Outside a `List`
 * every row is its own tab stop. `primaryKind` re-registers the row when its primary control changes.
 */
export function useRowTabStop(isDisabled, primaryKind) {
    const id = useId();
    const registry = useContext(RowRegistryContext);
    const subscribe = useCallback((listener) => registry?.subscribe(id, listener) ?? (() => { }), [registry, id]);
    const getIsActive = useCallback(() => !registry || registry.getActiveId() === id, [registry, id]);
    const isActive = useSyncExternalStore(subscribe, getIsActive, getIsActive);
    const primary = useRef(null);
    const register = registry?.register;
    useLayoutEffect(() => {
        if (!register || !primary.current || isDisabled)
            return;
        return register(id, primary.current);
    }, [register, id, isDisabled, primaryKind]);
    return {
        isActive,
        setPrimary: (node) => {
            primary.current = node;
        },
        activate: () => registry?.activate(id),
    };
}
//# sourceMappingURL=use-list-navigation.js.map