import { type KeyboardEvent, type ReactNode } from 'react';
import type { Key } from '../../core/props.js';
import type { TreeItemData, TreeProps } from './tree.js';
export type TreeRenameOptions<T extends TreeItemData> = Pick<TreeProps<T>, 'onRename' | 'canRename'> & {
    getTextValue: (item: T) => string;
};
/** A tree's in-place rename, while the owner takes renames. */
export interface TreeRename<T> {
    /** The row being renamed, or `null`. */
    editingKey: Key | null;
    /** Starts renaming a row the owner lets rename; returns whether it started. */
    start: (item: T) => boolean;
    /** Handles a key typed in the name field; no key there reaches the tree. */
    onEditorKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
    /** Whether a key comes from the name field. */
    isEditorEvent: (event: KeyboardEvent<HTMLElement>) => boolean;
    /** The name field of the row being renamed. */
    renderEditor: (item: T) => ReactNode;
}
/**
 * Renaming rows in place: F2 on a row the owner lets rename (`canRename`, every row by default)
 * opens a name field holding the text value. Enter and leaving the field report a changed, non-blank
 * name through `onRename`; Escape abandons it. Enter and Escape return focus to the row.
 */
export declare function useTreeRename<T extends TreeItemData>(options: TreeRenameOptions<T>): TreeRename<T> | null;
//# sourceMappingURL=use-tree-rename.d.ts.map