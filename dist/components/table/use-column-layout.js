import { useMemo } from 'react';
import { usePersistentState } from '../../core/provider.js';
import { applyColumnMove, arrangeColumns, readColumnLayout, } from './table-columns.js';
/**
 * The order and visibility of a table's columns: the caller's when controlled, else the table's
 * own, persisted under `<persistKey>:layout` and restored on mount.
 */
export function useColumnLayout(options) {
    const { columns, columnLayout, onColumnLayoutChange, persistKey } = options;
    const key = persistKey === undefined ? undefined : `${persistKey}:layout`;
    const [stored, setStored] = usePersistentState(key, options.defaultColumnLayout ?? {});
    const layout = useMemo(() => columnLayout ?? readColumnLayout(stored, columns), [columnLayout, stored, columns]);
    const visibleColumns = useMemo(() => arrangeColumns(columns, layout), [columns, layout]);
    const setLayout = (next) => {
        if (columnLayout === undefined)
            setStored(next);
        onColumnLayoutChange?.(next);
    };
    return {
        layout,
        visibleColumns,
        setHidden: (hidden) => setLayout({ ...layout, hidden: [...hidden] }),
        moveColumn: (move) => {
            const order = applyColumnMove(columns, layout, move);
            if (order)
                setLayout({ ...layout, order });
        },
    };
}
//# sourceMappingURL=use-column-layout.js.map