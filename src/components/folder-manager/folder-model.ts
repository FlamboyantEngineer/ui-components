// The folder tree a folder manager shows: the caller's folders, an optional root row standing for
// "no folder", and the draft row of a folder being created.

import type { Key } from 'react-aria-components';

/** A folder: a key unique among all folders, its name and its subfolders in order. */
export interface FolderItem {
  id: Key;
  name: string;
  children?: readonly FolderItem[] | undefined;
}

/** A row of the folder tree. */
export interface FolderNode<T extends FolderItem> {
  id: Key;
  name: string;
  kind: 'root' | 'folder' | 'draft';
  /** The caller's folder; `null` for the root and draft rows. */
  folder: T | null;
  children?: FolderNode<T>[] | undefined;
}

export interface FolderNodeOptions {
  /** Wraps the folders in a root row with this label. */
  rootLabel?: string | undefined;
  /** Adds a draft row as the last child of this folder (`null`: at the top). */
  draftParentKey?: Key | null | undefined;
}

/** The key of the root row. */
export const folderRootKey = 'folder-manager-root';

/** The key of the draft row. */
export const folderDraftKey = 'folder-manager-draft';

function toNodes<T extends FolderItem>(
  folders: readonly T[],
  parentKey: Key | null,
  draftParentKey: Key | null | undefined,
): FolderNode<T>[] {
  const nodes: FolderNode<T>[] = folders.map((folder) => {
    const children = toNodes((folder.children ?? []) as readonly T[], folder.id, draftParentKey);
    return {
      id: folder.id,
      name: folder.name,
      kind: 'folder',
      folder,
      children: children.length > 0 ? children : undefined,
    };
  });
  if (draftParentKey === parentKey) {
    nodes.push({ id: folderDraftKey, name: '', kind: 'draft', folder: null });
  }
  return nodes;
}

/** The tree rows for the folders, with the root row and the draft row when asked for. */
export function buildFolderNodes<T extends FolderItem>(
  folders: readonly T[],
  { rootLabel, draftParentKey }: FolderNodeOptions,
): FolderNode<T>[] {
  const nodes = toNodes(folders, null, draftParentKey);
  if (rootLabel === undefined) return nodes;
  return [{ id: folderRootKey, name: rootLabel, kind: 'root', folder: null, children: nodes }];
}

/** The folder `key` and its ancestors, outermost first, or an empty list when it is missing. */
export function findFolderPath<T extends FolderItem>(folders: readonly T[], key: Key | null): T[] {
  if (key === null) return [];
  for (const folder of folders) {
    if (folder.id === key) return [folder];
    const path = findFolderPath((folder.children ?? []) as readonly T[], key);
    if (path.length > 0) return [folder, ...path];
  }
  return [];
}

/** How many levels a folder and its deepest subfolder span: 1 for a folder without subfolders. */
export function getFolderHeight(folder: FolderItem): number {
  const children = folder.children ?? [];
  return 1 + Math.max(0, ...children.map(getFolderHeight));
}

/** The keys of every row that has children. */
export function collectBranchKeys<T extends FolderItem>(nodes: readonly FolderNode<T>[]): Key[] {
  return nodes.flatMap((node) =>
    node.children ? [node.id, ...collectBranchKeys(node.children)] : [],
  );
}
