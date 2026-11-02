import type { ReactNode } from 'react';
import type { TableRowAttributes } from './table.js';
import type { TableGroup } from './table-groups.js';
import type { TableStructure } from './table-structure.js';
import type { CellEditing } from './use-cell-editing.js';
import type { CellSelection } from './use-cell-selection.js';
import type { TablePinOffsets } from './use-pinned-offsets.js';
import type { TableDragTrigger } from './use-table-reorder.js';

/** What every row and cell of a table renders from. */
export interface TableRowModel<T> {
  structure: TableStructure<T>;
  renderRowActions?: ((row: T) => ReactNode) | undefined;
  renderRowDetail?: ((row: T) => ReactNode) | undefined;
  getRowAttributes?: ((row: T) => TableRowAttributes) | undefined;
  /** Draws drag handles; `isMovable` tells which are enabled. */
  isReorderable: boolean;
  isMovable: (row: T) => boolean;
  /** Group-constrained moves show handles only for eligible rows. */
  hideFixedHandles?: boolean;
  dragTrigger: TableDragTrigger;
  pinOffsets: TablePinOffsets;
  editing: Pick<CellEditing<T>, 'editing' | 'commit' | 'cancel' | 'release' | 'dismiss'>;
  renderGroupLabel?: ((group: TableGroup<T>) => ReactNode) | undefined;
  /** Spreadsheet mode's selected cells, or null without it. */
  cells: TableCellsView<T> | null;
}

/** What spreadsheet mode draws on the cells. */
export interface TableCellsView<T> extends Pick<
  CellSelection<T>,
  'mode' | 'grid' | 'bounds' | 'fillBounds'
> {
  /** The selected cells include an editable one, so the corner cell holds a fill handle. */
  canFill: boolean;
}
