import { useMemo } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { walkTree } from '../../utils/walk-tree.js';
function toSelection(keys) {
    if (keys === undefined)
        return undefined;
    if (keys === 'all')
        return 'all';
    return keys instanceof Set ? keys : new Set(keys);
}
/**
 * The row selection, held by the table unless the caller controls it, so its selection bar knows
 * the selected rows: every enabled presented row for `all`, else those whose keys are selected.
 */
export function useTableSelection(options, presented) {
    const controlled = useMemo(() => toSelection(options.selectedKeys), [options.selectedKeys]);
    const [selection, setSelection] = useControllableState(controlled, toSelection(options.defaultSelectedKeys) ?? new Set(), options.onSelectionChange);
    const disabled = useMemo(() => new Set(options.disabledKeys ?? []), [options.disabledKeys]);
    const isRowDisabled = useMemo(() => (row) => disabled.has(row.id), [disabled]);
    const selectedRows = useMemo(() => {
        const keys = selection === 'all' ? null : selection;
        const rows = [];
        if (keys?.size === 0)
            return rows;
        for (const { row } of walkTree(presented, (node) => node.children)) {
            if (!isRowDisabled(row) && (!keys || keys.has(row.id)))
                rows.push(row);
        }
        return rows;
    }, [presented, selection, isRowDisabled]);
    return { selection, setSelection, selectedRows, isRowDisabled, disabledKeys: disabled };
}
//# sourceMappingURL=use-table-selection.js.map