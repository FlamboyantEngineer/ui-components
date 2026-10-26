import { type KeyboardEvent } from 'react';
import type { TreeItemData, TreeProps } from './tree.js';
import type { TreeRename } from './use-tree-rename.js';
import type { TreeReorder } from './use-tree-reorder.js';
export interface TreeKeyDownOptions<T extends TreeItemData> extends Pick<TreeProps<T>, 'onItemKeyDown'> {
    /** Reordering, while the tree is reorderable. */
    reordering: TreeReorder | null;
    /** In-place renaming, while the owner takes renames. */
    rename: TreeRename<T> | null;
}
/** The tree's handling of keys pressed in its rows, ahead of React Aria's. */
export interface TreeKeyDown<T> {
    /** Records which item a row element draws. */
    registerRow: (node: Element | null, item: T) => void;
    /** Gives the owner, then reordering, each key pressed in a row. */
    onKeyDownCapture: (event: KeyboardEvent<HTMLElement>) => void;
}
/**
 * Keys pressed in a row: the owner's `onItemKeyDown` sees each first and may claim it, then F2
 * renames the row when the owner takes renames and Alt+Arrow chords move it when the tree is
 * reorderable. Keys typed in the rename field go to it alone; other editable elements are left alone.
 */
export declare function useTreeKeyDown<T extends TreeItemData>({ onItemKeyDown, reordering, rename, }: TreeKeyDownOptions<T>): TreeKeyDown<T>;
//# sourceMappingURL=use-tree-key-down.d.ts.map