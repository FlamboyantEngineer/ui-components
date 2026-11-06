'use client';

import { useMemo } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import type { Key } from '../../core/props.js';
import { useLocale } from '../../primitives/index.js';
import { clamp } from '../../utils/clamp.js';
import { useEqualValue } from '../../utils/use-equal-value.js';
import { createRowMatcher, type TableFilter } from './table-filters.js';
import type { TableColumn, TableRow } from './table-rows.js';
import { createRowComparator } from './table-sort.js';
import {
  buildTableNodes,
  filterTableNodes,
  sortTableNodes,
  type TableChildRows,
  type TableNode,
  type TableRowPin,
} from './table-tree.js';
import { type TableSortOptions, type TableSortState, useTableSort } from './use-table-sort.js';

/** The rows that stay at the top and the bottom of the body, by id, in order. */
export interface TablePinnedRows {
  top?: readonly Key[] | undefined;
  bottom?: readonly Key[] | undefined;
}

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
  /** The search box is drawn; without it an owned filter's query is set aside. */
  filterable?: boolean | undefined;
  pagination?: TablePagination | undefined;
  pinnedRows?: TablePinnedRows | undefined;
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
  /** The top-level rows of the current page, pinned ones aside. */
  rows: readonly T[];
  /** The pinned rows at each edge, on every page. */
  pinned: { top: readonly TableNode<T>[]; bottom: readonly TableNode<T>[] };
  /**
   * The top-level rows of every page, filtered and, while the table owns the sort, ordered, between
   * the pinned rows.
   */
  presentedRows: readonly T[];
  /** The rows of every page with their presented child rows, between the pinned rows. */
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

function isSameKeys(left: readonly Key[] | undefined, right: readonly Key[] | undefined): boolean {
  const a = left ?? [];
  const b = right ?? [];
  return a.length === b.length && a.every((key, index) => Object.is(key, b[index]));
}

function isSamePinnedRows(left: TablePinnedRows | undefined, right: TablePinnedRows | undefined) {
  return isSameKeys(left?.top, right?.top) && isSameKeys(left?.bottom, right?.bottom);
}

/**
 * The pinned rows at each edge, from the top-level rows the keys name, in the keys' order, and the
 * rest. A row named at both edges stays at the top.
 */
function splitPinnedRows<T extends TableRow>(
  rows: readonly T[],
  pinned: TablePinnedRows | undefined,
) {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const taken = new Set<Key>();
  const take = (keys: readonly Key[] | undefined, pin: TableRowPin): TableNode<T>[] =>
    (keys ?? []).flatMap((key) => {
      const row = byId.get(key);
      if (!row || taken.has(key)) return [];
      taken.add(key);
      return [{ id: row.id, row, children: [], pin }];
    });
  const top = take(pinned?.top, 'top');
  const bottom = take(pinned?.bottom, 'bottom');
  const rest = taken.size === 0 ? rows : rows.filter((row) => !taken.has(row.id));
  return { top, bottom, rest };
}

/**
 * The rows a table presents: built into nested nodes, filtered and sorted by the table unless the
 * caller controls the filter or the sort, then cut to the current page.
 */
export function useTableRows<T extends TableRow>(options: TableRowsOptions<T>): TableRowsView<T> {
  const { columns, getChildRows, pagination } = options;
  const pinnedRows = useEqualValue(options.pinnedRows, isSamePinnedRows);
  const pinned = useMemo(
    () => splitPinnedRows(options.rows, pinnedRows),
    [options.rows, pinnedRows],
  );
  const rows = pinned.rest;
  const [filter, setFilter] = useControllableState(
    options.filter,
    options.defaultFilter ?? {},
    options.onFilterChange,
  );
  const isFilterOwned = options.filter === undefined;
  // A query outlives its search box when `filterable` turns off; it must not narrow the rows unseen.
  const hasQuery = options.filterable === true;
  const [requestedPage, setPage] = useControllableState(
    pagination?.page,
    pagination?.defaultPage ?? 1,
    pagination?.onPageChange,
  );
  const resetPage = () => {
    if (pagination && requestedPage !== 1) setPage(1);
  };
  const columnIds = useMemo(() => new Set(columns.map((column) => String(column.id))), [columns]);
  const sort = useTableSort(options, columnIds, resetPage);
  const { locale } = useLocale();

  const presented = useMemo(() => {
    const nodes = buildTableNodes(rows, getChildRows);
    const applied = hasQuery ? filter : { ...filter, query: undefined };
    const matches = isFilterOwned ? createRowMatcher(columns, applied) : null;
    const filtered = matches ? filterTableNodes(nodes, matches) : nodes;
    const compare = sort.isControlled
      ? null
      : createRowComparator(columns, sort.descriptors, locale);
    return compare ? sortTableNodes(filtered, compare) : filtered;
  }, [
    rows,
    getChildRows,
    columns,
    filter,
    hasQuery,
    isFilterOwned,
    sort.isControlled,
    sort.descriptors,
    locale,
  ]);

  const { page, pageCount, start, end } = resolvePages(pagination, requestedPage, presented.length);
  const nodes = useMemo(() => presented.slice(start, end), [presented, start, end]);
  const pageRows = useMemo(() => nodes.map((node) => node.row), [nodes]);
  const presentedNodes = useMemo(
    () =>
      pinned.rest === options.rows ? presented : [...pinned.top, ...presented, ...pinned.bottom],
    [pinned, presented, options.rows],
  );
  const presentedRows = useMemo(() => presentedNodes.map((node) => node.row), [presentedNodes]);

  return {
    nodes,
    rows: pageRows,
    pinned,
    presentedRows,
    presentedNodes,
    sort,
    filter,
    onFilterChange: (next) => {
      setFilter(next);
      resetPage();
    },
    pages: pagination ? { page, pageCount, onPageChange: setPage } : null,
  };
}
