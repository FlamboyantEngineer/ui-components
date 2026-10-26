import type { TableStatus } from './table-body.js';
import type { TableSelectionBarProps } from './table-bulk-edit.js';
import type { TableCellsView, TableRowModel } from './table-row.js';
import type { TableColumn, TableRow } from './table-rows.js';
import type { TableStructure } from './table-structure.js';
import type { CellEditing } from './use-cell-editing.js';
import type { TableGridOptions } from './use-table-grid.js';
import type { TablePinOffsets } from './use-pinned-offsets.js';
import type { TableReorder } from './use-table-reorder.js';
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
export declare function useRowModel<T extends TableRow>(options: TableGridOptions<T>, parts: ModelParts<T>): TableRowModel<T>;
/** Spreadsheet mode's view of the cells, for the visible rows and the drawn columns. */
export declare function useCellsView<T extends TableRow>(options: TableGridOptions<T>, parts: {
    rows: readonly T[];
    structure: TableStructure<T>;
    isRowDisabled: (row: T) => boolean;
}): {
    view: TableCellsView<T> | null;
    rootProps: object;
};
/** The selection bar's props, when the table draws one: multiple selection with bulk actions. */
export declare function resolveSelectionBar<T extends TableRow>(options: TableGridOptions<T>, parts: {
    selection: TableSelection<T>;
    columns: readonly TableColumn<T>[];
}): TableSelectionBarProps<T> | null;
export {};
//# sourceMappingURL=use-table-model.d.ts.map