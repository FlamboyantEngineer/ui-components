import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { findMaximum } from '../../utils/find-maximum.js';
import { createContext, useContext, useMemo, useRef, useState, } from 'react';
import { createHooks } from '../../core/hooks.js';
import { usePersistentState } from '../../core/provider.js';
import { mergeRefs } from '../../utils/merge-props.js';
import { useElementSize } from '../../utils/use-element-size.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { normalizeDashboardLayout, placeDashboardItem, reflowDashboardLayout, toColumnCount, } from './dashboard-layout.js';
export const dashboardGridHooks = createHooks('dashboard-grid', [
    'tile',
    'tile-content',
    'move',
    'resize',
    'status',
]);
export const DashboardGridContext = createContext(null);
/** The grid a `DashboardTile` sits in; `null` outside one. */
export function useDashboardGridTile() {
    return useContext(DashboardGridContext);
}
function readGap(element, property) {
    const value = Number.parseFloat(getComputedStyle(element)[property]);
    return Number.isFinite(value) ? value : 0;
}
/** Whether two layouts place the same tiles in the same order on the same cells. */
function isSameLayout(a, b) {
    return (a.length === b.length &&
        a.every((item, index) => {
            const other = b[index];
            return (other !== undefined &&
                other.id === item.id &&
                other.x === item.x &&
                other.y === item.y &&
                other.w === item.w &&
                other.h === item.h);
        }));
}
/** The layout shown: the committed one, or the preview while a tile moves. */
function useDashboardLayout(props, columns) {
    const [own, setOwn] = usePersistentState(props.layout === undefined ? props.persistKey : undefined, () => [...(props.defaultLayout ?? [])]);
    const layout = normalizeDashboardLayout(props.layout ?? own, columns);
    const commit = (next) => {
        if (props.layout === undefined)
            setOwn(next);
        props.onLayoutChange?.(next);
    };
    return { layout, commit };
}
/** How many columns fit: the layout's own, or fewer below `minColumnWidth` per column. */
function useShownColumns(element, columns, minColumnWidth) {
    const width = useElementSize(element, { enabled: minColumnWidth !== undefined })?.width ?? 0;
    if (minColumnWidth === undefined || !(minColumnWidth > 0) || width <= 0)
        return columns;
    return Math.min(columns, Math.max(1, Math.floor(width / minColumnWidth)));
}
/** The preview of a tile being moved and the handlers its handles call. */
function useTileMoves({ element, committed, columns, rowHeight, isEditing, }) {
    const [preview, setPreview] = useState(null);
    const latest = useRef(null);
    const refocus = useRef(null);
    if (!isEditing && preview) {
        latest.current = null;
        setPreview(null);
    }
    return {
        previewLayout: preview?.layout,
        refocus,
        moving: preview ? { id: preview.item.id, kind: preview.kind } : null,
        measureStep: () => {
            if (!element)
                return { column: 1, row: 1 };
            const width = element.getBoundingClientRect().width;
            const column = (width + readGap(element, 'columnGap')) / columns;
            const row = rowHeight + readGap(element, 'rowGap');
            return { column: Math.max(1, column), row: Math.max(1, row) };
        },
        preview: (next, kind) => {
            const layout = placeDashboardItem(committed.layout, next, columns);
            const item = layout.find((candidate) => candidate.id === next.id) ?? next;
            latest.current = { layout, item, kind };
            setPreview(latest.current);
        },
        commit: (isKeyboard) => {
            const last = latest.current;
            latest.current = null;
            setPreview(null);
            if (!last || isSameLayout(last.layout, committed.layout))
                return undefined;
            if (isKeyboard)
                refocus.current = { id: last.item.id, kind: last.kind };
            committed.commit(last.layout);
            return last.item;
        },
    };
}
/**
 * A grid of tiles on whole columns and rows, each placed by plain `{ id, x, y, w, h }` data. In
 * edit mode every tile shows a move handle and a resize handle that work by pointer drag and by
 * the arrow keys; a tile moved or grown onto others pushes them down. Below `minColumnWidth` per
 * column the grid reflows its tiles onto fewer columns, read only.
 */
export function DashboardGrid({ layout, defaultLayout, onLayoutChange, persistKey, columns: columnsProp = 12, minColumnWidth, rowHeight = 80, isEditing = false, children, className, ref, ...rest }) {
    const columns = toColumnCount(columnsProp);
    const [element, setElement] = useState(null);
    const rootRef = useMemo(() => mergeRefs(ref, setElement), [ref]);
    const committed = useDashboardLayout({ layout, defaultLayout, onLayoutChange, persistKey }, columns);
    const shownColumns = useShownColumns(element, columns, minColumnWidth);
    const isReflowed = shownColumns < columns;
    const editable = isEditing && !isReflowed;
    const { previewLayout, ...moves } = useTileMoves({
        element,
        committed,
        columns,
        rowHeight,
        isEditing: editable,
    });
    const [message, setMessage] = useState('');
    const shown = isReflowed
        ? reflowDashboardLayout(committed.layout, { from: columns, to: shownColumns })
        : (previewLayout ?? committed.layout);
    const order = [...committed.layout].sort((a, b) => a.y - b.y || a.x - b.x);
    const positions = new Map(shown.map((item) => [item.id, item]));
    const rows = findMaximum(shown, (item) => item.y + item.h, 1);
    const state = { ...moves, columns, isEditing: editable, announce: setMessage };
    const style = {
        gridTemplateColumns: `repeat(${shownColumns}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, ${rowHeight}px)`,
    };
    return (_jsxs("div", { ...rest, ...dashboardGridHooks.root({
            className,
            data: { editing: state.isEditing, reflowed: isReflowed },
        }), ref: rootRef, role: "group", style: style, children: [order.map((entry) => {
                const item = positions.get(entry.id) ?? entry;
                return (_jsx(DashboardGridContext.Provider, { value: { ...state, item }, children: children(item) }, toKeyIdentity(item.id)));
            }), _jsx(VisuallyHidden, { children: _jsx("div", { ...dashboardGridHooks.slot('status'), role: "status", children: message }) })] }));
}
//# sourceMappingURL=dashboard-grid.js.map