import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { usePersistentState } from '../../core/provider.js';
import { collapseSplitPane, expandSplitPane, isSplitPaneCollapsed, normalizeSplitSizes, resolveInitialSplitSizes, } from './split-layout.js';
/** Two percent panes store the first pane's size as a number, as they always have; others a list. */
function createSizesCodec(panes) {
    const isPair = panes.length === 2 && panes.every((pane) => pane.unit !== 'pixel');
    return {
        parse(raw) {
            const value = JSON.parse(raw);
            if (isPair && typeof value === 'number' && Number.isFinite(value))
                return [value, 100 - value];
            const isList = Array.isArray(value) &&
                value.length === panes.length &&
                value.every((size) => typeof size === 'number' && Number.isFinite(size));
            if (!isList)
                throw new Error('Stored split sizes do not fit the panes');
            return value;
        },
        stringify: (sizes) => (isPair ? String(sizes[0]) : JSON.stringify(sizes)),
    };
}
function toPair(size) {
    return size === undefined ? undefined : [size, 100 - size];
}
/**
 * The panes' sizes: the controlled `sizes` (or two-pane `size`), else the live sizes during a drag,
 * else the committed sizes, which persist. Collapsing and opening a pane are reported, and the size
 * a pane had before collapsing is kept to open it again.
 */
export function useSplitSizes(options) {
    const { panes, persistKey } = options;
    const controlled = options.sizes ?? toPair(options.size);
    const codec = useMemo(() => createSizesCodec(panes), [panes]);
    const [committed, setCommitted] = usePersistentState(controlled ? undefined : persistKey, () => resolveInitialSplitSizes(panes, options.defaultSizes ?? toPair(options.defaultSize)), codec);
    const [live, setLive] = useState(null);
    const current = normalizeSplitSizes(panes, controlled ?? live ?? committed);
    const latest = useRef(current);
    const reopen = useRef(new Map());
    useLayoutEffect(() => {
        latest.current = current;
    });
    const reportCollapse = (previous, next) => {
        next.forEach((size, index) => {
            const was = isSplitPaneCollapsed(panes[index], previous[index] ?? 0);
            const is = isSplitPaneCollapsed(panes[index], size);
            if (!was && is) {
                reopen.current.set(index, previous[index] ?? 0);
                options.onCollapse?.(index);
            }
            else if (was && !is)
                options.onExpand?.(index);
        });
    };
    const update = (sizes, phase) => {
        const next = normalizeSplitSizes(panes, sizes);
        const isEnd = phase !== 'change';
        reportCollapse(latest.current, next);
        latest.current = next;
        if (!controlled) {
            if (isEnd)
                setCommitted(next);
            setLive(isEnd ? null : next);
        }
        if (phase !== 'end') {
            options.onSizesChange?.(next);
            options.onSizeChange?.(next[0] ?? 0);
        }
        if (!isEnd)
            return;
        options.onSizesChangeEnd?.(next);
        options.onSizeChangeEnd?.(next[0] ?? 0);
    };
    return {
        current,
        update,
        collapse(index) {
            const next = collapseSplitPane(panes, latest.current, index);
            if (next !== latest.current)
                update(next, 'set');
        },
        expand(index) {
            const size = reopen.current.get(index);
            const next = expandSplitPane(panes, latest.current, { index, size });
            if (next !== latest.current)
                update(next, 'set');
        },
    };
}
//# sourceMappingURL=use-split-sizes.js.map