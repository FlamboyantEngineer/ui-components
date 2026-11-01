// The folder tree a folder manager shows: the caller's folders, an optional root row standing for
// "no folder", the draft row of a folder being created, and the folders a filter keeps.

import { requireDefined } from '../../utils/require-defined.js';
import { walkTree } from '../../utils/walk-tree.js';
import { mapTree } from '../../utils/map-tree.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
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

/**
 * A row of the folder tree. Its `id` is a row key, never a caller's folder key: a folder's row key
 * is its key's identity (`toFolderRowKey`), so the root and draft rows cannot share it.
 */
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

interface FolderNodeOptions {
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

/** The row key of the root row; no folder's row key can equal it. */
export const folderRootKey = 'root';

/** The row key of the draft row; no folder's row key can equal it. */
export const folderDraftKey = 'draft';

/** The row key of a folder: its key's identity, which always opens with a bracket. */
export function toFolderRowKey(key: Key): string {
  return toKeyIdentity(key);
}

/** The folder key a row key stands for, or `null` for the root and draft rows. */
export function fromFolderRowKey(rowKey: Key): Key | null {
  if (typeof rowKey !== 'string' || !rowKey.startsWith('[')) return null;
  const [type, text] = JSON.parse(rowKey) as [string, string];
  return type === 'number' ? Number(text) : text;
}

function childrenOf<T extends FolderItem>(folder: T): readonly T[] {
  return (folder.children ?? []) as readonly T[];
}

function appendDraft<T extends FolderItem>(
  nodes: FolderNode<T>[],
  parentKey: Key | null,
  options: FolderNodeOptions,
): void {
  if (options.draftParentKey === parentKey) {
    nodes.push({ id: folderDraftKey, name: '', kind: 'draft', folder: null, isLazy: false });
  }
}

/**
 * The tree rows for the folders, with the root row and the draft row when asked for. A filter that
 * matches nothing leaves no row, the root row included, so the tree can say so.
 */
export function buildFolderNodes<T extends FolderItem>(
  folders: readonly T[],
  options: FolderNodeOptions,
): FolderNode<T>[] {
  const { terms = [] } = options;
  const nodes = mapTree<T, FolderNode<T>>(folders, childrenOf, (folder, children) => {
    appendDraft(children, folder.id, options);
    const isMatch = terms.length === 0 || textMatchesTerms(folder.name, terms);
    if (!isMatch && children.length === 0) return null;
    return {
      id: toFolderRowKey(folder.id),
      name: folder.name,
      kind: 'folder',
      folder,
      children: children.length > 0 ? children : undefined,
      isLazy: Boolean(folder.hasChildren) && childrenOf(folder).length === 0,
    };
  });
  appendDraft(nodes, null, options);
  if (options.rootLabel === undefined || (terms.length > 0 && nodes.length === 0)) return nodes;
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
  const levels = [folders[Symbol.iterator]()];
  const path: T[] = [];
  while (levels.length > 0) {
    const next = requireDefined(levels.at(-1)).next();
    if (next.done) {
      levels.pop();
      continue;
    }
    path.length = levels.length - 1;
    path.push(next.value);
    if (next.value.id === key) return path;
    const children = childrenOf(next.value);
    if (children.length > 0) levels.push(children[Symbol.iterator]());
  }
  return [];
}

/** How many levels a folder and its deepest subfolder span: 1 for a folder without subfolders. */
export function getFolderHeight(folder: FolderItem): number {
  let height = 0;
  const levels = [[folder][Symbol.iterator]()];
  while (levels.length > 0) {
    const next = requireDefined(levels.at(-1)).next();
    if (next.done) {
      levels.pop();
      continue;
    }
    height = Math.max(height, levels.length);
    if (next.value.children?.length) levels.push(next.value.children[Symbol.iterator]());
  }
  return height;
}

/** The keys of every row that has children. */
export function collectBranchKeys<T extends FolderItem>(nodes: readonly FolderNode<T>[]): Key[] {
  const keys: Key[] = [];
  for (const node of walkTree(nodes, (node) => node.children)) {
    if (node.children) keys.push(node.id);
  }
  return keys;
}

/**
 * The folders of `keys` in tree order, leaving out those inside another of them: acting on a
 * folder acts on what it holds.
 */
export function listTopmostFolders<T extends FolderItem>(
  folders: readonly T[],
  keys: ReadonlySet<Key>,
): T[] {
  const selected: T[] = [];
  for (const folder of walkTree(folders, (folder) =>
    keys.has(folder.id) ? undefined : childrenOf(folder),
  )) {
    if (keys.has(folder.id)) selected.push(folder);
  }
  return selected;
}

/**
 * Where `moving` folders may go: the top level, then every folder in tree order except the moving
 * ones and the folders inside them, each with the names of its path.
 */
export function listFolderDestinations<T extends FolderItem>(
  folders: readonly T[],
  moving: ReadonlySet<Key>,
): FolderDestination<T>[] {
  const destinations: FolderDestination<T>[] = [{ folder: null, path: [] }];
  const levels = [folders[Symbol.iterator]()];
  const path: string[] = [];
  while (levels.length > 0) {
    const next = requireDefined(levels.at(-1)).next();
    if (next.done) {
      levels.pop();
      continue;
    }
    const folder = next.value;
    if (moving.has(folder.id)) continue;
    path.length = levels.length - 1;
    path.push(folder.name);
    destinations.push({ folder, path: [...path] });
    const children = childrenOf(folder);
    if (children.length > 0) levels.push(children[Symbol.iterator]());
  }
  return destinations;
}
