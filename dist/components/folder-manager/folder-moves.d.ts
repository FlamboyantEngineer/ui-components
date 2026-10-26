import type { TreeMove } from '../../utils/tree-reorder.js';
import type { FolderItem } from './folder-model.js';
/**
 * The moves that put `moving` (topmost folders, in tree order) into `destination`, as its last
 * children in their order, or at the end of the top level (`null`). Folders already there stay.
 */
export declare function planFolderMoves<T extends FolderItem>(folders: readonly T[], moving: readonly T[], destination: T | null): TreeMove[];
//# sourceMappingURL=folder-moves.d.ts.map