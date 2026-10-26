import { type DragEvent, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { type CollectionDragAndDropOptions } from '../../utils/use-reorder-drag-and-drop.js';
import { type TableMove, type TableRow } from './table-rows.js';
/** Opt-in row reordering: which rows move and what to do with a move. */
export interface TableReorderOptions<T> {
    /** Whether a row can be dragged or moved by keyboard. Defaults to every row. */
    canMove?: ((row: T) => boolean) | undefined;
    /** Reports one move. The table never reorders its rows itself: apply the move and re-render. */
    onMove: (move: TableMove) => void;
    /**
     * What starts a pointer drag: anywhere on the row (`row`, the default), or only its drag handle
     * (`handle`), which leaves presses elsewhere in the row to the row.
     */
    dragTrigger?: TableDragTrigger | undefined;
    /** The image that follows the pointer during a drag, from the dragged rows. */
    renderDragPreview?: ((rows: T[]) => ReactNode) | undefined;
}
/** What starts a row's pointer drag. */
export type TableDragTrigger = 'row' | 'handle';
export interface TableReorder<T> {
    /** The options the grid hands to `useDragAndDrop`. */
    dragAndDrop: CollectionDragAndDropOptions;
    isMovable: (row: T) => boolean;
    /** Handlers for the table root: Alt+ArrowUp/Down moves, and refused drags of fixed rows. */
    rootProps: {
        onKeyDownCapture: (event: KeyboardEvent<HTMLElement>) => void;
        onDragStartCapture: (event: DragEvent<HTMLElement>) => void;
        onPointerDownCapture: (event: PointerEvent<HTMLElement>) => void;
    };
}
interface ReorderSnapshot<T> {
    rows: readonly T[];
    reorder: TableReorderOptions<T> | undefined;
}
/**
 * Reordering for a table: pointer and keyboard drag and drop through React Aria, plus Alt+Arrow
 * moves of the focused row. Every check reads the rows last rendered.
 */
export declare function useTableReorder<T extends TableRow>(snapshot: ReorderSnapshot<T>): TableReorder<T>;
export {};
//# sourceMappingURL=use-table-reorder.d.ts.map