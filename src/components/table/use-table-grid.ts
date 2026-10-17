import { useMemo, type ReactNode } from 'react';
import type { Key } from 'react-aria-components';
import { useUiStrings } from '../../core/provider.js';
import { mergeProps } from '../../utils/merge-props.js';
import type { TableProps } from './table.js';
import { stateRowId, type TableBodyProps, type TableStatus } from './table-body.js';
import { footerRowId } from './table-footer.js';
import { detailRowPrefix, type TableRowModel } from './table-row.js';
import type { TableColumn, TableRow } from './table-rows.js';
import { pickAriaProps, type TableAriaProps } from './table-props.js';
import type { TableStructure } from './table-structure.js';
import { useCellEditing } from './use-cell-editing.js';
import { useColumnLayout, type ColumnLayout } from './use-column-layout.js';
import { useColumnReorder, type ColumnReorder } from './use-column-reorder.js';
import { useColumnWidths } from './use-column-widths.js';
import { usePinnedOffsets, type TablePinOffsets } from './use-pinned-offsets.js';
import { useTableReorder, type TableReorder } from './use-table-reorder.js';
import { useTableRows, type TableRowsView } from './use-table-rows.js';

/** The props that shape the grid; the root's presentation is the table's own. */
export type TableGridOptions<T extends TableRow> = Omit<
  TableProps<T>,
  'size' | 'stickyHeader' | 'rowHeight' | 'filterable' | 'filterLabel' | 'className' | 'id'
>;

/** What the table renders from. */
export interface TableGrid<T> {
  ariaProps: TableAriaProps;
  view: TableRowsView<T>;
  structure: TableStructure<T>;
  layout: ColumnLayout<T>;
  widths: ReturnType<typeof useColumnWidths>;
  reordering: TableReorder<T> | null;
  columnReorder: ColumnReorder;
  pinOffsets: TablePinOffsets;
  /** Takes the pinned offsets the header measures. */
  onPinOffsets: (offsets: TablePinOffsets) => void;
  onRowAction: ((key: Key) => void) | undefined;
  body: TableBodyProps<T>;
  /** Handlers for the table root from every feature in use. */
  rootProps: object;
}

type StatusProps = Pick<
  TableProps<TableRow>,
  'errorMessage' | 'isPending' | 'loadingMessage' | 'emptyMessage'
>;

function resolveStatus(props: StatusProps, isEmpty: boolean): TableStatus | null {
  if (props.errorMessage !== undefined && props.errorMessage !== null) return 'error';
  if (props.isPending) return 'loading';
  return isEmpty ? 'empty' : null;
}

function useStatusMessage(props: StatusProps, status: TableStatus | null): ReactNode {
  const strings = useUiStrings();
  if (status === 'error') return props.errorMessage;
  if (status === 'loading') return props.loadingMessage ?? strings.loading;
  return props.emptyMessage ?? strings.noResults;
}

/** Whether a key names a row of the caller's, not a notice, detail or summary row. */
function isDataRowKey(key: Key): boolean {
  return key !== stateRowId && key !== footerRowId && !String(key).startsWith(detailRowPrefix);
}

/** The data column holding expand buttons: the caller's, if drawn, else the first drawn column. */
function resolveTreeColumn<T>(
  columns: readonly TableColumn<T>[],
  requested: Key | undefined,
  isExpandable: boolean,
): string | null {
  const drawn = columns.find((column) => column.id === String(requested));
  if (drawn) return drawn.id;
  return isExpandable ? (columns[0]?.id ?? null) : null;
}

/** The columns the table draws around its data columns. React Aria needs a data column to name rows. */
function useStructure<T extends TableRow>(
  options: TableGridOptions<T>,
  columns: readonly TableColumn<T>[],
): TableStructure<T> {
  const { selectionMode, renderRowActions, actionsColumnWidth = 44, virtualized = false } = options;
  const isExpandable = options.getChildRows !== undefined || options.renderRowDetail !== undefined;
  const treeColumn = resolveTreeColumn(columns, options.treeColumn, isExpandable);
  const hasColumns = columns.length > 0;
  const hasSelection = hasColumns && selectionMode === 'multiple';
  const hasActions = hasColumns && renderRowActions !== undefined;
  return useMemo(
    () => ({
      columns,
      hasSelection,
      hasActions,
      actionsColumnWidth,
      treeColumn,
      isVirtualized: virtualized,
    }),
    [columns, hasSelection, hasActions, actionsColumnWidth, treeColumn, virtualized],
  );
}

/** The root handlers of the features in use, merged so each sees every event. */
function mergeRootProps<T extends TableRow>(
  columns: readonly TableColumn<T>[],
  parts: {
    reordering: TableReorder<T> | null;
    sort: TableRowsView<T>['sort'];
    columnReorder: ColumnReorder;
    editingProps: object;
  },
): object {
  const hasColumnMoves = columns.some((column) => column.allowsReordering);
  const hasEditing = columns.some((column) => column.allowsEditing);
  return mergeProps(
    parts.reordering?.rootProps ?? {},
    parts.sort.isMultiple ? parts.sort.rootProps : {},
    hasColumnMoves ? parts.columnReorder.rootProps : {},
    hasEditing ? parts.editingProps : {},
  );
}

/**
 * Derives everything the grid renders: the rows of the current page, the drawn columns and their
 * layout, the notice, reordering, editing, pinned offsets and the root's handlers.
 */
export function useTableGrid<T extends TableRow>(options: TableGridOptions<T>): TableGrid<T> {
  const {
    columns,
    reorder,
    onRowAction,
    renderRowActions,
    renderRowDetail,
    onRetry,
    onLoadMore,
    isLoading,
  } = options;
  const widths = useColumnWidths(options);
  const layout = useColumnLayout(options);
  const view = useTableRows(options);
  const reordering = useTableReorder({ rows: view.rows, reorder });
  const editing = useCellEditing(options);
  const columnReorder = useColumnReorder({
    columns: layout.visibleColumns,
    moveColumn: layout.moveColumn,
  });
  const structure = useStructure(options, layout.visibleColumns);
  const hasPins = !structure.isVirtualized && structure.columns.some((column) => column.pin);
  const pinned = usePinnedOffsets(hasPins);
  const pinOffsets = pinned.offsets;
  const status = resolveStatus(options, view.nodes.length === 0);
  const message = useStatusMessage(options, status);
  const { editing: editingCell, commit, cancel, release } = editing;
  const model = useMemo<TableRowModel<T>>(
    () => ({
      structure,
      renderRowActions,
      renderRowDetail,
      isReorderable: reorder !== undefined && status === null,
      isMovable: reordering.isMovable,
      dragTrigger: reorder?.dragTrigger ?? 'row',
      pinOffsets,
      editing: { editing: editingCell, commit, cancel, release },
    }),
    [
      structure,
      renderRowActions,
      renderRowDetail,
      reorder,
      status,
      reordering.isMovable,
      pinOffsets,
      editingCell,
      commit,
      cancel,
      release,
    ],
  );
  const activeReordering = reorder ? reordering : null;
  return {
    ariaProps: pickAriaProps(options),
    view,
    structure,
    layout,
    widths,
    reordering: activeReordering,
    columnReorder,
    pinOffsets,
    onPinOffsets: pinned.report,
    onRowAction: onRowAction && ((key: Key) => isDataRowKey(key) && onRowAction(key)),
    body: { nodes: view.nodes, model, status, message, onRetry, onLoadMore, isLoading },
    rootProps: mergeRootProps(columns, {
      reordering: activeReordering,
      sort: view.sort,
      columnReorder,
      editingProps: editing.rootProps,
    }),
  };
}
