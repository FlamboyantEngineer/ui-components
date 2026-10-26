import type { Key, Selection } from '../../core/props.js';
import type { CollectionDragAndDropOptions } from '../../utils/use-reorder-drag-and-drop.js';
import type { TableProps } from './table.js';
import type { TableBodyProps } from './table-body.js';
import type { TableSelectionBarProps } from './table-bulk-edit.js';
import type { TableRow } from './table-rows.js';
import { type TableAriaProps } from './table-props.js';
import type { TableStructure } from './table-structure.js';
import { type ColumnLayout } from './use-column-layout.js';
import { type ColumnReorder } from './use-column-reorder.js';
import { useColumnWidths } from './use-column-widths.js';
import { type TablePinOffsets } from './use-pinned-offsets.js';
import { type TableReorder } from './use-table-reorder.js';
import { type TableRowsView } from './use-table-rows.js';
/** The props that shape the grid; the root's presentation is the table's own. */
export type TableGridOptions<T extends TableRow> = Omit<TableProps<T>, 'size' | 'stickyHeader' | 'rowHeight' | 'filterable' | 'filterLabel' | 'className' | 'id'>;
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
/**
 * Derives everything the grid renders: the rows of the current page under their groups, the drawn
 * columns and their layout, the notice, selection, reordering, editing, spreadsheet mode, pinned
 * offsets and the root's handlers.
 */
export declare function useTableGrid<T extends TableRow>(options: TableGridOptions<T>): TableGrid<T>;
//# sourceMappingURL=use-table-grid.d.ts.map