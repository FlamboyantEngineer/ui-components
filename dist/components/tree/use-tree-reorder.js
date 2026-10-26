import { createDropIndicator } from '../../utils/create-drop-indicator.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { getVisibleTreeRows, resolveTreeDrop, resolveTreeDropMany, resolveTreeKeyboardMove, } from '../../utils/tree-reorder.js';
import { useReorderDragAndDrop, } from '../../utils/use-reorder-drag-and-drop.js';
import { treeHooks as hooks } from './tree-hooks.js';
const renderDropIndicator = createDropIndicator(hooks.slotClass('drop-indicator'));
const siblingShortcuts = 'Alt+ArrowUp Alt+ArrowDown';
const parentShortcuts = 'Alt+ArrowUp Alt+ArrowDown Alt+ArrowLeft Alt+ArrowRight';
/**
 * The moves a drop on `target` makes: one for a single row, or one per row for several rows when
 * the owner takes them. React Aria's `on` position is `inside`.
 */
function resolveDropMoves(rows, reorder, { target, keys }) {
    const [key] = keys;
    if (!reorder || key === undefined || target.type !== 'item')
        return null;
    const position = target.dropPosition === 'on' ? 'inside' : target.dropPosition;
    if (keys.size > 1) {
        if (!reorder.onMoveMany)
            return null;
        return resolveTreeDropMany(rows, { keys, targetKey: target.key, position }, reorder);
    }
    const move = resolveTreeDrop(rows, { key, targetKey: target.key, position }, reorder);
    return move ? [move] : null;
}
/** The visible rows with their movability, while the tree is reorderable. */
function useMoveRows(source) {
    const { items, reorder, disabledKeys, expansion, getChildren } = source;
    const canMove = reorder?.canMove;
    const hasReorder = reorder !== undefined;
    const disabled = useMemo(() => new Set(disabledKeys ?? []), [disabledKeys]);
    const { expandedKeys } = expansion;
    return useMemo(() => hasReorder
        ? getVisibleTreeRows(items, {
            expandedKeys,
            getChildren,
            isMovable: (item) => !disabled.has(item.id) && (canMove?.(item) ?? true),
        })
        : [], [hasReorder, canMove, items, expandedKeys, getChildren, disabled]);
}
/**
 * Reordering for the tree: pointer and keyboard drag and drop, plus Alt+Arrow moves, each checked
 * against the rows the tree last rendered. `null` while the tree is not reorderable.
 */
export function useTreeReorder(source) {
    const rows = useMoveRows(source);
    const latest = useRef({ rows, source });
    useLayoutEffect(() => {
        latest.current = { rows, source };
    });
    const report = useCallback((moves) => {
        const { expansion, reorder } = latest.current.source;
        const [first] = moves;
        if (first?.position === 'inside')
            expansion.expand(first.targetKey);
        if (moves.length > 1)
            reorder?.onMoveMany?.(moves);
        else if (first)
            reorder?.onMove(first);
    }, []);
    const dragAndDrop = useReorderDragAndDrop({
        resolveMove: (target, keys) => resolveDropMoves(rows, source.reorder, {
            target: target.type === 'item' ? { ...target, key: fromCollectionKey(target.key) } : target,
            keys: new Set([...keys].map(fromCollectionKey)),
        }),
        onMove: report,
        getTextValue: (key) => {
            const original = fromCollectionKey(key);
            const row = rows.find((entry) => entry.key === original);
            return row ? source.getTextValue(row.item) : String(key);
        },
        renderDropIndicator,
    });
    const moveByKeyboard = useCallback((request) => {
        const { rows: current, source: owner } = latest.current;
        const move = owner.reorder && resolveTreeKeyboardMove(current, request, owner.reorder);
        if (move)
            report([move]);
        return move !== undefined;
    }, [report]);
    const movable = useMemo(() => new Set(rows.filter((row) => row.isMovable).map((row) => row.key)), [rows]);
    const isMovable = useCallback((key) => movable.has(key), [movable]);
    const hasReorder = source.reorder !== undefined;
    const keyShortcuts = source.reorder?.canMoveInto ? parentShortcuts : siblingShortcuts;
    return useMemo(() => (hasReorder ? { dragAndDrop, isMovable, keyShortcuts, moveByKeyboard } : null), [hasReorder, dragAndDrop, isMovable, keyShortcuts, moveByKeyboard]);
}
//# sourceMappingURL=use-tree-reorder.js.map