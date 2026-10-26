import { type TableFilter } from './table-filters.js';
import type { TableColumn, TableRow } from './table-rows.js';
import { type TableChildRows, type TableNode } from './table-tree.js';
import { type TableSortOptions, type TableSortState } from './use-table-sort.js';
/** Shows the rows one page at a time under a page navigation. */
export interface TablePagination {
    /** Rows per page. */
    pageSize: number;
    /** The current page, from 1 (controlled). */
    page?: number | undefined;
    /** The page shown first while the table owns the page. Defaults to 1. */
    defaultPage?: number | undefined;
    /** Called with the page the reader moves to, and with 1 when the sort or the filter changes. */
    onPageChange?: ((page: number) => void) | undefined;
    /**
     * The number of rows across every page, for rows paged by the caller (on a server): `rows` is
     * then the current page, shown as given.
     */
    rowCount?: number | undefined;
}
export interface TableRowsOptions<T extends TableRow> extends TableSortOptions {
    rows: readonly T[];
    columns: readonly TableColumn<T>[];
    /** A row's child rows, for nested rows. */
    getChildRows?: TableChildRows<T>;
    /** Controlled filter: the caller filters `rows`; the controls show it. */
    filter?: TableFilter | undefined;
    /** Initial filter while the table owns the filter and filters `rows` itself. */
    defaultFilter?: TableFilter | undefined;
    onFilterChange?: ((filter: TableFilter) => void) | undefined;
    pagination?: TablePagination | undefined;
}
/** The current page and how to move to another. */
export interface TablePages {
    page: number;
    pageCount: number;
    onPageChange: (page: number) => void;
}
export interface TableRowsView<T> {
    /** The rows of the current page, with their presented child rows. */
    nodes: readonly TableNode<T>[];
    /** The top-level rows of the current page. */
    rows: readonly T[];
    /** The top-level rows of every page, filtered and, while the table owns the sort, ordered. */
    presentedRows: readonly T[];
    /** The rows of every page with their presented child rows. */
    presentedNodes: readonly TableNode<T>[];
    sort: TableSortState;
    filter: TableFilter;
    onFilterChange: (filter: TableFilter) => void;
    /** The pages, when the table is paginated. */
    pages: TablePages | null;
}
/**
 * The rows a table presents: built into nested nodes, filtered and sorted by the table unless the
 * caller controls the filter or the sort, then cut to the current page.
 */
export declare function useTableRows<T extends TableRow>(options: TableRowsOptions<T>): TableRowsView<T>;
//# sourceMappingURL=use-table-rows.d.ts.map