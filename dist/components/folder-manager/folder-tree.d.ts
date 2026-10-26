import type { Key } from '../../core/props.js';
import type { TreeMove } from '../../utils/tree-reorder.js';
import { type MenuEntry } from '../menu/menu.js';
import { type FolderItem } from './folder-model.js';
import type { FolderManagerModel } from './use-folder-manager.js';
export interface FolderTreeProps<T extends FolderItem> {
    model: FolderManagerModel<T>;
    folders: readonly T[];
    'aria-label': string | undefined;
    'aria-labelledby': string | undefined;
    rootLabel: string | undefined;
    maxDepth: number | undefined;
    isPending: boolean;
    onMove: ((move: TreeMove) => void) | undefined;
    selectionMode: 'single' | 'multiple';
    virtualized: boolean | undefined;
    rowHeight: number | undefined;
    /** The context menu's entries; none leaves the browser's menu alone. */
    menuEntries: MenuEntry[];
    /** Runs a context menu entry. */
    onMenuAction: (key: Key) => void;
}
/** The folder tree, its rows' name field, the filter highlight and the context menu. */
export declare function FolderTree<T extends FolderItem>({ model, menuEntries, onMenuAction, ...tree }: FolderTreeProps<T>): import("react").JSX.Element;
//# sourceMappingURL=folder-tree.d.ts.map