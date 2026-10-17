import { useMemo, type ReactNode } from 'react';
import type { Key, TableProps as AriaTableProps } from 'react-aria-components';
import { useUiStrings } from '../../core/provider.js';
import type { TableColumnWidths } from './column-sizing.js';
import type { TableProps } from './table.js';
import type { TableBodyProps, TableStatus } from './table-body.js';
import type { TableStructure } from './table-header.js';
import type { TableRow } from './table-rows.js';
import {
  useTableReorder,
  type TableReorder,
  type TableReorderOptions,
} from './use-table-reorder.js';
import { useTableRows, type TableRowsView } from './use-table-rows.js';

/** The props that shape the grid; the root, filter and widths are the table's own. */
export interface TableGridOptions<T extends TableRow> extends Omit<
  TableProps<T>,
  | 'density'
  | 'stickyHeader'
  | 'virtualized'
  | 'rowHeight'
  | 'filterable'
  | 'filterLabel'
  | 'persistKey'
  | 'onColumnWidthsChange'
  | 'className'
  | 'id'
  | `data-${string}`
> {
  /** The filter query; empty keeps every row. */
  query: string;
  widths: TableColumnWidths;
}

/** What the React Aria table element renders from. */
export interface TableGrid<T> {
  ariaProps: Omit<AriaTableProps, 'onRowAction' | 'sortDescriptor' | 'onSortChange'>;
  view: TableRowsView<T>;
  reorder: TableReorderOptions<T> | undefined;
  reordering: TableReorder<T>;
  onRowAction: ((key: Key) => void) | undefined;
  widths: TableColumnWidths;
  body: TableBodyProps<T>;
}

type StatusProps = Pick<
  TableProps<TableRow>,
  'errorMessage' | 'isLoading' | 'loadingMessage' | 'emptyMessage'
>;

function resolveStatus(props: StatusProps, isEmpty: boolean): TableStatus | null {
  if (props.errorMessage !== undefined && props.errorMessage !== null) return 'error';
  if (props.isLoading) return 'loading';
  return isEmpty ? 'empty' : null;
}

function useStatusMessage(props: StatusProps, status: TableStatus | null): ReactNode {
  const strings = useUiStrings();
  if (status === 'error') return props.errorMessage;
  if (status === 'loading') return props.loadingMessage ?? strings.loading;
  return props.emptyMessage ?? strings.noResults;
}

/** Derives the rows, the notice, the column structure and the reordering of a table's grid. */
export function useTableGrid<T extends TableRow>(options: TableGridOptions<T>): TableGrid<T> {
  const {
    columns,
    rows,
    query,
    widths,
    sortDescriptor,
    defaultSortDescriptor,
    onSortChange,
    isLoading,
    loadingMessage,
    errorMessage,
    emptyMessage,
    onRetry,
    renderRowActions,
    actionsColumnWidth = 44,
    reorder,
    onRowAction,
    ...ariaProps
  } = options;
  const view = useTableRows({
    rows,
    columns,
    query,
    sortDescriptor,
    defaultSortDescriptor,
    onSortChange,
  });
  const reordering = useTableReorder({ rows: view.rows, reorder });
  const status = resolveStatus({ errorMessage, isLoading }, view.rows.length === 0);
  const message = useStatusMessage({ errorMessage, loadingMessage, emptyMessage }, status);
  // React Aria needs a data column to name rows: without one, draw no other column or row.
  const hasColumns = columns.length > 0;
  const hasSelection = hasColumns && ariaProps.selectionMode === 'multiple';
  const hasActions = hasColumns && renderRowActions !== undefined;
  const structure = useMemo<TableStructure<T>>(
    () => ({ columns, hasSelection, hasActions, actionsColumnWidth }),
    [columns, hasSelection, hasActions, actionsColumnWidth],
  );
  const body: TableBodyProps<T> = {
    rows: view.rows,
    structure,
    status,
    message,
    onRetry,
    renderRowActions,
    isReorderable: reorder !== undefined && status === null,
    isMovable: reordering.isMovable,
  };
  return { ariaProps, view, reorder, reordering, onRowAction, widths, body };
}
