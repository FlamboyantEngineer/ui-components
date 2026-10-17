import { useCallback, useRef, type KeyboardEvent } from 'react';
import { useLocale } from 'react-aria-components';
import type { TreeMoveDirection } from '../../utils/tree-reorder.js';
import { isMoveChord } from '../../utils/use-reorder-drag-and-drop.js';
import type { TreeItemData, TreeProps } from './tree.js';
import type { TreeReorder } from './use-tree-reorder.js';

export interface TreeKeyDownOptions<T extends TreeItemData> extends Pick<
  TreeProps<T>,
  'onItemKeyDown'
> {
  /** Reordering, while the tree is reorderable. */
  reordering: TreeReorder<T> | null;
}

/** The tree's handling of keys pressed in its rows, ahead of React Aria's. */
export interface TreeKeyDown<T> {
  /** Records which item a row element draws. */
  registerRow: (node: Element | null, item: T) => void;
  /** Gives the owner, then reordering, each key pressed in a row. */
  onKeyDownCapture: (event: KeyboardEvent<HTMLElement>) => void;
}

const editableSelector = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]';

function findRow(target: EventTarget): Element | null {
  if (!(target instanceof Element) || target.closest(editableSelector)) return null;
  return target.closest('[role="row"]');
}

function toMoveDirection(key: string, isRightToLeft: boolean): TreeMoveDirection | null {
  if (key === 'ArrowUp') return 'up';
  if (key === 'ArrowDown') return 'down';
  if (key === 'ArrowRight') return isRightToLeft ? 'out' : 'in';
  if (key === 'ArrowLeft') return isRightToLeft ? 'in' : 'out';
  return null;
}

/**
 * Keys pressed in a row: the owner's `onItemKeyDown` sees each first and may claim it, then Alt+Arrow
 * chords move the row when the tree is reorderable. Keys typed in editable elements are left alone.
 */
export function useTreeKeyDown<T extends TreeItemData>({
  onItemKeyDown,
  reordering,
}: TreeKeyDownOptions<T>): TreeKeyDown<T> {
  const { direction } = useLocale();
  const rowItems = useRef(new WeakMap<Element, T>());
  const registerRow = useCallback((node: Element | null, item: T) => {
    if (node) rowItems.current.set(node, item);
  }, []);
  const moveByChord = (item: T, event: KeyboardEvent<HTMLElement>) => {
    const moveDirection = toMoveDirection(event.key, direction === 'rtl');
    if (!reordering || !moveDirection || !isMoveChord(event)) return false;
    return reordering.moveByKeyboard({ key: item.id, direction: moveDirection });
  };
  const onKeyDownCapture = (event: KeyboardEvent<HTMLElement>) => {
    const row = findRow(event.target);
    const item = row ? rowItems.current.get(row) : undefined;
    if (!item) return;
    if (onItemKeyDown?.(item, event) || moveByChord(item, event)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };
  return { registerRow, onKeyDownCapture };
}
