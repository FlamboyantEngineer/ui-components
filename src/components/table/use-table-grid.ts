import { useMemo, type ReactNode } from 'react';
import type { Key, Selection } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { mergeProps } from '../../utils/merge-props.js';
import type { CollectionDragAndDropOptions } from '../../utils/use-reorder-drag-and-drop.js';
import type { TableProps } from './table.js';
import type { TableBodyProps, TableStatus } from './table-body.js';
import type { TableSelectionBarProps } from './table-bulk-edit.js';
import { listVisibleRows } from './table-groups.js';
import type { TableColumn, TableRow } from './table-rows.js';
import { pickAriaProps, type TableAriaProps } from './table-props.js';
import type { TableStructure } from './table-structure.js';
import { useCellEditing } from './use-cell-editing.js';
import { useColumnLayout, type ColumnLayout } from './use-column-layout.js';
import { useColumnReorder, type ColumnReorder } from './use-column-reorder.js';
import { useColumnWidths } from './use-column-widths.js';
import { usePinnedOffsets, type TablePinOffsets } from './use-pinned-offsets.js';
import { useTableGrouping } from './use-table-grouping.js';
import { useTableReorder, type TableReorder } from './use-table-reorder.js';
import { useTableRows, type TableRowsView } from './use-table-rows.js';
import { resolveSelectionBar, useCellsView, useRowModel } from './use-table-model.js';
import { useTableSelection } from './use-table-selection.js';
import { createTableAriaKeys, createTableRowAction, useTableKeyIndex } from './table-aria-keys.js';

/** The props that shape the grid; the root's presentation is the table's own. */
export type TableGridOptions<T extends TableRow> = Omit<
  TableProps<T>,
  'size' | 'stickyHeader' | 'rowHeight' | 'filterable' | 'filterLabel' | 'className' | 'id'
>;

/** What the table renders from. */
export interface TableGrid<T> {
  /** React Aria's table props, with the selected and expanded keys the table holds. */
  ariaProps: TableAriaProps & {
    selectedKeys: Selection;
    onSelectionChange: (keys: Selection) => void;
    expandedKeys: Set<Key>;
    onExpandedChange: (keys: Set<Key>) => void;
  };
  view: TableRowsView<T>;
  structure: TableStructure<T>;
  layout: ColumnLayout<T>;
  widths: ReturnType<typeof useColumnWidths>;
  reordering: TableReorder<T> | null;
  /** The grid's drag and drop options, built whether or not the table reorders. */
  dragAndDrop: CollectionDragAndDropOptions;
  columnReorder: ColumnReorder;
  pinOffsets: TablePinOffsets;
  /** Takes the pinned offsets the header measures. */
  onPinOffsets: (offsets: TablePinOffsets) => void;
  onRowAction: ((key: Key) => void) | undefined;
  body: TableBodyProps<T>;
  /** The selection bar above the grid, when the table draws one. */
  selectionBar: TableSelectionBarProps<T> | null;
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
  isGrouped: boolean,
): TableStructure<T> {
  const { selectionMode, renderRowActions, actionsColumnWidth = 44, virtualized = false } = options;
  const { cellWrap = 'nowrap' } = options;
  const isExpandable =
    isGrouped || options.getChildRows !== undefined || options.renderRowDetail !== undefined;
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
      cellWrap,
      treeColumn,
      isVirtualized: virtualized,
    }),
    [columns, hasSelection, hasActions, actionsColumnWidth, cellWrap, treeColumn, virtualized],
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
    cellsProps: object;
  },
): object {
  const hasColumnMoves = columns.some((column) => column.allowsReordering);
  const hasEditing = columns.some((column) => column.allowsEditing);
  return mergeProps(
    parts.reordering?.rootProps ?? {},
    parts.sort.isMultiple ? parts.sort.rootProps : {},
    hasColumnMoves ? parts.columnReorder.rootProps : {},
    hasEditing ? parts.editingProps : {},
    parts.cellsProps,
  );
}

/**
 * Derives everything the grid renders: the rows of the current page under their groups, the drawn
 * columns and their layout, the notice, selection, reordering, editing, spreadsheet mode, pinned
 * offsets and the root's handlers.
 */
export function useTableGrid<T extends TableRow>(options: TableGridOptions<T>): TableGrid<T> {
  const { columns, reorder, onRowAction, onRetry, onLoadMore, isLoading } = options;
  const widths = useColumnWidths(options);
  const layout = useColumnLayout(options);
  const view = useTableRows(options);
  const grouped = useTableGrouping(options, view);
  const selection = useTableSelection(options, view.presentedNodes);
  const keyIndex = useTableKeyIndex(options.rows, options.getChildRows, onRowAction !== undefined);
  const reordering = useTableReorder({ rows: view.rows, reorder });
  const structure = useStructure(options, layout.visibleColumns, grouped.isGrouped);
  const visibleRows = useMemo(
    () => listVisibleRows(grouped.nodes, grouped.expansion.expandedKeys),
    [grouped.nodes, grouped.expansion.expandedKeys],
  );
  const cells = useCellsView(options, {
    rows: visibleRows,
    structure,
    isRowDisabled: selection.isRowDisabled,
  });
  const editing = useCellEditing({ ...options, typeToEdit: cells.view !== null });
  const columnReorder = useColumnReorder({
    columns: layout.visibleColumns,
    moveColumn: layout.moveColumn,
  });
  const hasPins = !structure.isVirtualized && structure.columns.some((column) => column.pin);
  const pinned = usePinnedOffsets(hasPins);
  const status = resolveStatus(options, view.nodes.length === 0);
  const message = useStatusMessage(options, status);
  const activeReordering = reorder && !grouped.isGrouped ? reordering : null;
  const model = useRowModel(options, {
    structure,
    status,
    reordering,
    isGrouped: grouped.isGrouped,
    pinOffsets: pinned.offsets,
    editing,
    cells: cells.view,
  });
  return {
    ariaProps: {
      ...pickAriaProps(options),
      ...createTableAriaKeys({
        selection,
        expansion: grouped.expansion,
        disabledKeys: selection.disabledKeys,
      }),
    },
    view,
    structure,
    layout,
    widths,
    reordering: activeReordering,
    dragAndDrop: reordering.dragAndDrop,
    columnReorder,
    pinOffsets: pinned.offsets,
    onPinOffsets: pinned.report,
    onRowAction: createTableRowAction(keyIndex, onRowAction),
    body: {
      nodes: grouped.nodes,
      model,
      status,
      message,
      onRetry,
      onLoadMore,
      isLoading,
      loadingMessage: options.loadingMessage,
    },
    selectionBar: resolveSelectionBar(options, { selection, columns: structure.columns }),
    rootProps: mergeRootProps(columns, {
      reordering: activeReordering,
      sort: view.sort,
      columnReorder,
      editingProps: editing.rootProps,
      cellsProps: cells.rootProps,
    }),
  };
}
