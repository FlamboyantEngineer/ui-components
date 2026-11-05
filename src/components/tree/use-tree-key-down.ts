'use client';

import { type KeyboardEvent, useCallback, useRef } from 'react';
import { useLocale } from '../../primitives/index.js';
import { isEditableTarget } from '../../utils/is-editable-target.js';
import { isElement } from '../../utils/is-element.js';
import type { TreeMoveDirection } from '../../utils/tree-reorder.js';
import { isMoveChord } from '../../utils/use-reorder-drag-and-drop.js';
import type { TreeItemData, TreeProps } from './tree-props.js';
import type { TreeRename } from './use-tree-rename.js';
import type { TreeReorder } from './use-tree-reorder.js';

interface TreeKeyDownOptions<T extends TreeItemData> extends Pick<TreeProps<T>, 'onItemKeyDown'> {
  /** Reordering, while the tree is reorderable. */
  reordering: TreeReorder | null;
  /** In-place renaming, while the owner takes renames. */
  rename: TreeRename<T> | null;
}

/** The tree's handling of keys pressed in its rows, ahead of React Aria's. */
export interface TreeKeyDown<T> {
  /** Records which item a row element draws. */
  registerRow: (node: Element | null, item: T) => void;
  /** Gives the owner, then reordering, each key pressed in a row. */
  onKeyDownCapture: (event: KeyboardEvent<HTMLElement>) => void;
}

/** Text widgets a host draws in a row, which keep the arrow keys for their caret. */
const textWidgets = '[role="textbox"], [role="combobox"]';

function findRow(target: EventTarget): Element | null {
  if (!isElement(target) || isEditableTarget(target, textWidgets)) return null;
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
 * Keys pressed in a row: the owner's `onItemKeyDown` sees each first and may claim it, then F2
 * renames the row when the owner takes renames and Alt+Arrow chords move it when the tree is
 * reorderable. Keys typed in the rename field go to it alone; other editable elements are left alone.
 */
export function useTreeKeyDown<T extends TreeItemData>({
  onItemKeyDown,
  reordering,
  rename,
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
  const renameByKey = (item: T, event: KeyboardEvent<HTMLElement>) =>
    event.key === 'F2' && rename !== null && rename.start(item);
  const onKeyDownCapture = (event: KeyboardEvent<HTMLElement>) => {
    if (rename?.isEditorEvent(event)) {
      rename.onEditorKeyDown(event);
      return;
    }
    const row = findRow(event.target);
    const item = row ? rowItems.current.get(row) : undefined;
    if (!item) return;
    if (onItemKeyDown?.(item, event) || renameByKey(item, event) || moveByChord(item, event)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };
  return { registerRow, onKeyDownCapture };
}
