import type { BaseProps } from '../../core/props.js';
import { type FolderItem } from './folder-model.js';
import type { FolderSelectionMode } from './use-folder-tree.js';
import { type FolderManagerOptions } from './use-folder-manager.js';
export interface FolderManagerProps<T extends FolderItem, M extends FolderSelectionMode = FolderSelectionMode> extends BaseProps, FolderManagerOptions<T, M> {
    /** Names the folder tree. */
    'aria-label'?: string | undefined;
    'aria-labelledby'?: string | undefined;
    /** Draws a search box that keeps the folders whose name holds every term, with their ancestors. */
    filterable?: boolean | undefined;
    /** Renders only the rows in view; the stylesheet must bound the tree's height. */
    virtualized?: boolean | undefined;
    /** Row height in pixels for a virtualized tree. */
    rowHeight?: number | undefined;
}
/**
 * Manages a folder tree on the library `Tree`: select one folder or several, create one under the
 * selected folder, rename it in place, delete the selected folders, and move them by drag and drop,
 * Alt+Arrow keys or the context menu's Move to. Subfolders can load on demand and a search box can
 * filter the folders. The folders are data and every change goes to a callback, which may return a
 * promise; a rejected promise keeps an edit open with its reason. Actions appear only when their
 * callback is set.
 */
export declare function FolderManager<T extends FolderItem, M extends FolderSelectionMode = FolderSelectionMode>(props: FolderManagerProps<T, M>): import("react").JSX.Element;
export type { FolderItem } from './folder-model.js';
//# sourceMappingURL=folder-manager.d.ts.map