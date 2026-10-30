'use client';

import {
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  type JSX,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from 'react';
import {
  TabList as AriaTabList,
  TabListStateContext,
  TabsContext,
  useLocale,
  useSlottedContext,
  type TabListState,
} from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Key, Orientation } from '../../core/props.js';
import { mergeProps, mergeRefs } from '../../utils/merge-props.js';
import type { ElementRender } from '../../utils/render-element.js';
import { useForwardedRef } from '../../utils/use-forwarded-ref.js';
import { useScrollStripOverflow } from '../../utils/use-scroll-strip-overflow.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { keyCollectionChildren } from '../../utils/key-collection-children.js';
import { VisibleCollection } from '../overflow-list/overflow-list.js';
import { TabActionsContext, TabsSharedContext, type TabActions } from './tab-actions.js';
import { TabBar, useTabOverflow } from './tab-bar.js';
import { tabsHooks as hooks } from './tab-hooks.js';
import { useCenterSelectedTab, useListOverflow } from './tab-list-overflow.js';
import { TabMenuOverlay, useTabMenu, type TabMenuItems } from './tab-menu.js';
import {
  createTabRename,
  TabRenameOverlay,
  type TabNameValidate,
  type TabRename,
} from './tab-rename.js';
import { createTabReorder, useTabReorderKeys, type TabMove } from './tab-reorder.js';

export type { TabMenuItems } from './tab-menu.js';
export type { TabNameValidate } from './tab-rename.js';
export type { TabMove } from './tab-reorder.js';

/** `scroll` lets an overflowing list scroll; `menu` collapses the tabs that do not fit into a menu. */
export type TabListOverflow = 'scroll' | 'menu';

/** The state a `TabList` passes to `render` with its element's props. */
export interface TabListRenderState {
  orientation: Orientation;
}

export interface TabListProps extends BaseProps, AriaLabellingProps {
  /** The list element. */
  ref?: Ref<HTMLDivElement> | undefined;
  /** The `Tab`s. */
  children?: ReactNode;
  /** Replaces the list's `<div>` with the caller's own, given its props and state. */
  render?: ElementRender<'div', TabListRenderState> | undefined;
  /**
   * What a horizontal list does with tabs that do not fit: `scroll` (the default) or `menu`, which
   * keeps the selected tab and as many others as fit and lists the rest in a "more" menu.
   */
  overflow?: TabListOverflow | undefined;
  /** Draws previous and next buttons beside a horizontal list that scrolls, at an edge hiding tabs. */
  scrollButtons?: boolean | undefined;
  /** Makes the tabs removable: a close mark on each and Delete or Backspace on the focused one. */
  onRemove?: ((keys: Set<Key>) => void) | undefined;
  /** Draws an add button after the tabs. */
  onAdd?: (() => void) | undefined;
  /** Renames a tab from the name field that a double click, F2 or its menu opens in it. */
  onRename?: ((key: Key, name: string) => void) | undefined;
  /** Checks a new tab name as it is typed; a returned message refuses it. */
  validateName?: TabNameValidate | undefined;
  /** Makes the tabs reorderable by dragging and with Alt+Arrow keys; reports each move to apply. */
  onReorder?: ((move: TabMove) => void) | undefined;
  /** Offers Duplicate in each tab's menu. */
  onDuplicate?: ((key: Key) => void) | undefined;
  /**
   * Gives each tab a menu of its actions, opened like a context menu: the entries of the tab `key`,
   * given the standard entries for the actions the list takes (rename, duplicate, moves, delete).
   */
  getMenuItems?: TabMenuItems | undefined;
}

interface ListKeyOptions {
  state: TabListState<object> | null;
  onRemove: TabListProps['onRemove'];
  rename: TabRename | null;
  onReorderKey: ((event: KeyboardEvent<HTMLElement>) => void) | undefined;
}

type ListKeyHandlers = Pick<JSX.IntrinsicElements['div'], 'onKeyDown' | 'onKeyDownCapture'>;

/** Menus and scroll buttons serve horizontal lists; a vertical list scrolls. */
function resolveParts({
  orientation,
  overflow,
  scrollButtons,
}: {
  orientation: Orientation;
  overflow: TabListOverflow;
  scrollButtons: boolean;
}) {
  const horizontal = orientation === 'horizontal';
  return {
    isMenu: horizontal && overflow === 'menu',
    hasButtons: horizontal && overflow === 'scroll' && scrollButtons,
  };
}

/** Adds the list's keys to its element, which React Aria keeps its own keyboard handling on. */
function renderListKeys(
  render: TabListProps['render'],
  handlers: ListKeyHandlers,
): TabListProps['render'] {
  return (props, state) => {
    const merged = mergeProps(props, handlers);
    return render ? render(merged, state) : <div {...merged} />;
  };
}

/** Whether a key went to a tab, rather than to a field inside one. */
function isTabKey(event: KeyboardEvent<HTMLElement>) {
  return (event.target as Element).getAttribute('role') === 'tab';
}

/**
 * The list's keys on its focused tab: Delete and Backspace remove it, F2 renames it and Alt+Arrow
 * moves it, each while the owner takes that action.
 */
function useListKeys({ state, onRemove, rename, onReorderKey }: ListKeyOptions) {
  const { isDisabled } = useContext(TabsSharedContext);
  const focusedKey = () => {
    const key = state?.selectionManager.focusedKey ?? null;
    return key === null || isDisabled || state?.selectionManager.isDisabled(key) ? null : key;
  };
  const handlers: ListKeyHandlers = {};
  if (onRemove) {
    handlers.onKeyDown = (event) => {
      const key = focusedKey();
      if ((event.key !== 'Delete' && event.key !== 'Backspace') || key === null) return;
      event.preventDefault();
      onRemove(new Set([key]));
    };
  }
  if (rename || onReorderKey) {
    handlers.onKeyDownCapture = (event) => {
      onReorderKey?.(event);
      const key = focusedKey();
      if (!rename || event.key !== 'F2' || !isTabKey(event) || key === null) return;
      event.preventDefault();
      rename.start(key);
    };
  }
  return Object.keys(handlers).length > 0 ? handlers : null;
}

/** The chords every tab of the list announces, for the actions the owner takes. */
function listKeyShortcuts(options: {
  orientation: Orientation;
  actions: Omit<TabActions, 'keyShortcuts'>;
}): string | undefined {
  const { orientation, actions } = options;
  const moves = orientation === 'horizontal' ? 'ArrowLeft Alt+ArrowRight' : 'ArrowUp Alt+ArrowDown';
  const chords = [
    actions.onRemove ? 'Delete' : null,
    actions.rename ? 'F2' : null,
    actions.reorder ? `Alt+${moves}` : null,
    actions.menu.isEnabled ? 'Shift+F10' : null,
  ].filter(Boolean);
  return chords.length > 0 ? chords.join(' ') : undefined;
}

/** What the list lets its tabs do: remove, rename, reorder and open a menu. */
function useTabActions(
  props: Pick<
    TabListProps,
    'onRemove' | 'onRename' | 'validateName' | 'onReorder' | 'onDuplicate' | 'getMenuItems'
  >,
): TabActions {
  const shared = useContext(TabsSharedContext);
  const isRtl = useLocale().direction === 'rtl';
  const { onRemove, onRename, validateName, onReorder, onDuplicate, getMenuItems } = props;
  const remove =
    onRemove && ((keys: Set<Key>) => onRemove(new Set([...keys].map(fromCollectionKey))));
  const rename = createTabRename({
    shared,
    onRename: onRename && ((key, name) => onRename(fromCollectionKey(key), name)),
    validateName: validateName && ((key, name) => validateName(fromCollectionKey(key), name)),
  });
  const reorder = createTabReorder({
    shared,
    isRtl,
    onReorder:
      onReorder &&
      ((move) =>
        onReorder({
          ...move,
          key: fromCollectionKey(move.key),
          targetKey: fromCollectionKey(move.targetKey),
        })),
  });
  const menu = useTabMenu({
    shared,
    rename,
    reorder,
    onRemove: remove,
    onDuplicate: onDuplicate && ((key) => onDuplicate(fromCollectionKey(key))),
    getMenuItems:
      getMenuItems && ((key, standard) => getMenuItems(fromCollectionKey(key), standard)),
  });
  const actions = { onRemove: remove, rename, reorder, menu };
  return {
    ...actions,
    keyShortcuts: listKeyShortcuts({ orientation: shared.orientation, actions }),
  };
}

/**
 * The row (or column) of tabs. An overflowing list scrolls the selected tab toward its middle, or
 * collapses the tabs that do not fit into a "more" menu; it can draw scroll buttons, removable tabs
 * and an add button, rename and reorder its tabs, and give each tab a menu of its actions.
 */
export function TabList({
  overflow = 'scroll',
  scrollButtons = false,
  onRemove,
  onAdd,
  onRename,
  validateName,
  onReorder,
  onDuplicate,
  getMenuItems,
  className,
  ref,
  ...rest
}: TabListProps) {
  const state = useContext(TabListStateContext);
  const orientation = useSlottedContext(TabsContext)?.orientation ?? 'horizontal';
  const { isMenu, hasButtons } = resolveParts({ orientation, overflow, scrollButtons });
  const [listRef, setListRef] = useForwardedRef(ref);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const menu = useTabOverflow(state, isMenu);
  const strip = useScrollStripOverflow(stripRef);
  const scrollOverflowing = useListOverflow(listRef, orientation);
  useCenterSelectedTab(listRef, { orientation, selectedKey: state?.selectedKey ?? null });
  const actions = useTabActions({
    ...{ onRemove, onRename, validateName },
    ...{ onReorder, onDuplicate, getMenuItems },
  });
  const { stateRef } = useContext(TabsSharedContext);
  useLayoutEffect(() => {
    if (state) stateRef.current = state;
  });
  const onReorderKey = useTabReorderKeys({ state, listRef, reorder: actions.reorder });
  const keys = useListKeys({
    state,
    onRemove: actions.onRemove,
    rename: actions.rename,
    onReorderKey,
  });
  const elementRef = useMemo(
    () => mergeRefs(setListRef, menu.itemContainerRef, hasButtons ? stripRef : undefined),
    [setListRef, menu.itemContainerRef, hasButtons],
  );
  // React Aria builds the collection from a hidden render of the list, which draws no parts.
  if (!state) {
    return (
      <TabActionsContext.Provider value={actions}>
        <AriaTabList {...rest}>{keyCollectionChildren(rest.children)}</AriaTabList>
      </TabActionsContext.Provider>
    );
  }

  const overflowing = isMenu ? menu.hiddenItems.length > 0 : scrollOverflowing;
  const list = (
    <TabActionsContext.Provider value={actions}>
      <VisibleCollection keys={menu.visibleKeys}>
        <AriaTabList
          {...mergeProps(rest, { onScroll: hasButtons ? strip.syncOverflow : undefined })}
          render={keys ? renderListKeys(rest.render, keys) : rest.render}
          ref={elementRef}
          {...hooks.slot('list', { overflowing }, className)}
        />
      </VisibleCollection>
      <TabRenameOverlay rename={actions.rename} state={state} listRef={listRef} />
      <TabMenuOverlay menu={actions.menu} />
    </TabActionsContext.Provider>
  );
  if (!isMenu && !hasButtons && !onAdd) return list;
  return (
    <TabBar
      {...{ state, orientation, isMenu, hasButtons, menu, onAdd }}
      strip={{ ...strip, stripRef }}
    >
      {list}
    </TabBar>
  );
}
