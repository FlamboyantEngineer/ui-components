// Moving focus between the rows of a tree comparison: to the next difference or a moved node's twin.
import { useEffect, useRef } from 'react';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { findNextChange } from './tree-compare-rows.js';
function findRowElement(tree, key) {
    const rows = tree?.querySelectorAll('[role="row"]') ?? [];
    return [...rows].find((row) => row.getAttribute('data-key') === toCollectionKey(key));
}
/**
 * Reveals rows and moves focus to them: the row's ancestors expand first, then the row takes
 * focus once it has rendered. The row the reader last focused is where a step to the next or the
 * previous difference starts.
 */
export function useTreeCompareNavigation(options) {
    const { index, expandedKeys, setExpandedKeys } = options;
    const treeRef = useRef(null);
    const currentKey = useRef(null);
    const pendingKey = useRef(null);
    const focusRow = (key) => {
        const row = findRowElement(treeRef.current, key);
        if (!row)
            return false;
        row.focus();
        row.scrollIntoView?.({ block: 'nearest' });
        return true;
    };
    useEffect(() => {
        if (pendingKey.current !== null && focusRow(pendingKey.current))
            pendingKey.current = null;
    });
    const reveal = (key) => {
        const hidden = [];
        let ancestor = index.parent.get(key);
        while (ancestor !== undefined) {
            if (!expandedKeys.has(ancestor))
                hidden.push(ancestor);
            ancestor = index.parent.get(ancestor);
        }
        currentKey.current = key;
        if (hidden.length === 0 && focusRow(key))
            return;
        pendingKey.current = key;
        setExpandedKeys(new Set([...expandedKeys, ...hidden.reverse()]));
    };
    return {
        treeRef,
        reveal,
        step(step) {
            const target = findNextChange(index, { from: currentKey.current, step });
            if (target)
                reveal(target.id);
        },
        onFocus(event) {
            const row = event.target.closest('[role="row"]');
            const key = row?.getAttribute('data-key');
            const focused = key === null || key === undefined ? undefined : index.byId.get(fromCollectionKey(key));
            if (focused)
                currentKey.current = focused.id;
        },
    };
}
//# sourceMappingURL=use-tree-compare-navigation.js.map