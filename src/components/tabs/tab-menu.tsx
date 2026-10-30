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

import { useRef, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import {
  ContextMenu,
  useContextMenuTarget,
  type MenuController,
} from '../context-menu/context-menu.js';
import type { MenuEntry, MenuItemEntry } from '../menu/menu.js';
import type { TabsShared } from './tab-actions.js';
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

/** The menu entries of the actions a list takes: rename and duplicate, moves, then delete. */
function useStandardEntries(options: TabMenuOptions) {
  const strings = useUiStrings();
  const { rename, reorder, onDuplicate, onRemove } = options;
  return (key: Key): MenuEntry[] => {
    const edits: MenuItemEntry[] = [];
    if (rename) {
      edits.push({
        id: 'rename',
        label: strings.rename,
        icon: EditGlyph,
        onAction: () => rename.start(key),
      });
    }
    if (onDuplicate) {
      edits.push({
        id: 'duplicate',
        label: strings.duplicate,
        icon: CopyGlyph,
        onAction: () => onDuplicate(key),
      });
    }
    const moves: MenuItemEntry[] = [];
    if (reorder) {
      const keys = reorder.listKeys();
      findMoveDirections(reorder).forEach((direction, index) => {
        const move = stepTabMove(keys, key, index === 0 ? -1 : 1);
        moves.push({
          id: index === 0 ? 'move-backward' : 'move-forward',
          label: strings.moveItem(direction),
          icon: {
            left: ArrowLeftGlyph,
            right: ArrowRightGlyph,
            up: ArrowUpGlyph,
            down: ArrowDownGlyph,
          }[direction],
          isDisabled: move === null,
          onAction: () => move && reorder.onReorder(move),
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
            onAction: () => onRemove(new Set([key])),
          },
        ]
      : [];
    return joinMenuGroups([edits, moves, removal]);
  };
}

/** A list's tab menu while the owner lists its entries (`getMenuItems`). */
export function useTabMenu(options: TabMenuOptions): TabMenu {
  const listStandard = useStandardEntries(options);
  const { getMenuItems } = options;
  return {
    controller: options.shared.controller,
    isEnabled: getMenuItems !== undefined,
    getEntries: (key) => getMenuItems?.(key, listStandard(key)) ?? [],
  };
}

/** The menu a list's tabs open; it shows the entries of the tab that opened it. */
export function TabMenuOverlay({ menu }: { menu: TabMenu }) {
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
    if (tabKey !== undefined) menu.controller.setItems(menu.getEntries(tabKey));
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
