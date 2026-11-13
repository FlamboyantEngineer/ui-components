'use client';

import { type JSX, type KeyboardEvent, type ReactNode, useContext, useMemo } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Key, Orientation, RefProps } from '../../core/props.js';
import {
  TabList as AriaTabList,
  type TabListState,
  TabListStateContext,
  TabsContext,
  useLocale,
  useSlottedContext,
} from '../../primitives/index.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { isFreeEditKey } from '../../utils/is-free-edit-key.js';
import { mergeProps } from '../../utils/merge-props.js';
import type { ElementRender } from '../../utils/render-element.js';
import { useForwardedRef } from '../../utils/use-forwarded-ref.js';
import { useLatest } from '../../utils/use-latest.js';
import { type TabActions, TabActionsContext, TabsSharedContext } from './tab-actions.js';
import { TabBar } from './tab-bar.js';
import { tabsHooks as hooks } from './tab-hooks.js';
import { useTabListLayout } from './tab-list-layout.js';
import {
  TabListCollection,
  TabListParts,
  TabListStateSync,
  useTabListParts,
  withTabActionEvents,
} from './tab-list-parts.js';
import { type TabMenuIcons, type TabMenuItems, TabMenuOverlay, useTabMenu } from './tab-menu.js';
import {
  createTabRename,
  type TabNameValidate,
  type TabRename,
  TabRenameOverlay,
} from './tab-rename.js';
import { createTabReorder, type TabMove, useTabReorderKeys } from './tab-reorder.js';

export type { TabMenuAction, TabMenuIcons, TabMenuItems } from './tab-menu.js';
export type { TabNameValidate } from './tab-rename.js';
export type { TabMove } from './tab-reorder.js';

/** `scroll` lets an overflowing list scroll; `menu` collapses the tabs that do not fit into a menu. */
export type TabListOverflow = 'scroll' | 'menu';

/** The state a `TabList` passes to `render` with its element's props. */
export interface TabListRenderState {
  orientation: Orientation;
}

export interface TabListProps extends BaseProps, AriaLabellingProps, RefProps<HTMLDivElement> {
  /** The `Tab`s. */
  children?: ReactNode;
  /** Replaces the list's `<div>` with the caller's own, given its props and state. */
  render?: ElementRender<'div', TabListRenderState> | undefined;
  /**
   * What a horizontal list does with tabs that do not fit: `scroll` (the default) or `menu`, which
   * keeps the selected tab and as many others as fit and lists the rest in a "more" menu.
   */
  overflow?: TabListOverflow | undefined;
  /**
   * Draws previous and next buttons beside a horizontal list that scrolls, at an edge hiding tabs.
   * The list takes the mouse wheel with or without them.
   */
  scrollButtons?: boolean | undefined;
  /** Makes the tabs removable: a close mark on each and Delete or Backspace on the focused one. */
  onRemove?: ((keys: Set<Key>) => void) | undefined;
  /** Ordinary content after a tab, outside selection and panel keys. Null adds nothing. */
  renderAfterTab?: ((key: Key) => ReactNode) | undefined;
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
  /**
   * Icons for the standard menu actions, by action (`rename`, `duplicate`, `move-backward`,
   * `move-forward`, `delete`): an icon replaces the action's own, `null` removes it. Entries the
   * caller adds take theirs from the entry.
   */
  menuIcons?: TabMenuIcons | undefined;
}

interface ListKeyOptions {
  state: TabListState<object> | null;
  onRemove: TabListProps['onRemove'];
  rename: TabRename | null;
  onReorderKey: ((event: KeyboardEvent<HTMLElement>) => void) | undefined;
}

type ListKeyHandlers = Pick<JSX.IntrinsicElements['div'], 'onKeyDown' | 'onKeyDownCapture'>;

/**
 * Menus, the wheel and scroll buttons serve horizontal lists; a vertical list scrolls. A horizontal
 * `scroll` list is a scroll strip that takes the wheel, buttons or not.
 */
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
  const isStrip = horizontal && overflow === 'scroll';
  return {
    isMenu: horizontal && overflow === 'menu',
    isStrip,
    hasButtons: isStrip && scrollButtons,
  };
}

/** Adds the list's keys to its element, which React Aria keeps its own keyboard handling on. */
function renderListKeys(
  render: TabListProps['render'],
  handlers: ListKeyHandlers,
  hasActions = false,
): TabListProps['render'] {
  return (props, state) => {
    const merged = mergeProps(props, handlers);
    if (hasActions) {
      delete merged['aria-orientation'];
      merged.role = 'group';
    }
    const forwarded = hasActions ? withTabActionEvents(merged) : merged;
    return render ? render(forwarded, state) : <div {...forwarded} />;
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
      // A chord, such as Alt+Backspace or Shift+Delete, is the browser's or the system's.
      if (!isFreeEditKey(event.nativeEvent) || event.shiftKey) return;
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

/**
 * What the list lets its tabs do: remove, rename, reorder and open a menu. The actions call the
 * owner's latest callbacks and stay the same object while the list's abilities do, so the tabs that
 * read them do not render again each time the list does, such as on every scroll frame.
 */
function useTabActions(
  props: Pick<
    TabListProps,
    | 'onRemove'
    | 'onRename'
    | 'validateName'
    | 'onReorder'
    | 'onDuplicate'
    | 'getMenuItems'
    | 'menuIcons'
  >,
): TabActions {
  const shared = useContext(TabsSharedContext);
  const isRtl = useLocale().direction === 'rtl';
  const latest = useLatest(props);
  const canRemove = props.onRemove !== undefined;
  const canRename = props.onRename !== undefined;
  const canValidate = props.validateName !== undefined;
  const canReorder = props.onReorder !== undefined;
  const canDuplicate = props.onDuplicate !== undefined;
  const hasMenu = props.getMenuItems !== undefined;
  const { remove, rename, reorder } = useMemo(() => {
    return {
      remove: canRemove
        ? (keys: Set<Key>) => latest.current.onRemove?.(new Set([...keys].map(fromCollectionKey)))
        : undefined,
      rename: createTabRename({
        shared,
        onRename: canRename
          ? (key, name) => latest.current.onRename?.(fromCollectionKey(key), name)
          : undefined,
        validateName: canValidate
          ? (key, name) => latest.current.validateName?.(fromCollectionKey(key), name)
          : undefined,
      }),
      reorder: createTabReorder({
        shared,
        isRtl,
        onReorder: canReorder
          ? (move) =>
              latest.current.onReorder?.({
                ...move,
                key: fromCollectionKey(move.key),
                targetKey: fromCollectionKey(move.targetKey),
              })
          : undefined,
      }),
    };
  }, [latest, shared, isRtl, canRemove, canRename, canValidate, canReorder]);
  const onDuplicate = useMemo(
    () =>
      canDuplicate ? (key: Key) => latest.current.onDuplicate?.(fromCollectionKey(key)) : undefined,
    [latest, canDuplicate],
  );
  const getMenuItems = useMemo<TabMenuItems | undefined>(
    () =>
      hasMenu
        ? (key, standard) => latest.current.getMenuItems?.(fromCollectionKey(key), standard) ?? []
        : undefined,
    [latest, hasMenu],
  );
  const menu = useTabMenu({
    shared,
    rename,
    reorder,
    onRemove: remove,
    onDuplicate,
    getMenuItems,
    menuIcons: props.menuIcons,
  });
  return useMemo(() => {
    const actions = { onRemove: remove, rename, reorder, menu };
    return {
      ...actions,
      keyShortcuts: listKeyShortcuts({ orientation: shared.orientation, actions }),
    };
  }, [remove, rename, reorder, menu, shared.orientation]);
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
  renderAfterTab,
  onRename,
  validateName,
  onReorder,
  onDuplicate,
  getMenuItems,
  menuIcons,
  className,
  ref,
  ...rest
}: TabListProps) {
  const state = useContext(TabListStateContext);
  const orientation = useSlottedContext(TabsContext)?.orientation ?? 'horizontal';
  const { isMenu, isStrip, hasButtons } = resolveParts({ orientation, overflow, scrollButtons });
  const [listRef, setListRef] = useForwardedRef(ref);
  const { editingKey } = useContext(TabsSharedContext);
  const parts = useTabListParts(state, renderAfterTab);
  const { menuMode, menu, scroll, elementRef, overflowing } = useTabListLayout(listRef, {
    ...{ state, editingKey, parts, setListRef },
    ...{ orientation, isMenu, isStrip },
  });
  const actions = useTabActions({
    ...{ onRemove, onRename, validateName },
    ...{ onReorder, onDuplicate, getMenuItems, menuIcons },
  });
  const onReorderKey = useTabReorderKeys({ state, listRef, reorder: actions.reorder });
  const keys = useListKeys({
    state,
    onRemove: actions.onRemove,
    rename: actions.rename,
    onReorderKey,
  });
  // React Aria builds the collection from a hidden render of the list, which draws no parts.
  if (!state) return <TabListCollection {...rest} actions={actions} />;

  const list = (
    <TabListParts
      model={parts}
      visible={menu.visibleParts}
      tabKeys={menu.visibleKeys}
      listRef={listRef}
      label={rest}
    >
      <AriaTabList
        {...mergeProps(rest, { onScroll: hasButtons ? scroll.syncOverflow : undefined })}
        render={
          keys || parts ? renderListKeys(rest.render, keys ?? {}, Boolean(parts)) : rest.render
        }
        ref={elementRef}
        {...hooks.slot('list', { overflowing }, className)}
      />
    </TabListParts>
  );
  // The overlays keep their place whether or not a bar wraps the list, so a presentation change
  // that adds or drops the bar keeps a rename's draft, message and focus.
  return (
    <TabActionsContext value={actions}>
      {isMenu || hasButtons || onAdd ? (
        <TabBar
          {...{ state, orientation, hasButtons, menu, onAdd }}
          scroll={scroll}
          isMenu={menuMode}
          hasActions={Boolean(parts)}
        >
          {list}
        </TabBar>
      ) : (
        list
      )}
      <TabListStateSync state={state} />
      <TabRenameOverlay rename={actions.rename} state={state} listRef={listRef} />
      <TabMenuOverlay menu={actions.menu} state={state} />
    </TabActionsContext>
  );
}
