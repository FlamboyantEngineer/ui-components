'use client';

import {
  ArrowDownGlyph,
  ArrowLeftGlyph,
  ArrowRightGlyph,
  ArrowUpGlyph,
  CopyGlyph,
  DeleteGlyph,
  EditGlyph,
} from '../../core/glyphs.js';
import { joinMenuGroups } from '../menu/menu.js';
// The menu of a tab's actions, opened from the tab like a context menu.

import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from 'react';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import {
  ContextMenu,
  useContextMenuTarget,
  type MenuController,
} from '../context-menu/context-menu.js';
import type { MenuEntry, MenuItemEntry } from '../menu/menu.js';
import { isTabAvailable, type TabsShared, type TabListModel } from './tab-actions.js';
import { useLatest } from '../../utils/use-latest.js';
import type { TabRename } from './tab-rename.js';
import { stepTabMove, type TabReorder } from './tab-reorder.js';

/** Lists the entries of a tab's menu, given the tab's `id` and the standard entries. */
export type TabMenuItems = (key: Key, standard: readonly MenuEntry[]) => readonly MenuEntry[];

/** A list's tab menu, shared with its tabs. */
export interface TabMenu {
  controller: MenuController;
  /** Whether a tab has a menu: the owner lists its entries. */
  isEnabled: boolean;
  /** The entries of the tab `key`'s menu. */
  getEntries: (key: Key) => readonly MenuEntry[];
  /** Shows the entries of the tab `key`, whose menu is opening. */
  showFor: (key: Key) => void;
  /** The tab whose menu is open, or `null`. */
  openKey: () => Key | null;
  /** Whether the tab `key` is in the list and enabled, given the drawn list's state. */
  isAvailable: (key: Key, state?: TabListModel) => boolean;
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

type MoveDirection = 'left' | 'right' | 'up' | 'down';

/** The directions a tab moves toward the start and the end of its list, as the reader sees them. */
function findMoveDirections(reorder: TabReorder): [MoveDirection, MoveDirection] {
  if (reorder.orientation === 'vertical') return ['up', 'down'];
  return reorder.isRtl ? ['right', 'left'] : ['left', 'right'];
}

/**
 * The menu entries of the actions a list takes: rename and duplicate, moves, then delete. Each
 * action runs with the list's current callbacks and order, and only while its tab is still in the
 * list and enabled.
 */
function useStandardEntries(options: TabMenuOptions) {
  const strings = useUiStrings();
  const latestRef = useLatest(options);
  const { rename, reorder, onDuplicate, onRemove } = options;
  return useCallback(
    (key: Key): MenuEntry[] => {
      const act = (run: (current: TabMenuOptions) => void) => () => {
        if (isTabAvailable(latestRef.current.shared, key)) run(latestRef.current);
      };
      const edits: MenuItemEntry[] = [];
      if (rename) {
        edits.push({
          id: 'rename',
          label: strings.rename,
          icon: EditGlyph,
          onAction: act((current) => current.rename?.start(key)),
        });
      }
      if (onDuplicate) {
        edits.push({
          id: 'duplicate',
          label: strings.duplicate,
          icon: CopyGlyph,
          onAction: act((current) => current.onDuplicate?.(key)),
        });
      }
      const moves: MenuItemEntry[] = [];
      if (reorder) {
        findMoveDirections(reorder).forEach((direction, index) => {
          const step = index === 0 ? -1 : 1;
          moves.push({
            id: index === 0 ? 'move-backward' : 'move-forward',
            label: strings.moveItem(direction),
            icon: {
              left: ArrowLeftGlyph,
              right: ArrowRightGlyph,
              up: ArrowUpGlyph,
              down: ArrowDownGlyph,
            }[direction],
            isDisabled: stepTabMove(reorder.listKeys(), key, step) === null,
            // The move is worked out from the order when it runs, not when the menu was drawn.
            onAction: act(({ reorder: current }) => {
              const move = current && stepTabMove(current.listKeys(), key, step);
              if (current && move) current.onReorder(move);
            }),
          });
        });
      }
      const removal: MenuItemEntry[] = onRemove
        ? [
            {
              id: 'delete',
              label: strings.delete,
              icon: DeleteGlyph,
              tone: 'danger',
              onAction: act((current) => current.onRemove?.(new Set([key]))),
            },
          ]
        : [];
      return joinMenuGroups([edits, moves, removal]);
    },
    [latestRef, strings, rename, reorder, onDuplicate, onRemove],
  );
}

/**
 * A list's tab menu while the owner lists its entries (`getMenuItems`), the same object while its
 * options are.
 */
export function useTabMenu(options: TabMenuOptions): TabMenu {
  const listStandard = useStandardEntries(options);
  const { getMenuItems, shared } = options;
  return useMemo<TabMenu>(() => {
    const getEntries = (key: Key) => getMenuItems?.(key, listStandard(key)) ?? [];
    return {
      controller: shared.controller,
      isEnabled: getMenuItems !== undefined,
      getEntries,
      showFor: (key) => {
        shared.menuKey.current = key;
        shared.controller.setItems(getEntries(key));
      },
      openKey: () => (shared.controller.isOpen() ? shared.menuKey.current : null),
      isAvailable: (key, state) => isTabAvailable(shared, key, state),
    };
  }, [getMenuItems, listStandard, shared]);
}

/**
 * The menu a list's tabs open; it shows the entries of the tab that opened it. As the list changes
 * under an open menu, the menu follows: it lists the tab's current entries, and closes once the
 * tab leaves the list, turns disabled or the list stops listing entries.
 */
export function TabMenuOverlay({ menu, state }: { menu: TabMenu; state: TabListModel }) {
  useLayoutEffect(() => {
    const key = menu.openKey();
    if (key === null) return;
    if (!menu.isEnabled || !menu.isAvailable(key, state)) menu.controller.close();
    else menu.controller.setItems(menu.getEntries(key));
  });
  return menu.isEnabled ? <ContextMenu controller={menu.controller} /> : null;
}

/**
 * Makes a tab open its list's menu: a secondary click focuses the tab and opens it at the pointer,
 * the Context Menu key or Shift+F10 below the tab, a long touch at the touch point. Returns `null`
 * without a menu.
 */
export function useTabMenuTarget(menu: TabMenu, options: TabMenuTargetOptions) {
  const { tabKey, isDisabled, onContextMenu } = options;
  const targetRef = useRef<HTMLElement | null>(null);
  const isOn = menu.isEnabled && tabKey !== undefined && !isDisabled;
  const showEntries = () => {
    if (tabKey !== undefined) menu.showFor(tabKey);
  };
  const target = useContextMenuTarget({
    controller: menu.controller,
    isDisabled: !isOn,
    targetRef,
    own: {
      onContextMenu: (event) => {
        onContextMenu?.(event as MouseEvent<HTMLDivElement>);
        if (!isOn) return;
        // The menu returns focus where it was; on the tab, an action such as Rename continues there.
        event.currentTarget.focus({ preventScroll: true });
        showEntries();
      },
      onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
        if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) showEntries();
      },
      onPointerDown: (event: PointerEvent<HTMLElement>) => {
        if (event.pointerType === 'touch') showEntries();
      },
    },
  });
  return isOn ? target : null;
}
