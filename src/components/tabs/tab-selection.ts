'use client';

import { useLayoutEffect, useRef } from 'react';
import type { Key } from '../../core/props.js';
import type { TabListModel } from './tab-actions.js';

/**
 * The tab to select in place of `removed`, from the list's order before it went: the first
 * selectable tab after it, else the nearest before it, else none.
 */
export function findTabSuccessor(
  order: readonly Key[],
  removed: Key,
  isSelectable: (key: Key) => boolean,
): Key | null {
  const index = order.indexOf(removed);
  if (index === -1) return null;
  const after = order.slice(index + 1).find(isSelectable);
  if (after !== undefined) return after;
  return order.slice(0, index).findLast(isSelectable) ?? null;
}

function isSameOrder(left: readonly Key[], right: readonly Key[]) {
  return left.length === right.length && left.every((key, index) => key === right[index]);
}

/**
 * Selects another tab when the selected one leaves the list: the one that followed it, else the
 * one before it, as focus moves; a selected key the list never held selects its first enabled tab.
 * It selects through the list's state, so `onSelectionChange` reports it whether the selection is
 * controlled or not, after the commit's effects: an uncontrolled list's React Aria state picks its
 * first tab in its own effect, which this choice then replaces. It acts once for each change of
 * the tabs, so a host that keeps a removed key selected is not asked again.
 */
export function useRemovedTabSuccessor(state: TabListModel) {
  const previous = useRef<Key[]>([]);
  useLayoutEffect(() => {
    const order = Array.from(state.collection, (node) => node.key);
    const before = previous.current;
    previous.current = order;
    const selected = state.selectedKey;
    if (selected === null || state.collection.getItem(selected) || isSameOrder(before, order)) {
      return;
    }
    const isSelectable = (key: Key) =>
      state.collection.getItem(key) !== null && !state.selectionManager.isDisabled(key);
    const next = findTabSuccessor(before, selected, isSelectable) ?? order.find(isSelectable);
    if (next === undefined || next === null) return;
    queueMicrotask(() => state.setSelectedKey(next));
  });
}
