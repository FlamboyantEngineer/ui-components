// Selection that cascades through a tree: a row's selection reaches its loaded descendants, and a
// row follows its children, all selected or not.
import { useCallback, useMemo, useState } from 'react';
import { mapTree } from '../../utils/map-tree.js';
import { walkTree } from '../../utils/walk-tree.js';
const noKeys = new Set();
function collectKeys(items, cascade) {
    const keys = [];
    const getChildren = (item) => cascade.disabled.has(item.id) ? undefined : cascade.getChildren(item);
    for (const item of walkTree(items, getChildren)) {
        if (!cascade.disabled.has(item.id))
            keys.push(item.id);
    }
    return keys;
}
function toKeySet(selection, { items, cascade }) {
    return selection === 'all' ? new Set(collectKeys(items, cascade)) : selection;
}
/** Selects or deselects the descendants of rows whose own selection changed. */
function pushDown(items, context) {
    const { previous, result, cascade } = context;
    const getChildren = (item) => result.has(item.id) === previous.has(item.id) ? cascade.getChildren(item) : undefined;
    for (const item of walkTree(items, getChildren)) {
        const isSelected = result.has(item.id);
        if (isSelected === previous.has(item.id))
            continue;
        for (const key of collectKeys(cascade.getChildren(item) ?? [], cascade)) {
            if (isSelected)
                result.add(key);
            else
                result.delete(key);
        }
    }
}
/** Selects each row whose enabled children are all selected, and deselects the others. */
function pullUp(items, result, cascade) {
    mapTree(items, (item) => (cascade.getChildren(item) ?? []).filter((child) => !cascade.disabled.has(child.id)), (item, children) => {
        if (children.length > 0 && !cascade.disabled.has(item.id)) {
            if (children.every((child) => result.has(child.id)))
                result.add(item.id);
            else
                result.delete(item.id);
        }
        return item;
    });
}
/** Rows that are not selected while a descendant is. */
function findIndeterminate(items, { selected, cascade }) {
    const found = new Set();
    if (selected.size === 0)
        return found;
    mapTree(items, cascade.getChildren, (item, children) => {
        const below = children.some(Boolean);
        if (below && !selected.has(item.id))
            found.add(item.id);
        return below || selected.has(item.id);
    });
    return found;
}
/**
 * React Aria's selection, passed through, or with `selectionPropagation` in multiple selection held
 * by the tree (unless controlled) and cascaded: a row whose selection changes takes its loaded, enabled descendants
 * along, and then each branch is selected exactly when all its enabled children are.
 */
export function useTreeSelection(options) {
    const { items, getChildren, disabledKeys, selectionMode } = options;
    const { selectedKeys, defaultSelectedKeys, onSelectionChange } = options;
    // A single selection holds one row, so it never cascades.
    const isPropagating = options.selectionPropagation === true && selectionMode === 'multiple';
    const [own, setOwn] = useState(() => defaultSelectedKeys === 'all' ? 'all' : new Set(defaultSelectedKeys ?? []));
    const cascade = useMemo(() => ({ getChildren, disabled: new Set(disabledKeys ?? []) }), [getChildren, disabledKeys]);
    const current = selectedKeys === undefined ? own : selectedKeys;
    const selected = useMemo(() => isPropagating
        ? toKeySet(current === 'all' ? 'all' : new Set(current), { items, cascade })
        : noKeys, [isPropagating, current, items, cascade]);
    const indeterminate = useMemo(() => (isPropagating ? findIndeterminate(items, { selected, cascade }) : noKeys), [isPropagating, items, selected, cascade]);
    const isIndeterminate = useCallback((key) => indeterminate.has(key), [indeterminate]);
    if (!isPropagating) {
        return { props: { selectedKeys, defaultSelectedKeys, onSelectionChange }, isIndeterminate };
    }
    return {
        props: {
            selectedKeys: selected,
            onSelectionChange(next) {
                const result = new Set(toKeySet(next, { items, cascade }));
                pushDown(items, { previous: selected, result, cascade });
                pullUp(items, result, cascade);
                if (selectedKeys === undefined)
                    setOwn(result);
                onSelectionChange?.(result);
            },
        },
        isIndeterminate,
    };
}
//# sourceMappingURL=use-tree-selection.js.map