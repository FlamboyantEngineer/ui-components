import { useMemo } from 'react';
import { createKeyIndex } from '../../utils/create-key-index.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { walkTree } from '../../utils/walk-tree.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { fromCollectionSelection, toCollectionSelection, } from '../../utils/collection-selection.js';
/** Indexes all source rows so callbacks retain keys of rows outside the current page. */
export function useTableKeyIndex(rows, getChildRows, isEnabled) {
    return useMemo(() => isEnabled
        ? createKeyIndex(Array.from(walkTree(rows, (row) => getChildRows?.(row) ?? undefined), (row) => row.id))
        : new Map(), [rows, getChildRows, isEnabled]);
}
/** Internal notice, detail and group rows never report caller row actions. */
export function createTableRowAction(index, onAction) {
    return (onAction &&
        ((key) => {
            const original = index.get(String(key));
            if (original !== undefined)
                onAction(original);
        }));
}
/** Keeps public row keys typed while the collection receives whitespace-safe identities. */
export function createTableAriaKeys(options) {
    const { selection, expansion, disabledKeys } = options;
    const selected = selection.selection;
    return {
        selectedKeys: toCollectionSelection(selected),
        onSelectionChange: (keys) => selection.setSelection(fromCollectionSelection(keys)),
        disabledKeys: disabledKeys === undefined ? undefined : Array.from(disabledKeys, toCollectionKey),
        expandedKeys: new Set([...expansion.expandedKeys].map(toCollectionKey)),
        onExpandedChange: (keys) => expansion.onExpandedChange(new Set([...keys].map(fromCollectionKey))),
    };
}
//# sourceMappingURL=table-aria-keys.js.map