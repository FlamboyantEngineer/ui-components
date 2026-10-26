import { type JSX, type KeyboardEvent } from 'react';
import type { Key } from '../core/props.js';
/** A dragged item: its data by media type. */
type ReorderDragItem = Record<string, string>;
/** Where dragged items would land: on an item, before or after it, or on the collection itself. */
export type CollectionDropTarget = {
    type: 'root';
} | {
    type: 'item';
    key: Key;
    dropPosition: 'before' | 'after' | 'on';
};
/** A drop target on an item. */
export type CollectionItemDropTarget = Extract<CollectionDropTarget, {
    type: 'item';
}>;
/**
 * The drag and drop options a collection hands to its building block's `useDragAndDrop`: one move
 * operation, the dragged items' text, and the collection's drop indicator and drag preview.
 */
export interface CollectionDragAndDropOptions {
    getItems: (keys: ReadonlySet<Key>) => ReorderDragItem[];
    getAllowedDropOperations: () => 'move'[];
    onDragStart: (event: {
        keys: ReadonlySet<Key>;
    }) => void;
    onDragEnd: () => void;
    getDropOperation: (target: CollectionDropTarget) => 'move' | 'cancel';
    onMove: (event: {
        target: CollectionItemDropTarget;
        keys: ReadonlySet<Key>;
    }) => void;
    renderDropIndicator: (target: CollectionDropTarget) => JSX.Element;
    renderDragPreview?: (items: ReorderDragItem[]) => JSX.Element;
}
/** How a reorderable collection turns drops into moves. */
export interface ReorderDragAndDropOptions<Move> {
    /** The move a drop of `keys` on `target` makes, or `null` where nothing may land. */
    resolveMove: (target: CollectionDropTarget, keys: ReadonlySet<Key>) => Move | null;
    /** Reports the move of an accepted drop. */
    onMove: (move: Move) => void;
    /** The text a dragged item carries to other drop targets. */
    getTextValue: (key: Key) => string;
    /** Draws the collection's drop indicator between items. */
    renderDropIndicator: (target: CollectionDropTarget) => JSX.Element;
    /**
     * Draws the image that follows the pointer during a drag, from the dragged keys, instead of the
     * browser's picture of the dragged element. Read when the hook first renders.
     */
    renderDragPreview?: ((keys: ReadonlySet<Key>) => JSX.Element) | undefined;
}
/** Whether a keydown holds Alt and no other modifier, as a collection's keyboard moves do. */
export declare function isMoveChord(event: KeyboardEvent): boolean;
/**
 * Drag and drop options that reorder a collection: one move operation, and a drop target wherever
 * `resolveMove` lets the dragged keys land. Every check reads the latest options, so a drop is
 * validated against the items shown when it happens, not those shown when the drag started. The
 * collection passes the result to `useDragAndDrop` from the primitives.
 */
export declare function useReorderDragAndDrop<Move>(options: ReorderDragAndDropOptions<Move>): CollectionDragAndDropOptions;
export {};
//# sourceMappingURL=use-reorder-drag-and-drop.d.ts.map