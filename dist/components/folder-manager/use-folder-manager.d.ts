import { type RefObject } from 'react';
import type { Key } from '../../core/props.js';
import type { TreeMove } from '../../utils/tree-reorder.js';
import { type TreeLoads } from '../tree/tree.js';
import { type FolderItem, type FolderNode } from './folder-model.js';
import { type FolderActions, type FolderCallbacks } from './use-folder-actions.js';
import { type FolderExpansion, type FolderSelectionMode, type FolderSelectionOptions } from './use-folder-tree.js';
export interface FolderManagerOptions<T extends FolderItem, M extends FolderSelectionMode = FolderSelectionMode> extends FolderCallbacks<T>, FolderSelectionOptions<M> {
    /** The folders, nested. The manager never changes them: callbacks report each change. */
    folders: readonly T[];
    /** Shows a root row with this label above the folders, standing for no folder (`null`). */
    rootLabel?: string | undefined;
    /** Lets the reader reorder and nest folders; each move is reported here for the owner to apply. */
    onMove?: ((move: TreeMove) => void) | undefined;
    /** Loads the subfolders of a folder with `hasChildren`; it may return a promise. */
    onLoadChildren?: ((key: Key) => unknown) | undefined;
    /** The deepest a folder may sit, the top level being 1. No limit without. */
    maxDepth?: number | undefined;
    /** The folders are loading: the tree shows a loading row and the actions wait. */
    isPending?: boolean | undefined;
}
export interface FolderManagerModel<T extends FolderItem> {
    nodes: FolderNode<T>[];
    /** The selected rows: the folders, the root row for no folder, or the draft row while creating. */
    selectedRows: Key[];
    /** Selects these folders (none: no folder). */
    select(keys: Key[]): void;
    expansion: FolderExpansion;
    actions: FolderActions<T>;
    loads: TreeLoads;
    /** The selected folders, topmost first, in tree order. */
    selection: T[];
    /** The one selected folder and its ancestors, outermost first; empty with none or several. */
    path: T[];
    /** The one selected folder, or `null` with none or several. */
    folder: T | null;
    /** The row whose label is the name field. */
    editKey: Key | null;
    /** Loading, deleting or naming a folder: other actions wait. */
    isBusy: boolean;
    /** The filter query, as typed. */
    query: string;
    setQuery(query: string): void;
    regionRef: RefObject<HTMLDivElement | null>;
    nameRef: RefObject<HTMLInputElement | null>;
    messageId: string;
    startCreate(): void;
    startRename(): void;
    remove(): void;
    /** Moves the selected folders into a folder, or to the top level (`null`). */
    moveTo(destination: T | null): void;
}
/**
 * The folder manager's state: selection, expansion, the filter, loading subfolders, edits,
 * deletes and moves, and focus after each.
 */
export declare function useFolderManager<T extends FolderItem, M extends FolderSelectionMode>(options: FolderManagerOptions<T, M>): FolderManagerModel<T>;
//# sourceMappingURL=use-folder-manager.d.ts.map