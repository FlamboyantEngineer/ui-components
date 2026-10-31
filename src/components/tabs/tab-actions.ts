'use client';

// What a list lets its tabs do, and the state its two renders share. React Aria builds the tabs'
// collection from a hidden render of the list, where the `Tab` components run, while the drawn list
// holds the collection state; state both renders need lives in `Tabs`, above them.

import { createContext, useMemo, useRef, useState, type Dispatch, type RefObject } from 'react';
import type { Key, Orientation } from '../../core/props.js';
import {
  createMenuController,
  useMenuController,
  type MenuController,
} from '../context-menu/context-menu.js';
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
  collection: Iterable<TabNode> & { getItem: (key: Key) => TabNode | null };
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
  /** The tab whose menu was opened last, which the open menu acts on. */
  menuKey: RefObject<Key | null>;
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

const idleController = createMenuController();

/** The shared state of the enclosing `Tabs`. */
export const TabsSharedContext = createContext<TabsShared>({
  orientation: 'horizontal',
  isDisabled: false,
  disabledKeys: new Set(),
  controller: idleController,
  editingKey: null,
  setEditingKey: () => {},
  draggingKey: { current: null },
  menuKey: { current: null },
  stateRef: { current: null },
});

/** The actions of the enclosing `TabList`. */
export const TabActionsContext = createContext<TabActions>({
  onRemove: undefined,
  keyShortcuts: undefined,
  rename: null,
  reorder: null,
  menu: {
    controller: idleController,
    isEnabled: false,
    getEntries: () => [],
    showFor: () => {},
    openKey: () => null,
    isAvailable: () => false,
  },
});

/** The keys of the drawn list's tabs, in order. */
export function listTabKeys(shared: TabsShared): Key[] {
  const state = shared.stateRef.current;
  // The collection's own key list keeps the order the tabs were added in; walking it follows moves.
  return state ? [...state.collection].map((node) => node.key) : [];
}

/** The element of the tab `key` in a list. */
export function findTabElement(list: HTMLElement | null, key: Key): HTMLElement | undefined {
  const tabs = list ? [...list.querySelectorAll<HTMLElement>('[role="tab"]')] : [];
  return tabs.find((tab) => tab.getAttribute('data-key') === String(key));
}

/** Whether the tab `key` refuses focus, through the list's `disabledKeys` or with every tab. */
export function isTabDisabled(shared: TabsShared, key: Key): boolean {
  return shared.isDisabled || shared.disabledKeys.has(key);
}

/**
 * Whether the tab `key` is in the drawn list and enabled, through the `Tabs`, the list's
 * `disabledKeys` or its own `isDisabled`, so the reader can act on it now.
 */
export function isTabAvailable(
  shared: TabsShared,
  key: Key,
  state: TabListModel | null = shared.stateRef.current,
): boolean {
  if (isTabDisabled(shared, key)) return false;
  return (
    !state || (state.collection.getItem(key) !== null && !state.selectionManager.isDisabled(key))
  );
}

/** Creates the state a `Tabs` shares with both renders of its list. */
export function useTabsShared({ orientation, isDisabled, disabledKeys }: TabsSharedOptions) {
  const controller = useMenuController();
  const [editingKey, setEditingKey] = useState<Key | null>(null);
  const draggingKey = useRef<Key | null>(null);
  const menuKey = useRef<Key | null>(null);
  const stateRef = useRef<TabListModel | null>(null);
  const disabled = useMemo(() => new Set(disabledKeys ?? []), [disabledKeys]);
  return useMemo<TabsShared>(
    () => ({
      orientation,
      isDisabled,
      disabledKeys: disabled,
      controller,
      editingKey,
      setEditingKey,
      draggingKey,
      menuKey,
      stateRef,
    }),
    [orientation, isDisabled, disabled, controller, editingKey],
  );
}
