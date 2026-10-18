// The moves that put several folders into one destination, in their tree order.

import type { Key } from '../../core/props.js';
import type { TreeMove } from '../../utils/tree-reorder.js';
import { findFolderPath, type FolderItem } from './folder-model.js';

/**
 * The moves that put `moving` (topmost folders, in tree order) into `destination`, as its last
 * children in their order, or at the end of the top level (`null`). Folders already there stay.
 */
export function planFolderMoves<T extends FolderItem>(
  folders: readonly T[],
  moving: readonly T[],
  destination: T | null,
): TreeMove[] {
  const parentOf = (folder: T): Key | null => findFolderPath(folders, folder.id).at(-2)?.id ?? null;
  const staying = moving.filter((folder) => parentOf(folder) !== (destination?.id ?? null));
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
