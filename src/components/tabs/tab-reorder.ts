'use client';

// Reordering a list's tabs: Alt+Arrow keys on the focused tab, and pointer drags through the
// building blocks' drag and drop, each reported as one move for the owner to apply.

import {
  useLayoutEffect,
  useRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import type { Key, Orientation } from '../../core/props.js';
import { useItemDrag } from '../../utils/use-item-drag.js';
import { resolveDropPosition } from '../../utils/pointer-drag.js';
import { isMoveChord } from '../../utils/use-reorder-drag-and-drop.js';
import { findTabElement, listTabKeys, type TabsShared, type TabListModel } from './tab-actions.js';

/** A reorder request: move the tab `key` to the slot before or after the tab `targetKey`. */
export interface TabMove {
  key: Key;
  targetKey: Key;
  position: 'before' | 'after';
}

/** Which side of a tab a dragged tab would land on. */
export type TabDropPosition = TabMove['position'];

/** A list's reordering, shared with its tabs. */
export interface TabReorder {
  orientation: Orientation;
  isRtl: boolean;
  /** The tab being dragged, while a drag that started in this list is under way. */
  draggingKey: RefObject<Key | null>;
  /** The keys of the list's tabs, in order. */
  listKeys: () => Key[];
  /** The move a drop of the dragged tab beside `targetKey` makes, or `null` when it changes nothing. */
  resolveDrop: (targetKey: Key, position: TabDropPosition) => TabMove | null;
  onReorder: (move: TabMove) => void;
}

interface TabReorderOptions {
  shared: TabsShared;
  isRtl: boolean;
  onReorder: ((move: TabMove) => void) | undefined;
}

interface TabReorderKeyOptions {
  state: TabListModel | null;
  listRef: RefObject<HTMLElement | null>;
  reorder: TabReorder | null;
}

interface TabDragOptions {
  tabKey: Key;
  /** The text a dragged tab carries to other drop targets. */
  textValue: string;
  /** Refuses dragging the tab; it still takes drops. */
  isDisabled: boolean;
  ref: RefObject<HTMLElement | null>;
  reorder: TabReorder;
}

/** A tab's drag and drop: the props for its element, and where a dragged tab would land beside it. */
interface TabDragState {
  dragProps: HTMLAttributes<HTMLElement>;
  isDragging: boolean;
  dropPosition: TabDropPosition | null;
}

const tabDragType = 'application/x-ui-tab';

/** The steps an arrow key asks for, toward the start (-1) or the end (1), by orientation. */
const stepKeys: Readonly<Record<Orientation, Readonly<Record<string, -1 | 1>>>> = {
  horizontal: { ArrowLeft: -1, ArrowRight: 1 },
  vertical: { ArrowUp: -1, ArrowDown: 1 },
};

/** The move that places `key` beside `targetKey`, or `null` when the tab would stay where it is. */
export function resolveTabMove(keys: readonly Key[], move: TabMove): TabMove | null {
  const from = keys.indexOf(move.key);
  const to = keys.indexOf(move.targetKey);
  if (from < 0 || to < 0 || from === to) return null;
  return to - from === (move.position === 'before' ? 1 : -1) ? null : move;
}

/** The move one tab toward the start (-1) or the end (1), or `null` at that end. */
export function stepTabMove(keys: readonly Key[], key: Key, step: -1 | 1): TabMove | null {
  const index = keys.indexOf(key);
  const targetKey = index < 0 ? undefined : keys[index + step];
  if (targetKey === undefined) return null;
  return { key, targetKey, position: step < 0 ? 'before' : 'after' };
}

/** A list's reordering while the owner takes moves. A disabled tab never moves. */
export function createTabReorder({ shared, isRtl, onReorder }: TabReorderOptions) {
  if (!onReorder || shared.isDisabled) return null;
  const { draggingKey } = shared;
  const reorder: TabReorder = {
    orientation: shared.orientation,
    isRtl,
    draggingKey,
    listKeys: () => listTabKeys(shared),
    resolveDrop: (targetKey, position) => {
      const key = draggingKey.current;
      const isDisabled = key !== null && shared.stateRef.current?.selectionManager.isDisabled(key);
      if (key === null || isDisabled) return null;
      return resolveTabMove(listTabKeys(shared), { key, targetKey, position });
    },
    onReorder,
  };
  return reorder;
}

/**
 * The drawn list's reordering keys: Alt+Arrow keys along the list's orientation (mirrored right to
 * left) move the focused tab one place, keeping focus on it. At either end the keys do nothing.
 */
export function useTabReorderKeys({ state, listRef, reorder }: TabReorderKeyOptions) {
  const refocusKey = useRef<Key | null>(null);

  // A moved tab's element moves, which drops focus; give it back once the move renders.
  useLayoutEffect(() => {
    const key = refocusKey.current;
    refocusKey.current = null;
    const tab = key === null ? undefined : findTabElement(listRef.current, key);
    if (tab && tab !== document.activeElement) tab.focus();
  });

  if (!reorder || !state) return undefined;
  const { orientation, isRtl } = reorder;
  return (event: KeyboardEvent<HTMLElement>) => {
    const step = stepKeys[orientation][event.key];
    const key = state.selectionManager.focusedKey;
    const isTab = (event.target as Element).getAttribute('role') === 'tab';
    if (!step || !isMoveChord(event) || !isTab || key === null) return;
    event.preventDefault();
    event.stopPropagation();
    const towardEnd = orientation === 'horizontal' && isRtl ? (-step as -1 | 1) : step;
    const move = state.selectionManager.isDisabled(key)
      ? null
      : stepTabMove(reorder.listKeys(), key, towardEnd);
    if (!move) return;
    refocusKey.current = key;
    reorder.onReorder(move);
  };
}

/** The side of a tab, in reading order, that a point `x`, `y` within it falls on. */
function findDropPosition(
  box: { width: number; height: number },
  point: { x: number; y: number; reorder: TabReorder },
): TabDropPosition {
  return resolveDropPosition({
    width: box.width,
    height: box.height,
    x: point.x,
    y: point.y,
    orientation: point.reorder.orientation,
    isRtl: point.reorder.isRtl,
  });
}

/**
 * One tab's drag and drop: the tab drags, carrying its text, and takes drops of another tab of the
 * same list on the half of it the pointer is over, reporting where the dragged tab would land.
 */
export function useTabDrag({
  tabKey,
  textValue,
  isDisabled,
  ref,
  reorder,
}: TabDragOptions): TabDragState {
  return useItemDrag({
    ref,
    key: tabKey,
    textValue,
    dragType: tabDragType,
    dragging: reorder.draggingKey,
    isDisabled,
    isDropDisabled: false,
    resolveMove: ({ x, y }) => {
      const box = ref.current?.getBoundingClientRect() ?? { width: 0, height: 0 };
      return reorder.resolveDrop(tabKey, findDropPosition(box, { x, y, reorder }));
    },
    onMove: reorder.onReorder,
  });
}
