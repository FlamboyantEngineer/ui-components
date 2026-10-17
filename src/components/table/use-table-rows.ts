import { useMemo } from 'react';
import type { SortDescriptor } from 'react-aria-components';
import { useControllableState } from '../../core/controllable-state.js';
import {
  filterTableRows,
  nextSortDescriptor,
  sortTableRows,
  type TableColumn,
  type TableRow,
} from './table-rows.js';

export interface TableRowsOptions<T extends TableRow> {
  rows: readonly T[];
  columns: readonly TableColumn<T>[];
  /** The filter query; empty keeps every row. */
  query: string;
  /** Controlled sort: the rows are taken in the order given and the header reports it. */
  sortDescriptor?: SortDescriptor | null | undefined;
  /** Initial sort while the table owns it and orders the rows itself. */
  defaultSortDescriptor?: SortDescriptor | null | undefined;
  onSortChange?: ((descriptor: SortDescriptor | null) => void) | undefined;
}

export interface TableRowsView<T> {
  /** The rows to render, filtered and, while the table owns the sort, ordered. */
  rows: readonly T[];
  sortDescriptor: SortDescriptor | null;
  /** Takes React Aria's requested sort and applies the three-step cycle. */
  onSortChange: (requested: SortDescriptor) => void;
}

/** The rows a table presents: its own or the caller's sort, then the filter query. */
export function useTableRows<T extends TableRow>(options: TableRowsOptions<T>): TableRowsView<T> {
  const { rows, columns, query, sortDescriptor, defaultSortDescriptor, onSortChange } = options;
  const [current, setSort] = useControllableState(
    sortDescriptor,
    defaultSortDescriptor ?? null,
    onSortChange,
  );
  // A controlled sort is the caller's to apply, so its rows arrive already ordered.
  const isControlled = sortDescriptor !== undefined;

  const presented = useMemo(() => {
    const ordered = isControlled ? rows : sortTableRows(rows, columns, current);
    return filterTableRows(ordered, columns, query);
  }, [rows, columns, query, isControlled, current]);

  const changeSort = (requested: SortDescriptor) => setSort(nextSortDescriptor(current, requested));

  return { rows: presented, sortDescriptor: current, onSortChange: changeSort };
}
