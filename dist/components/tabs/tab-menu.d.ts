import { type MouseEvent } from 'react';
import type { Key } from '../../core/props.js';
import { type MenuController } from '../context-menu/context-menu.js';
import type { MenuEntry } from '../menu/menu.js';
import type { TabsShared } from './tab-actions.js';
import type { TabRename } from './tab-rename.js';
import { type TabReorder } from './tab-reorder.js';
/** Lists the entries of a tab's menu, given the tab's `id` and the standard entries. */
export type TabMenuItems = (key: Key, standard: readonly MenuEntry[]) => readonly MenuEntry[];
/** A list's tab menu, shared with its tabs. */
export interface TabMenu {
    controller: MenuController;
    /** Whether a tab has a menu: the owner lists its entries. */
    isEnabled: boolean;
    /** The entries of the tab `key`'s menu. */
    getEntries: (key: Key) => readonly MenuEntry[];
}
interface TabMenuOptions {
    shared: TabsShared;
    rename: TabRename | null;
    reorder: TabReorder | null;
    onDuplicate: ((key: Key) => void) | undefined;
    onRemove: ((keys: Set<Key>) => void) | undefined;
    getMenuItems: TabMenuItems | undefined;
}
interface TabMenuTargetOptions {
    tabKey: Key | undefined;
    isDisabled: boolean;
    /** The caller's own handler, which runs first. */
    onContextMenu: ((event: MouseEvent<HTMLDivElement>) => void) | undefined;
}
/** A list's tab menu while the owner lists its entries (`getMenuItems`). */
export declare function useTabMenu(options: TabMenuOptions): TabMenu;
/** The menu a list's tabs open; it shows the entries of the tab that opened it. */
export declare function TabMenuOverlay({ menu }: {
    menu: TabMenu;
}): import("react").JSX.Element | null;
/**
 * Makes a tab open its list's menu: a secondary click focuses the tab and opens it at the pointer,
 * the Context Menu key or Shift+F10 below the tab, a long touch at the touch point. Returns `null`
 * without a menu.
 */
export declare function useTabMenuTarget(menu: TabMenu, options: TabMenuTargetOptions): import("../context-menu/context-menu-target.js").ContextMenuTargetProps | null;
export {};
//# sourceMappingURL=tab-menu.d.ts.map