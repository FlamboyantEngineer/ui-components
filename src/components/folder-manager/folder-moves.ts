// The moves that put several folders into one destination, in their tree order.

import type { Key } from '../../core/props.js';
import type { TreeMove } from '../../utils/tree-reorder.js';
import type { FolderItem } from './folder-model.js';

interface FolderLevel {
  folders: readonly FolderItem[];
  parentKey: Key | null;
  index: number;
}

function findMovingKeys(
  folders: readonly FolderItem[],
  moving: ReadonlySet<Key>,
  destinationKey: Key | null,
): ReadonlySet<Key> {
  const staying = new Set(destinationKey === null ? [] : moving);
  let remaining = moving.size;
  const levels: FolderLevel[] = [{ folders, parentKey: null, index: 0 }];
  for (let level = levels.at(-1); level; level = levels.at(-1)) {
    const folder = level.folders[level.index++];
    if (!folder) {
      levels.pop();
      continue;
    }
    const key = folder.id;
    if (moving.has(key)) {
      if (level.parentKey === destinationKey) staying.delete(key);
      else staying.add(key);
      if (--remaining === 0) break;
    }
    if (folder.children) levels.push({ folders: folder.children, parentKey: key, index: 0 });
  }
  return staying;
}

/**
 * The moves that put `moving` (topmost folders, in tree order) into `destination`, as its last
 * children in their order, or at the end of the top level (`null`). Folders already there stay.
 */
export function planFolderMoves<T extends FolderItem>(
  folders: readonly T[],
  moving: readonly T[],
  destination: T | null,
): TreeMove[] {
  if (moving.length === 0) return [];
  const keys = findMovingKeys(
    folders,
    new Set(moving.map((folder) => folder.id)),
    destination?.id ?? null,
  );
  const staying = moving.filter((folder) => keys.has(folder.id));
  if (destination) {
    return staying.map((folder) => ({
      key: folder.id,
      targetKey: destination.id,
      position: 'inside',
    }));
  }
  let anchor = folders.at(-1)?.id;
  return staying.flatMap((folder) => {
    if (anchor === undefined) return [];
    const move: TreeMove = { key: folder.id, targetKey: anchor, position: 'after' };
    anchor = folder.id;
    return [move];
  });
}
