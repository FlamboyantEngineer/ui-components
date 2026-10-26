import { jsx as _jsx } from "react/jsx-runtime";
import { useCallback, useMemo, } from 'react';
import { DropIndicator } from '../../primitives/index.js';
import { createKeyIndex } from '../../utils/create-key-index.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { isMoveChord, useReorderDragAndDrop, } from '../../utils/use-reorder-drag-and-drop.js';
import { armHandleDrag, keepHandleCellDraggable } from '../drag-handle/drag-handle.js';
import { tableHooks } from './table-hooks.js';
import { isEffectiveTableMove } from './table-rows.js';
const moveKeys = { ArrowUp: -1, ArrowDown: 1 };
/** The key of the body or footer row of this table that holds `target`, or null. */
function findRowKey(target, root) {
    const row = target instanceof Element ? target.closest('[role="row"]') : null;
    if (!row || row.closest(`.${tableHooks.className}`) !== root)
        return null;
    return row.closest('thead') ? null : row.getAttribute('data-key');
}
function canMoveRow(reorder, row) {
    return reorder?.canMove?.(row) ?? true;
}
function findMovableRow(snapshot, key) {
    const row = snapshot.rows.find((candidate) => toCollectionKey(candidate.id) === key);
    return row && canMoveRow(snapshot.reorder, row) ? row : undefined;
}
/** The move a drop on `target` makes, or null when it is not allowed or changes nothing. */
function resolveDrop(snapshot, target, keys) {
    if (target.type !== 'item' || target.dropPosition === 'on')
        return null;
    const index = snapshot.keys;
    const targetKey = index.get(String(target.key));
    if (targetKey === undefined)
        return null;
    const moved = [...keys].flatMap((key) => {
        const original = index.get(String(key));
        return original === undefined ? [] : [original];
    });
    const move = { keys: moved, targetKey, position: target.dropPosition };
    return isEffectiveTableMove(snapshot.rows, move) ? move : null;
}
/** The move of `row` one step up or down, or null at either end. */
function resolveStep(snapshot, row, step) {
    const target = snapshot.rows[snapshot.rows.indexOf(row) + step];
    if (!target)
        return null;
    return { keys: [row.id], targetKey: target.id, position: step === 1 ? 'after' : 'before' };
}
function renderDropIndicator(target) {
    return _jsx(DropIndicator, { target: target, className: tableHooks.slotClass('drop-indicator') });
}
/** The text a dragged row carries to other drop targets: its own `id`, not its collection key. */
function getKeyText(key) {
    return String(fromCollectionKey(key));
}
/** The drag preview: the caller's content for the dragged rows, in the table's preview slot. */
function createDragPreview(snapshot) {
    const render = snapshot.reorder?.renderDragPreview;
    if (!render)
        return undefined;
    return (keys) => {
        const rows = snapshot.rows.filter((row) => keys.has(toCollectionKey(row.id)));
        return _jsx("div", { ...tableHooks.slot('drag-preview', { count: rows.length }), children: render(rows) });
    };
}
/**
 * Reordering for a table: pointer and keyboard drag and drop through React Aria, plus Alt+Arrow
 * moves of the focused row. Every check reads the rows last rendered.
 */
export function useTableReorder(snapshot) {
    const { reorder } = snapshot;
    const keys = useMemo(() => (reorder ? createKeyIndex(snapshot.rows.map((row) => row.id)) : new Map()), [snapshot.rows, reorder]);
    const indexed = { ...snapshot, keys };
    const dragAndDrop = useReorderDragAndDrop({
        resolveMove: (target, keys) => resolveDrop(indexed, target, keys),
        onMove: (move) => reorder?.onMove(move),
        getTextValue: getKeyText,
        renderDropIndicator,
        renderDragPreview: createDragPreview(snapshot),
    });
    // Only the top-level rows of the page move, so nested rows draw disabled handles.
    const topLevel = useMemo(() => new Set(snapshot.rows), [snapshot.rows]);
    const isMovable = useCallback((row) => topLevel.has(row) && canMoveRow(reorder, row), [topLevel, reorder]);
    const onKeyDownCapture = (event) => {
        const step = moveKeys[event.key];
        const key = step && isMoveChord(event) ? findRowKey(event.target, event.currentTarget) : null;
        const row = key === null ? undefined : findMovableRow(snapshot, key);
        if (!reorder || !row || !step)
            return;
        const move = resolveStep(snapshot, row, step);
        if (move)
            reorder.onMove(move);
        event.preventDefault();
        event.stopPropagation();
    };
    const onDragStartCapture = (event) => {
        const key = findRowKey(event.target, event.currentTarget);
        if (key !== null && !findMovableRow(snapshot, key))
            event.preventDefault();
    };
    const isHandleTrigger = reorder?.dragTrigger === 'handle';
    return {
        dragAndDrop,
        isMovable,
        rootProps: {
            onKeyDownCapture,
            onDragStartCapture,
            onPointerDownCapture: isHandleTrigger ? armHandleDrag : keepHandleCellDraggable,
        },
    };
}
//# sourceMappingURL=use-table-reorder.js.map