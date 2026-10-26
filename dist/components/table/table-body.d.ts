import type { ReactNode } from 'react';
import type { TableBodyNode } from './table-groups.js';
import type { TableRowModel } from './table-row.js';
import type { TableRow } from './table-rows.js';
/** The notice a table shows in place of its rows. */
export type TableStatus = 'loading' | 'empty' | 'error';
/** The rows, or the notice that replaces them. */
export interface TableBodyProps<T> {
    /** The rows of the current page, with their child rows, under their groups when grouped. */
    nodes: readonly TableBodyNode<T>[];
    model: TableRowModel<T>;
    status: TableStatus | null;
    /** The notice's text or content. */
    message: ReactNode;
    onRetry?: (() => void | Promise<unknown>) | undefined;
    /** Asks for more rows when the end of the rows scrolls into view. */
    onLoadMore?: (() => void) | undefined;
    /** More rows are loading: a loading row follows the rows. */
    isLoading?: boolean | undefined;
}
/** The key of the notice row, kept out of row actions. */
export declare const stateRowId = "ui-table-state-row";
/** The table body: one row per item with its child rows, or one full-width notice row. */
export declare function TableBody<T extends TableRow>(props: TableBodyProps<T>): import("react").JSX.Element;
//# sourceMappingURL=table-body.d.ts.map