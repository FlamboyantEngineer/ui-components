import { useCallback, useRef } from 'react';
import { useLocale } from '../../primitives/index.js';
import { isMoveChord } from '../../utils/use-reorder-drag-and-drop.js';
const editableSelector = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]';
function findRow(target) {
    if (!(target instanceof Element) || target.closest(editableSelector))
        return null;
    return target.closest('[role="row"]');
}
function toMoveDirection(key, isRightToLeft) {
    if (key === 'ArrowUp')
        return 'up';
    if (key === 'ArrowDown')
        return 'down';
    if (key === 'ArrowRight')
        return isRightToLeft ? 'out' : 'in';
    if (key === 'ArrowLeft')
        return isRightToLeft ? 'in' : 'out';
    return null;
}
/**
 * Keys pressed in a row: the owner's `onItemKeyDown` sees each first and may claim it, then F2
 * renames the row when the owner takes renames and Alt+Arrow chords move it when the tree is
 * reorderable. Keys typed in the rename field go to it alone; other editable elements are left alone.
 */
export function useTreeKeyDown({ onItemKeyDown, reordering, rename, }) {
    const { direction } = useLocale();
    const rowItems = useRef(new WeakMap());
    const registerRow = useCallback((node, item) => {
        if (node)
            rowItems.current.set(node, item);
    }, []);
    const moveByChord = (item, event) => {
        const moveDirection = toMoveDirection(event.key, direction === 'rtl');
        if (!reordering || !moveDirection || !isMoveChord(event))
            return false;
        return reordering.moveByKeyboard({ key: item.id, direction: moveDirection });
    };
    const renameByKey = (item, event) => event.key === 'F2' && rename !== null && rename.start(item);
    const onKeyDownCapture = (event) => {
        if (rename?.isEditorEvent(event)) {
            rename.onEditorKeyDown(event);
            return;
        }
        const row = findRow(event.target);
        const item = row ? rowItems.current.get(row) : undefined;
        if (!item)
            return;
        if (onItemKeyDown?.(item, event) || renameByKey(item, event) || moveByChord(item, event)) {
            event.preventDefault();
            event.stopPropagation();
        }
    };
    return { registerRow, onKeyDownCapture };
}
//# sourceMappingURL=use-tree-key-down.js.map