'use client';

// The context menus of a dashboard grid: each tile's, with built-in Move, Resize and Remove and the
// host's own entries, and the empty space's, for host actions at a cell such as adding a tile
// (specs/DASHBOARD-GRID.md, UIC-DASHBOARD-GRID-5).

import { useCallback, useEffect, useMemo, useRef, type Ref, type RefObject } from 'react';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useLocale } from '../../primitives/index.js';
import {
  ContextMenu,
  useContextMenuTarget,
  useMenuController,
  useMenuControllerState,
} from '../context-menu/context-menu.js';
import { getOwnerWindow } from '../../utils/owner-window.js';
import { isFocusLost } from '../../utils/focus-target.js';
import { Menu, type MenuEntry } from '../menu/menu.js';
import { resolveActionIcon, type MenuActionIcons } from '../menu/menu-action-icons.js';
import type { DashboardGridItem } from './dashboard-layout.js';
import type { CellStep, TileMoveKind } from './use-tile-move.js';

/** A built-in tile action: focus its move or resize handle, or remove it from the layout. */
export type DashboardTileAction = 'move' | 'resize' | 'remove';

/** Icons for the tile menu's built-in actions, by action; they have none by default. */
export type DashboardTileMenuIcons = MenuActionIcons<DashboardTileAction>;

/** A built-in tile action by name, or any menu entry. */
export type DashboardTileMenuEntry = DashboardTileAction | MenuEntry;

/** The tile menu options a grid hands its tiles. */
export interface DashboardTileMenuOptions {
  /** The entries of a tile's menu, or a function of its layout item that returns them. */
  entries:
    | readonly DashboardTileMenuEntry[]
    | ((item: DashboardGridItem) => readonly DashboardTileMenuEntry[]);
  onAction: ((key: Key, item: DashboardGridItem) => void) | undefined;
  icons: DashboardTileMenuIcons | undefined;
}

/** The grid state a tile menu acts on. */
interface TileMenuGrid {
  item: DashboardGridItem;
  isEditing: boolean;
  menu: DashboardTileMenuOptions | null;
  remove: (id: Key) => void;
  announce: (message: string) => void;
}

const builtIns: ReadonlySet<unknown> = new Set<DashboardTileAction>(['move', 'resize', 'remove']);

function isBuiltIn(entry: unknown): entry is DashboardTileAction {
  return builtIns.has(entry);
}

/**
 * Focuses `element` once a closing menu has given focus back, if focus then fell to the body, as it
 * does when the element the menu gives it back to was removed.
 */
function focusAfterClose(element: HTMLElement | null) {
  if (!element) return;
  const view = getOwnerWindow(element);
  view.requestAnimationFrame(() =>
    view.requestAnimationFrame(() => {
      if (isFocusLost(element)) element.focus();
    }),
  );
}

function readEntries(menu: DashboardTileMenuOptions, item: DashboardGridItem) {
  return typeof menu.entries === 'function' ? menu.entries(item) : menu.entries;
}

/**
 * A tile's context menu, on the tile: the built-in actions only in edit mode, and the host's
 * entries always. Move and Resize focus the tile's handle, where the arrow keys move or resize it;
 * Remove takes the tile out of the layout. The host hears every chosen entry after a built-in ran.
 */
export function useTileMenu(
  grid: TileMenuGrid | null,
  label: string,
  tile: {
    handles: Record<TileMoveKind, RefObject<HTMLButtonElement | null>>;
    ownRef: Ref<HTMLElement> | undefined;
    /** The control to focus in place of a removed tile, from the tile's element. */
    findFallback: (tile: HTMLElement) => HTMLElement | null;
  },
) {
  const { handles, ownRef, findFallback } = tile;
  const strings = useUiStrings();
  const controller = useMenuController();
  const targetRef = useRef<HTMLElement | null>(null);
  const menu = grid?.menu;
  const listed = !grid || !menu ? [] : readEntries(menu, grid.item);
  const names: Record<DashboardTileAction, string> = {
    move: strings.moveTile(label),
    resize: strings.resizeTile(label),
    remove: strings.removeTile(label),
  };
  const entries = listed.flatMap((entry): MenuEntry[] => {
    if (!isBuiltIn(entry)) return [entry];
    if (!grid?.isEditing) return [];
    return [{ id: entry, label: names[entry], icon: resolveActionIcon(menu?.icons, entry) }];
  });
  const isDisabled = entries.length === 0;
  const targetProps = useContextMenuTarget({
    controller,
    isDisabled,
    own: { ref: ownRef },
    targetRef,
  });
  useEffect(() => {
    if (isDisabled) controller.close();
  }, [isDisabled, controller]);
  // Move and Resize focus their handle once the menu has closed and given focus back.
  const pendingFocus = useRef<TileMoveKind | null>(null);
  const { isOpen } = useMenuControllerState(controller);
  useEffect(() => {
    const kind = pendingFocus.current;
    const handle = kind ? handles[kind].current : null;
    if (isOpen || !handle) return undefined;
    pendingFocus.current = null;
    const view = getOwnerWindow(handle);
    const frame = view.requestAnimationFrame(() => handle.focus());
    return () => view.cancelAnimationFrame(frame);
  }, [isOpen, handles]);
  const onAction = (key: Key) => {
    if (!grid) return;
    if (key === 'move' || key === 'resize') pendingFocus.current = key;
    if (key === 'remove') {
      const tile = targetRef.current;
      if (tile) focusAfterClose(findFallback(tile));
      grid.remove(grid.item.id);
      grid.announce(strings.tileRemoved(label));
    }
    menu?.onAction?.(key, grid.item);
  };
  const element = isDisabled ? null : (
    <ContextMenu
      controller={controller}
      triggerRef={targetRef}
      aria-label={strings.tileActions(label)}
    >
      <Menu items={entries} onAction={onAction} />
    </ContextMenu>
  );
  return { targetProps, menu: element };
}

/** The empty space menu options of a grid. */
interface DashboardSpaceMenuOptions {
  entries: readonly MenuEntry[] | undefined;
  /** Called with the chosen entry and the cell the menu opened on, counting from 0. */
  onAction: ((key: Key, cell: { x: number; y: number }) => void) | undefined;
}

/** The cell under a point of the grid, kept inside its columns, mirrored right to left. */
function cellAt(
  element: HTMLElement,
  point: { x: number; y: number },
  { step, columns, isRtl }: { step: CellStep; columns: number; isRtl: boolean },
) {
  const box = element.getBoundingClientRect();
  const across = isRtl ? box.right - point.x : point.x - box.left;
  const column = step.column > 0 ? Math.floor(across / step.column) : 0;
  const row = step.row > 0 ? Math.floor((point.y - box.top) / step.row) : 0;
  return { x: Math.min(Math.max(column, 0), columns - 1), y: Math.max(row, 0) };
}

/**
 * The grid's empty space menu: a secondary click or long touch on the grid outside every tile opens
 * the host's entries, which then hear the cell it opened on. A request on a tile, or anywhere when
 * there are no entries, keeps the browser's menu.
 */
function useSpaceMenu(
  options: DashboardSpaceMenuOptions,
  grid: {
    element: HTMLElement | null;
    columns: number;
    measureStep: () => CellStep;
    /** Whether a target sits in one of the grid's tiles. */
    isInTile: (target: EventTarget) => boolean;
  },
) {
  const strings = useUiStrings();
  const { direction } = useLocale();
  const controller = useMenuController();
  const targetRef = useRef<HTMLElement | null>(null);
  const cell = useRef({ x: 0, y: 0 });
  const entries = options.entries ?? [];
  const keepCell = (event: { clientX: number; clientY: number }) => {
    if (!grid.element) return;
    cell.current = cellAt(
      grid.element,
      { x: event.clientX, y: event.clientY },
      { step: grid.measureStep(), columns: grid.columns, isRtl: direction === 'rtl' },
    );
  };
  const isDisabled = entries.length === 0;
  const targetProps = useContextMenuTarget({
    controller,
    isDisabled,
    accepts: (target) => !grid.isInTile(target),
    // The press or click that opens the menu tells the cell: a long touch opens from its press.
    own: { onContextMenu: keepCell, onPointerDownCapture: keepCell },
    targetRef,
  });
  const element = isDisabled ? null : (
    <ContextMenu
      controller={controller}
      triggerRef={targetRef}
      aria-label={strings.gridSpaceActions}
    >
      <Menu items={entries} onAction={(key) => options.onAction?.(key, cell.current)} />
    </ContextMenu>
  );
  return { targetProps, menu: element };
}

interface GridMenuOptions {
  tileMenu: DashboardTileMenuOptions['entries'] | undefined;
  onTileAction: DashboardTileMenuOptions['onAction'];
  tileMenuIcons: DashboardTileMenuOptions['icons'];
  spaceMenu: readonly MenuEntry[] | undefined;
  onSpaceAction: DashboardSpaceMenuOptions['onAction'];
}

/**
 * A grid's menus: the tile menu options its tiles read (the same object while the host's are),
 * removing a tile from the committed layout, and the empty space menu on the grid itself.
 */
export function useGridMenus(
  options: GridMenuOptions,
  grid: Parameters<typeof useSpaceMenu>[1] & {
    committed: { layout: DashboardGridItem[]; commit: (next: DashboardGridItem[]) => void };
  },
) {
  const { tileMenu, onTileAction, tileMenuIcons } = options;
  const menu = useMemo(
    () => (tileMenu ? { entries: tileMenu, onAction: onTileAction, icons: tileMenuIcons } : null),
    [tileMenu, onTileAction, tileMenuIcons],
  );
  const { commit, layout } = grid.committed;
  const remove = useCallback(
    (id: Key) => commit(layout.filter((item) => item.id !== id)),
    [commit, layout],
  );
  const space = useSpaceMenu({ entries: options.spaceMenu, onAction: options.onSpaceAction }, grid);
  return { menu, remove, targetProps: space.targetProps, spaceMenu: space.menu };
}
