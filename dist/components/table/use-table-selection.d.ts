import type { CollectionSelectionProps } from '../../core/events.js';
import type { Key, Selection } from '../../core/props.js';
import type { TableRow } from './table-rows.js';
import type { TableNode } from './table-tree.js';
/** The rows a table selects, and the rows its writes may not touch. */
export interface TableSelection<T> {
    selection: Selection;
    setSelection: (selection: Selection) => void;
    /** The selected rows the table presents across pages, nested rows included, in order. */
    selectedRows: readonly T[];
    isRowDisabled: (row: T) => boolean;
    disabledKeys: ReadonlySet<Key>;
}
/**
 * The row selection, held by the table unless the caller controls it, so its selection bar knows
 * the selected rows: every enabled presented row for `all`, else those whose keys are selected.
 */
export declare function useTableSelection<T extends TableRow>(options: Pick<CollectionSelectionProps, 'selectedKeys' | 'defaultSelectedKeys' | 'onSelectionChange' | 'disabledKeys'>, presented: readonly TableNode<T>[]): TableSelection<T>;
//# sourceMappingURL=use-table-selection.d.ts.map