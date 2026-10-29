import { useMemo } from 'react';
import type { TableStatus } from './table-body.js';
import type { TableSelectionBarProps } from './table-bulk-edit.js';
import { createCellGrid } from './table-cell-range.js';
import type { TableCellsView, TableRowModel } from './table-row.js';
import type { TableColumn, TableRow } from './table-rows.js';
import type { TableStructure } from './table-structure.js';
import type { CellEditing } from './use-cell-editing.js';
import { useCellSelection } from './use-cell-selection.js';
import type { TableGridOptions } from './use-table-grid.js';
import type { TablePinOffsets } from './use-pinned-offsets.js';
import type { TableReorder } from './use-table-reorder.js';
import { useShallowStable } from '../../utils/use-shallow-stable.js';
import type { TableSelection } from './use-table-selection.js';

/** The parts of the grid every row and cell renders from. */
interface ModelParts<T> {
  structure: TableStructure<T>;
  status: TableStatus | null;
  reordering: TableReorder<T>;
  isGrouped: boolean;
  pinOffsets: TablePinOffsets;
  editing: CellEditing<T>;
  cells: TableCellsView<T> | null;
}

/** What every row and cell renders from, kept stable while its parts are. */
export function useRowModel<T extends TableRow>(
  options: TableGridOptions<T>,
  parts: ModelParts<T>,
): TableRowModel<T> {
  const { renderRowActions, renderRowDetail, getRowAttributes, reorder, renderGroupLabel } =
    options;
  const { structure, status, reordering, isGrouped, pinOffsets, cells } = parts;
  const { editing, commit, cancel, release, dismiss } = parts.editing;
  const editingModel = useShallowStable({ editing, commit, cancel, release, dismiss });
  return useShallowStable<TableRowModel<T>>({
    structure,
    renderRowActions,
    renderRowDetail,
    getRowAttributes,
    renderGroupLabel,
    isReorderable: reorder !== undefined && status === null && !isGrouped,
    isMovable: reordering.isMovable,
    dragTrigger: reorder?.dragTrigger ?? 'row',
    pinOffsets,
    editing: editingModel,
    cells,
  });
}

/** Spreadsheet mode's view of the cells, for the visible rows and the drawn columns. */
export function useCellsView<T extends TableRow>(
  options: TableGridOptions<T>,
  parts: { rows: readonly T[]; structure: TableStructure<T>; isRowDisabled: (row: T) => boolean },
): { view: TableCellsView<T> | null; rootProps: object } {
  const { rows, structure, isRowDisabled } = parts;
  const grid = useMemo(() => createCellGrid(rows, structure.columns), [rows, structure.columns]);
  const selection = useCellSelection({ ...options, grid, isRowDisabled });
  const { mode, bounds, fillBounds } = selection;
  const canFill =
    bounds !== null &&
    grid.columns.slice(bounds.start, bounds.end + 1).some((column) => column.allowsEditing);
  const view = useMemo(
    () => (mode === 'none' ? null : { mode, grid, bounds, fillBounds, canFill }),
    [mode, grid, bounds, fillBounds, canFill],
  );
  return { view, rootProps: selection.rootProps };
}

/** The selection bar's props, when the table draws one: multiple selection with bulk actions. */
export function resolveSelectionBar<T extends TableRow>(
  options: TableGridOptions<T>,
  parts: { selection: TableSelection<T>; columns: readonly TableColumn<T>[] },
): TableSelectionBarProps<T> | null {
  const { selectionActions, onCellsChange, selectionMode } = options;
  const { selection, columns } = parts;
  const canEdit = columns.some((column) => column.bulkEdit !== undefined);
  if (selectionMode !== 'multiple' || (!selectionActions && !canEdit)) return null;
  return {
    actions: selectionActions ?? [],
    columns,
    rows: selection.selectedRows,
    onClearSelection: () => selection.setSelection(new Set()),
    onEdit: (edits) => {
      if (edits.length > 0) onCellsChange?.(edits);
    },
  };
}
