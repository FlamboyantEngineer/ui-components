import type { JSX, ReactNode } from 'react';
import type { TableRowAttributes } from './table.js';
import { type TableRow } from './table-rows.js';
import { type TableStructure } from './table-structure.js';
import type { TableNode } from './table-tree.js';
import type { TableGroup } from './table-groups.js';
import { type CellEditing } from './use-cell-editing.js';
import type { CellSelection } from './use-cell-selection.js';
import type { TableDragTrigger } from './use-table-reorder.js';
import type { TablePinOffsets } from './use-pinned-offsets.js';
/** What every row and cell of a table renders from. */
export interface TableRowModel<T> {
    structure: TableStructure<T>;
    renderRowActions?: ((row: T) => ReactNode) | undefined;
    renderRowDetail?: ((row: T) => ReactNode) | undefined;
    getRowAttributes?: ((row: T) => TableRowAttributes) | undefined;
    /** Draws drag handles; `isMovable` tells which are enabled. */
    isReorderable: boolean;
    isMovable: (row: T) => boolean;
    dragTrigger: TableDragTrigger;
    pinOffsets: TablePinOffsets;
    editing: Pick<CellEditing<T>, 'editing' | 'commit' | 'cancel' | 'release' | 'dismiss'>;
    renderGroupLabel?: ((group: TableGroup<T>) => ReactNode) | undefined;
    /** Spreadsheet mode's selected cells, or null without it. */
    cells: TableCellsView<T> | null;
}
/** What spreadsheet mode draws on the cells. */
export interface TableCellsView<T> extends Pick<CellSelection<T>, 'mode' | 'grid' | 'bounds' | 'fillBounds'> {
    /** The selected cells include an editable one, so the corner cell holds a fill handle. */
    canFill: boolean;
}
/** The key prefix of detail rows, kept out of row actions, selection and moves. */
export declare const detailRowPrefix = "ui-table-detail:";
/**
 * The expand button of a row with child or detail rows, named by React Aria after the row
 * (`Expand <row>`, `Collapse <row>`), or a spacer holding its place.
 */
export declare function TableExpandButton({ hasChildItems, isExpanded, }: {
    hasChildItems: boolean;
    isExpanded: boolean;
}): JSX.Element;
/** One row with its cells, then its detail row and its child rows. */
export declare function TableDataRow<T extends TableRow>({ id, node, model, }: {
    id: string;
    node: TableNode<T>;
    model: TableRowModel<T>;
}): JSX.Element;
//# sourceMappingURL=table-row.d.ts.map