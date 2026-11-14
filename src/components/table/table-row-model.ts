import type { ReactNode } from 'react';
import type { TableRowAttributes } from './table.js';
import type { TableGroup } from './table-groups.js';
import type { TableStructure } from './table-structure.js';
import type { CellEditing } from './use-cell-editing.js';
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
  /** Where a static table's pinned rows stick, and how a pinned row reports them. */
  rowPins: {
    /** Each pinned row's distance from its edge, by row collection key. */
    offsets: TablePinOffsets;
    /** The header and the summary stay in view, so pinned rows stick beside them. */
    hasStickyEdges: boolean;
    report: (offsets: TablePinOffsets) => void;
  };
  editing: Pick<CellEditing<T>, 'editing' | 'commit' | 'cancel' | 'release' | 'dismiss'>;
  renderGroupLabel?: ((group: TableGroup<T>) => ReactNode) | undefined;
}
