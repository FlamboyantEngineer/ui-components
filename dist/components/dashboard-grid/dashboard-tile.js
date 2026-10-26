import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLayoutEffect, useRef } from 'react';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { dashboardGridHooks as hooks, useDashboardGridTile, } from './dashboard-grid.js';
import { useTileMove } from './use-tile-move.js';
/** A move or resize handle: a button that drags by pointer and steps by the arrow keys. */
function TileHandle({ grid, kind, label, minColumnSpan, minRowSpan }) {
    const strings = useUiStrings();
    const ref = useRef(null);
    const moveProps = useTileMove({
        item: grid.item,
        kind,
        columns: grid.columns,
        minColumnSpan,
        minRowSpan,
        measureStep: grid.measureStep,
        onPreview: (next) => grid.preview(next, kind),
        onCommit: (isKeyboard) => {
            const item = grid.commit(isKeyboard);
            if (!item)
                return;
            grid.announce(kind === 'move'
                ? strings.tileMoved(label, item.x + 1, item.y + 1)
                : strings.tileResized(label, item.w, item.h));
        },
    });
    // A keyboard move can reorder the tiles, which takes focus from the handle; give it back.
    useLayoutEffect(() => {
        const target = grid.refocus.current;
        if (target?.id !== grid.item.id || target.kind !== kind)
            return;
        grid.refocus.current = null;
        if (ref.current && ref.current.ownerDocument.activeElement !== ref.current)
            ref.current.focus();
    });
    return (_jsx("button", { ...moveProps, ...hooks.slot(kind), ref: ref, type: "button", "aria-label": kind === 'move' ? strings.moveTile(label) : strings.resizeTile(label), children: _jsx(Glyph, { name: kind === 'move' ? 'drag-handle' : 'resize' }) }));
}
/**
 * One tile of a `DashboardGrid`: a named group placed on the grid's cells from its layout item.
 * In edit mode it shows a move handle before its content and a resize handle after it.
 */
export function DashboardTile({ label, children, minColumnSpan = 1, minRowSpan = 1, className, ...rest }) {
    const grid = useDashboardGridTile();
    const item = grid?.item;
    const moving = grid?.moving?.id === item?.id ? grid?.moving?.kind : undefined;
    const handle = (kind) => grid?.isEditing ? (_jsx(TileHandle, { grid: grid, kind: kind, label: label, minColumnSpan: minColumnSpan, minRowSpan: minRowSpan })) : null;
    return (_jsxs("div", { ...rest, ...hooks.slot('tile', { moving: moving === 'move', resizing: moving === 'resize' }, className), role: "group", "aria-label": label, style: item
            ? {
                gridColumn: `${item.x + 1} / span ${item.w}`,
                gridRow: `${item.y + 1} / span ${item.h}`,
            }
            : undefined, children: [handle('move'), _jsx("div", { ...hooks.slot('tile-content'), children: children }), handle('resize')] }));
}
//# sourceMappingURL=dashboard-tile.js.map