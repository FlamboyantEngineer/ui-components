import type { ExpansionProps } from '../../core/events.js';
import type { TableChildRows } from './table-tree.js';
import { type TableBodyNode } from './table-groups.js';
import type { TableColumn, TableRow } from './table-rows.js';
import { type TableExpansion, type TableGroupingProps } from './use-table-expansion.js';
import type { TableRowsView } from './use-table-rows.js';
interface TableGroupingOptions<T> extends TableGroupingProps<T>, ExpansionProps {
    /** Every column, drawn or hidden, which `groupBy` may name. */
    columns: readonly TableColumn<T>[];
    rows: readonly T[];
    getChildRows?: TableChildRows<T>;
}
/** The table body's nodes, grouped or not, and the expansion of its rows and groups. */
export interface TableGroupedBody<T> {
    nodes: readonly TableBodyNode<T>[];
    isGrouped: boolean;
    expansion: TableExpansion;
}
/**
 * Groups the rows of the current page with `groupBy` once they are filtered and sorted, ordering
 * groups by the table's sort of their column, and tracks which rows and groups are expanded.
 */
export declare function useTableGrouping<T extends TableRow>(options: TableGroupingOptions<T>, view: Pick<TableRowsView<T>, 'nodes' | 'sort'>): TableGroupedBody<T>;
export {};
//# sourceMappingURL=use-table-grouping.d.ts.map