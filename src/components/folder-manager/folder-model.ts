// The folder tree a folder manager shows: the caller's folders, an optional root row standing for
// "no folder", the draft row of a folder being created, and the folders a filter keeps.

import { findMaximum } from '../../utils/find-maximum.js';
import type { Key } from '../../core/props.js';
import { textMatchesTerms } from '../text-match/text-match.js';

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
export const folderRootKey = 'folder-manager-root';

/** The key of the draft row. */
export const folderDraftKey = 'folder-manager-draft';

function childrenOf<T extends FolderItem>(folder: T): readonly T[] {
  return (folder.children ?? []) as readonly T[];
}

function toNodes<T extends FolderItem>(
  folders: readonly T[],
  parentKey: Key | null,
  options: FolderNodeOptions,
): FolderNode<T>[] {
  const { draftParentKey, terms = [] } = options;
  const nodes: FolderNode<T>[] = folders.flatMap((folder) => {
    const children = toNodes(childrenOf(folder), folder.id, options);
    const isMatch = terms.length === 0 || textMatchesTerms(folder.name, terms);
    if (!isMatch && children.length === 0) return [];
    const isLazy = Boolean(folder.hasChildren) && childrenOf(folder).length === 0;
    const kept = children.length > 0 ? children : undefined;
    return [
      { id: folder.id, name: folder.name, kind: 'folder' as const, folder, children: kept, isLazy },
    ];
  });
  if (draftParentKey === parentKey) {
    nodes.push({ id: folderDraftKey, name: '', kind: 'draft', folder: null, isLazy: false });
  }
  return nodes;
}

/** The tree rows for the folders, with the root row and the draft row when asked for. */
export function buildFolderNodes<T extends FolderItem>(
  folders: readonly T[],
  options: FolderNodeOptions,
): FolderNode<T>[] {
  const nodes = toNodes(folders, null, options);
  if (options.rootLabel === undefined) return nodes;
  return [
    {
      id: folderRootKey,
      name: options.rootLabel,
      kind: 'root',
      folder: null,
      children: nodes,
      isLazy: false,
    },
  ];
}

/** The folder `key` and its ancestors, outermost first, or an empty list when it is missing. */
export function findFolderPath<T extends FolderItem>(folders: readonly T[], key: Key | null): T[] {
  if (key === null) return [];
  for (const folder of folders) {
    if (folder.id === key) return [folder];
    const path = findFolderPath(childrenOf(folder), key);
    if (path.length > 0) return [folder, ...path];
  }
  return [];
}

/** How many levels a folder and its deepest subfolder span: 1 for a folder without subfolders. */
export function getFolderHeight(folder: FolderItem): number {
  const children = folder.children ?? [];
  return 1 + findMaximum(children, getFolderHeight, 0);
}

/** The keys of every row that has children. */
export function collectBranchKeys<T extends FolderItem>(nodes: readonly FolderNode<T>[]): Key[] {
  return nodes.flatMap((node) =>
    node.children ? [node.id, ...collectBranchKeys(node.children)] : [],
  );
}

/** The row node `key`, at any depth. */
export function findFolderNode<T extends FolderItem>(
  nodes: readonly FolderNode<T>[],
  key: Key,
): FolderNode<T> | undefined {
  for (const node of nodes) {
    if (node.id === key) return node;
    const found = node.children ? findFolderNode(node.children, key) : undefined;
    if (found) return found;
  }
  return undefined;
}

/**
 * The folders of `keys` in tree order, leaving out those inside another of them: acting on a
 * folder acts on what it holds.
 */
export function listTopmostFolders<T extends FolderItem>(
  folders: readonly T[],
  keys: ReadonlySet<Key>,
): T[] {
  return folders.flatMap((folder) =>
    keys.has(folder.id) ? [folder] : listTopmostFolders(childrenOf(folder), keys),
  );
}

/**
 * Where `moving` folders may go: the top level, then every folder in tree order except the moving
 * ones and the folders inside them, each with the names of its path.
 */
export function listFolderDestinations<T extends FolderItem>(
  folders: readonly T[],
  moving: ReadonlySet<Key>,
): FolderDestination<T>[] {
  const visit = (level: readonly T[], path: string[]): FolderDestination<T>[] =>
    level.flatMap((folder) => {
      if (moving.has(folder.id)) return [];
      const own = [...path, folder.name];
      return [{ folder, path: own }, ...visit(childrenOf(folder), own)];
    });
  return [{ folder: null, path: [] }, ...visit(folders, [])];
}
