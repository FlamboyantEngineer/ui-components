import { type KeyboardEvent } from 'react';
/** The undo and redo of one field, as its root element registers them. */
export interface FieldUndo {
    readonly canUndo: boolean;
    readonly canRedo: boolean;
    undo(): void;
    redo(): void;
}
/** Registers the undo of the field whose root is `root`; returns the function that removes it. */
export declare function registerFieldUndo(root: Element, undo: FieldUndo): () => void;
/**
 * The undo of the field nearest to `element` (the element itself or its closest ancestor that is a
 * field root), or `null` outside any field. A host's shortcut handler passes the focused element.
 */
export declare function getFieldUndo(element: Element | null | undefined): FieldUndo | null;
/**
 * Registers a field's undo on its root element (read through `getRoot` after each commit) and returns
 * the root's key handler, which applies undo and redo chords pressed inside the field.
 */
export declare function useFieldUndo(getRoot: () => Element | null, undo: FieldUndo): (event: KeyboardEvent<HTMLElement>) => void;
//# sourceMappingURL=field-undo.d.ts.map