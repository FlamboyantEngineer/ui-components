import type { Key } from '../../core/props.js';
/** A folder: a key unique among all folders, its name and its subfolders in order. */
export interface FolderItem {
    id: Key;
    name: string;
    children?: readonly FolderItem[] | undefined;
    /** The folder has subfolders that are not loaded yet: expanding it asks for them. */
    hasChildren?: boolean | undefined;
}
/** A row of the folder tree. */
export interface FolderNode<T extends FolderItem> {
    id: Key;
    name: string;
    kind: 'root' | 'folder' | 'draft';
    /** The caller's folder; `null` for the root and draft rows. */
    folder: T | null;
    children?: FolderNode<T>[] | undefined;
    /** The folder has subfolders that are not loaded yet. */
    isLazy: boolean;
}
export interface FolderNodeOptions {
    /** Wraps the folders in a root row with this label. */
    rootLabel?: string | undefined;
    /** Adds a draft row as the last child of this folder (`null`: at the top). */
    draftParentKey?: Key | null | undefined;
    /** Keeps only the folders whose name holds every term, and their ancestors. */
    terms?: readonly string[] | undefined;
}
/** A place folders can move to: a folder, or the top level (`null`). */
export interface FolderDestination<T extends FolderItem> {
    folder: T | null;
    /** The folder and its ancestors' names, outermost first. */
    path: string[];
}
/** The key of the root row. */
export declare const folderRootKey = "folder-manager-root";
/** The key of the draft row. */
export declare const folderDraftKey = "folder-manager-draft";
/**
 * The tree rows for the folders, with the root row and the draft row when asked for. A filter that
 * matches nothing leaves no row, the root row included, so the tree can say so.
 */
export declare function buildFolderNodes<T extends FolderItem>(folders: readonly T[], options: FolderNodeOptions): FolderNode<T>[];
/** The folder `key` and its ancestors, outermost first, or an empty list when it is missing. */
export declare function findFolderPath<T extends FolderItem>(folders: readonly T[], key: Key | null): T[];
/** How many levels a folder and its deepest subfolder span: 1 for a folder without subfolders. */
export declare function getFolderHeight(folder: FolderItem): number;
/** The keys of every row that has children. */
export declare function collectBranchKeys<T extends FolderItem>(nodes: readonly FolderNode<T>[]): Key[];
/**
 * The folders of `keys` in tree order, leaving out those inside another of them: acting on a
 * folder acts on what it holds.
 */
export declare function listTopmostFolders<T extends FolderItem>(folders: readonly T[], keys: ReadonlySet<Key>): T[];
/**
 * Where `moving` folders may go: the top level, then every folder in tree order except the moving
 * ones and the folders inside them, each with the names of its path.
 */
export declare function listFolderDestinations<T extends FolderItem>(folders: readonly T[], moving: ReadonlySet<Key>): FolderDestination<T>[];
//# sourceMappingURL=folder-model.d.ts.map