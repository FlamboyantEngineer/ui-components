import { type DragEvent, type KeyboardEvent } from 'react';
import { type TableColumnMove } from './table-columns.js';
import type { TableColumn } from './table-rows.js';
/** Where a dragged column would land, shown on the header it would land beside. */
export interface TableColumnDropTarget {
    id: string;
    position: 'before' | 'after';
}
type DragHandler = (event: DragEvent<HTMLElement>) => void;
export interface ColumnReorder {
    /** The header a dragged column would land beside. */
    dropTarget: TableColumnDropTarget | null;
    /** Handlers for the table root: header drags and Alt+ArrowLeft/Right on a focused header. */
    rootProps: {
        onKeyDownCapture: (event: KeyboardEvent<HTMLElement>) => void;
        onDragStartCapture: DragHandler;
        onDragEnterCapture: DragHandler;
        onDragOverCapture: DragHandler;
        onDropCapture: DragHandler;
        onDragEndCapture: DragHandler;
    };
}
interface ColumnReorderOptions<T> {
    /** The drawn columns, in display order. */
    columns: readonly TableColumn<T>[];
    moveColumn: (move: TableColumnMove) => void;
}
/**
 * Column reordering: a reorderable column's header label drags onto another header, landing
 * before or after it, and Alt+ArrowLeft or Alt+ArrowRight on a focused header moves it one step.
 * Moves stay among the columns pinned to the same edge, and the moved header keeps focus.
 */
export declare function useColumnReorder<T>({ columns, moveColumn, }: ColumnReorderOptions<T>): ColumnReorder;
export {};
//# sourceMappingURL=use-column-reorder.d.ts.map