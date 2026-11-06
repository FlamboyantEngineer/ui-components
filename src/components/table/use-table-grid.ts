'use client';

import { type ReactNode, useMemo } from 'react';
import type { Key, Selection } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { mergeProps } from '../../utils/merge-props.js';
import type { CollectionDragAndDropOptions } from '../../utils/use-reorder-drag-and-drop.js';
import type { TableProps } from './table.js';
import { createTableAriaKeys, createTableRowAction, useTableKeyIndex } from './table-aria-keys.js';
import type { TableBodyProps, TableStatus } from './table-body.js';
import type { TableSelectionBarProps } from './table-bulk-edit.js';
import { resolveExportMenu, type TableExportMenuProps } from './table-export-menu.js';
import { listVisibleRows } from './table-groups.js';
import { pickAriaProps, type TableAriaProps } from './table-props.js';
import { resolveGroupReorder } from './table-reorder-groups.js';
import type { TableColumn, TableRow } from './table-rows.js';
import type { TableStructure } from './table-structure.js';
import { useCellEditing } from './use-cell-editing.js';
import { type ColumnLayout, useColumnLayout } from './use-column-layout.js';
import { type ColumnReorder, useColumnReorder } from './use-column-reorder.js';
import { useColumnWidths } from './use-column-widths.js';
import { type TablePinOffsets, usePinnedOffsets } from './use-pinned-offsets.js';
import { useRecordedEdits } from './use-recorded-edits.js';
import { useTableGrouping } from './use-table-grouping.js';
import { resolveSelectionBar, useCellsView, useRowModel } from './use-table-model.js';
import { type TableReorder, useTableReorder } from './use-table-reorder.js';
import { type TableRowsView, useTableRows } from './use-table-rows.js';
import { useTableSelection } from './use-table-selection.js';

/** The props that shape the grid; the root's presentation is the table's own. */
export type TableGridOptions<T extends TableRow> = Omit<
  TableProps<T>,
  'size' | 'rowHeight' | 'estimatedRowHeight' | 'filterLabel' | 'className' | 'id'
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
  /** The export menu above the grid, when the table exports. */
  exportMenu: TableExportMenuProps<T> | null;
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

/** The body's nodes: the pinned top rows, the current page's rows or groups, the pinned bottom rows. */
function useBodyNodes<T extends TableRow>(
  grouped: ReturnType<typeof useTableGrouping<T>>,
  { pinned }: TableRowsView<T>,
): ReturnType<typeof useTableGrouping<T>> {
  const nodes = useMemo(
    () =>
      pinned.top.length + pinned.bottom.length === 0
        ? grouped.nodes
        : [...pinned.top, ...grouped.nodes, ...pinned.bottom],
    [grouped.nodes, pinned],
  );
  return nodes === grouped.nodes ? grouped : { ...grouped, nodes };
}

/** The rows the grid presents: those of the current page outside collapsed groups and parents. */
function useVisibleRows<T extends TableRow>(grouped: ReturnType<typeof useTableGrouping<T>>): T[] {
  const { nodes, expansion } = grouped;
  return useMemo(
    () => listVisibleRows(nodes, expansion.expandedKeys),
    [nodes, expansion.expandedKeys],
  );
}

/** Keeps row-model inputs stable until the visible groups or their move policy change. */
function useGroupReorder<T extends TableRow>(
  { reorder }: TableGridOptions<T>,
  { rows, sort: { descriptors } }: TableRowsView<T>,
  { nodes, isGrouped, expansion: { expandedKeys } }: ReturnType<typeof useTableGrouping<T>>,
) {
  return useMemo(
    () =>
      resolveGroupReorder(
        { reorder },
        { rows, sort: { descriptors } },
        { nodes, isGrouped, expansion: { expandedKeys } },
      ),
    [reorder, rows, descriptors, nodes, isGrouped, expandedKeys],
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
    historyProps: object;
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
    parts.historyProps,
  );
}

/** The current body and the caller's loading and retry controls. */
function createBody<T extends TableRow>(
  options: TableGridOptions<T>,
  parts: Pick<TableBodyProps<T>, 'nodes' | 'model' | 'status' | 'message'>,
): TableBodyProps<T> {
  return {
    ...parts,
    onRetry: options.onRetry,
    onLoadMore: options.onLoadMore,
    isLoading: options.isLoading,
    loadingMessage: options.loadingMessage,
  };
}

/**
 * Editing and spreadsheet mode over the visible rows and drawn columns, reporting through the
 * callbacks the edit history records.
 */
function useEditingParts<T extends TableRow>(
  options: TableGridOptions<T>,
  parts: { rows: readonly T[]; structure: TableStructure<T>; isRowDisabled: (row: T) => boolean },
) {
  const recorded = useRecordedEdits({ ...options, isRowDisabled: parts.isRowDisabled });
  const edited = {
    ...options,
    onCellEdit: recorded.onCellEdit,
    onCellsChange: recorded.onCellsChange,
  };
  const cells = useCellsView(edited, parts);
  const editing = useCellEditing({
    ...edited,
    columns: parts.structure.columns,
    rows: parts.rows,
    typeToEdit: cells.view !== null,
  });
  return { edited, cells, editing, historyProps: recorded.rootProps };
}

/**
 * Derives everything the grid renders: the rows of the current page under their groups, the drawn
 * columns and their layout, the notice, selection, reordering, editing, spreadsheet mode, pinned
 * offsets and the root's handlers.
 */
export function useTableGrid<T extends TableRow>(options: TableGridOptions<T>): TableGrid<T> {
  const { columns, onRowAction } = options;
  const widths = useColumnWidths(options);
  const layout = useColumnLayout(options);
  const view = useTableRows(options);
  const grouped = useTableGrouping(options, view);
  const selection = useTableSelection(options, view.presentedNodes);
  const keyIndex = useTableKeyIndex(options.rows, options.getChildRows, onRowAction !== undefined);
  const { isRowDisabled } = selection;
  const reorderView = useGroupReorder(options, view, grouped);
  const reordering = useTableReorder({ ...reorderView, isRowDisabled });
  const structure = useStructure(options, layout.visibleColumns, grouped.isGrouped);
  const body = useBodyNodes(grouped, view);
  const visibleRows = useVisibleRows<T>(body);
  const { edited, cells, editing, historyProps } = useEditingParts(options, {
    rows: visibleRows,
    structure,
    isRowDisabled,
  });
  const columnReorder = useColumnReorder({
    columns: layout.visibleColumns,
    moveColumn: layout.moveColumn,
  });
  const hasPins = !structure.isVirtualized && structure.columns.some((column) => column.pin);
  const pinned = usePinnedOffsets(hasPins);
  const hasPinnedRows =
    !structure.isVirtualized && view.pinned.top.length + view.pinned.bottom.length > 0;
  const rowPins = usePinnedOffsets(hasPinnedRows);
  const status = resolveStatus(options, body.nodes.length === 0);
  const message = useStatusMessage(options, status);
  const activeReordering = reorderView.reorder ? reordering : null;
  const model = useRowModel(options, {
    structure,
    status,
    reordering,
    isReorderable: activeReordering !== null,
    hideFixedHandles: reorderView.groupKeys !== undefined,
    pinOffsets: pinned.offsets,
    rowPins: {
      offsets: rowPins.offsets,
      hasStickyEdges: options.stickyHeader === true,
      report: rowPins.report,
    },
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
    body: createBody(options, { nodes: body.nodes, model, status, message }),
    exportMenu: resolveExportMenu(options, { view, selection, drawn: structure.columns }),
    selectionBar: resolveSelectionBar(edited, { selection, columns: structure.columns }),
    rootProps: mergeRootProps(columns, {
      reordering: activeReordering,
      sort: view.sort,
      columnReorder,
      editingProps: editing.rootProps,
      cellsProps: cells.rootProps,
      historyProps,
    }),
  };
}
