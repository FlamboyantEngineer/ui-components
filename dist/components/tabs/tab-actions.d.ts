import { type Dispatch, type RefObject } from 'react';
import type { Key, Orientation } from '../../core/props.js';
import { type MenuController } from '../context-menu/context-menu.js';
import type { TabMenu } from './tab-menu.js';
import type { TabRename } from './tab-rename.js';
import type { TabReorder } from './tab-reorder.js';
/** One tab in the list's collection. */
interface TabNode {
    key: Key;
    textValue: string;
    props?: unknown;
}
/** The collection and selection state of a drawn list, as the list's parts read it. */
export interface TabListModel {
    collection: Iterable<TabNode> & {
        getItem: (key: Key) => TabNode | null;
    };
    selectedKey: Key | null;
    disabledKeys: ReadonlySet<Key>;
    setSelectedKey: (key: Key | null) => void;
    selectionManager: {
        focusedKey: Key | null;
        isFocused: boolean;
        isDisabled: (key: Key) => boolean;
        setFocusedKey: (key: Key | null) => void;
    };
}
/** State shared by the hidden and the drawn render of a `Tabs`' list. */
export interface TabsShared {
    orientation: Orientation;
    /** Disables every tab. */
    isDisabled: boolean;
    disabledKeys: ReadonlySet<Key>;
    /** The menu the list's tabs open. */
    controller: MenuController;
    /** The tab being renamed. */
    editingKey: Key | null;
    setEditingKey: Dispatch<(current: Key | null) => Key | null>;
    /** The tab being dragged, while a drag that started in the list is under way. */
    draggingKey: RefObject<Key | null>;
    /** The collection state of the drawn list, for actions that run on an event. */
    stateRef: RefObject<TabListModel | null>;
}
/** What a list lets its tabs do, for the tabs inside it. */
export interface TabActions {
    onRemove: ((keys: Set<Key>) => void) | undefined;
    /** The keyboard chords every tab of the list announces in `aria-keyshortcuts`. */
    keyShortcuts: string | undefined;
    rename: TabRename | null;
    reorder: TabReorder | null;
    menu: TabMenu;
}
interface TabsSharedOptions {
    orientation: Orientation;
    isDisabled: boolean;
    disabledKeys: Iterable<Key> | undefined;
}
/** The shared state of the enclosing `Tabs`. */
export declare const TabsSharedContext: import("react").Context<TabsShared>;
/** The actions of the enclosing `TabList`. */
export declare const TabActionsContext: import("react").Context<TabActions>;
/** The keys of the drawn list's tabs, in order. */
export declare function listTabKeys(shared: TabsShared): Key[];
/** The element of the tab `key` in a list. */
export declare function findTabElement(list: HTMLElement | null, key: Key): HTMLElement | undefined;
/** Whether the tab `key` refuses focus, through the list's `disabledKeys` or with every tab. */
export declare function isTabDisabled(shared: TabsShared, key: Key): boolean;
/** Creates the state a `Tabs` shares with both renders of its list. */
export declare function useTabsShared({ orientation, isDisabled, disabledKeys }: TabsSharedOptions): TabsShared;
export {};
//# sourceMappingURL=tab-actions.d.ts.map