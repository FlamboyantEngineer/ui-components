'use client';

import { useShallowStable } from '../../utils/use-shallow-stable.js';
import type { TableStatus } from './table-body.js';
import type { TableRowModel } from './table-row-model.js';
import type { TableRow } from './table-rows.js';
import type { TableStructure } from './table-structure.js';
import type { CellEditing } from './use-cell-editing.js';
import type { TablePinOffsets } from './use-pinned-offsets.js';
import type { TableGridOptions } from './use-table-grid.js';
import type { TableReorder } from './use-table-reorder.js';

/** The parts of the grid every row and cell renders from. */
interface ModelParts<T> {
  structure: TableStructure<T>;
  status: TableStatus | null;
  reordering: TableReorder<T>;
  isReorderable: boolean;
  hideFixedHandles: boolean;
  pinOffsets: TablePinOffsets;
  rowPins: TableRowModel<T>['rowPins'];
  editing: CellEditing<T>;
}

/** What every row and cell renders from, kept stable while its parts are. */
export function useRowModel<T extends TableRow>(
  options: TableGridOptions<T>,
  parts: ModelParts<T>,
): TableRowModel<T> {
  const { renderRowActions, renderRowDetail, getRowAttributes, reorder, renderGroupLabel } =
    options;
  const { structure, status, reordering, isReorderable, pinOffsets, rowPins } = parts;
  const { editing, commit, cancel, release, dismiss } = parts.editing;
  const editingModel = useShallowStable({ editing, commit, cancel, release, dismiss });
  return useShallowStable<TableRowModel<T>>({
    structure,
    renderRowActions,
    renderRowDetail,
    getRowAttributes,
    renderGroupLabel,
    isReorderable: isReorderable && status === null,
    isMovable: reordering.isMovable,
    hideFixedHandles: parts.hideFixedHandles,
    dragTrigger: reorder?.dragTrigger ?? 'row',
    pinOffsets,
    rowPins: useShallowStable(rowPins),
    editing: editingModel,
  });
}
