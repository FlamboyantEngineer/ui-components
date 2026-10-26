import { useMemo } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { clamp } from '../../utils/clamp.js';
import { createRowMatcher, type TableFilter } from './table-filters.js';
import type { TableColumn, TableRow } from './table-rows.js';
import { createRowComparator } from './table-sort.js';
import {
  buildTableNodes,
  filterTableNodes,
  sortTableNodes,
  type TableChildRows,
  type TableNode,
} from './table-tree.js';
import { useTableSort, type TableSortOptions, type TableSortState } from './use-table-sort.js';

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

interface TableRowsOptions<T extends TableRow> extends TableSortOptions {
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
interface TablePages {
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

/** The current page of `total` top-level rows, and the range of them it shows when the table cuts. */
function resolvePages(pagination: TablePagination | undefined, requested: number, total: number) {
  const size = Math.max(1, Math.floor(pagination?.pageSize ?? 1));
  const pageCount = Math.max(1, Math.ceil((pagination?.rowCount ?? total) / size));
  const page = clamp(requested, 1, pageCount);
  // Rows paged by the caller arrive as the current page.
  const isCut = pagination !== undefined && pagination.rowCount === undefined;
  return {
    page,
    pageCount,
    start: isCut ? (page - 1) * size : 0,
    end: isCut ? page * size : total,
  };
}

/**
 * The rows a table presents: built into nested nodes, filtered and sorted by the table unless the
 * caller controls the filter or the sort, then cut to the current page.
 */
export function useTableRows<T extends TableRow>(options: TableRowsOptions<T>): TableRowsView<T> {
  const { rows, columns, getChildRows, pagination } = options;
  const [filter, setFilter] = useControllableState(
    options.filter,
    options.defaultFilter ?? {},
    options.onFilterChange,
  );
  const isFilterOwned = options.filter === undefined;
  const [requestedPage, setPage] = useControllableState(
    pagination?.page,
    pagination?.defaultPage ?? 1,
    pagination?.onPageChange,
  );
  const resetPage = () => {
    if (pagination && requestedPage !== 1) setPage(1);
  };
  const sort = useTableSort(options, resetPage);

  const presented = useMemo(() => {
    const nodes = buildTableNodes(rows, getChildRows);
    const matches = isFilterOwned ? createRowMatcher(columns, filter) : null;
    const filtered = matches ? filterTableNodes(nodes, matches) : nodes;
    const compare = sort.isControlled ? null : createRowComparator(columns, sort.descriptors);
    return compare ? sortTableNodes(filtered, compare) : filtered;
  }, [rows, getChildRows, columns, filter, isFilterOwned, sort.isControlled, sort.descriptors]);

  const { page, pageCount, start, end } = resolvePages(pagination, requestedPage, presented.length);
  const nodes = useMemo(() => presented.slice(start, end), [presented, start, end]);
  const pageRows = useMemo(() => nodes.map((node) => node.row), [nodes]);
  const presentedRows = useMemo(() => presented.map((node) => node.row), [presented]);

  return {
    nodes,
    rows: pageRows,
    presentedRows,
    presentedNodes: presented,
    sort,
    filter,
    onFilterChange: (next) => {
      setFilter(next);
      resetPage();
    },
    pages: pagination ? { page, pageCount, onPageChange: setPage } : null,
  };
}
