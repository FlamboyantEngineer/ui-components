'use client';

import { useMemo } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import type { Key, Selection, SelectionMode } from '../../core/props.js';

interface DiagramSelectionOptions {
  selectionMode: SelectionMode;
  selectedKeys: Iterable<Key> | 'all' | undefined;
  defaultSelectedKeys: Iterable<Key> | 'all' | undefined;
  onSelectionChange: ((keys: Selection) => void) | undefined;
  /** Every node and edge id, which `'all'` stands for. */
  allKeys: readonly Key[];
}

export interface DiagramSelection {
  selected: ReadonlySet<Key>;
  /** Selects `key` alone, or with `toggle` adds or removes it (multiple selection only). */
  select: (key: Key, toggle: boolean) => void;
  /** Selects exactly `keys`, or only the first of them in single selection. */
  replace: (keys: readonly Key[]) => void;
}

function toSelection(keys: Iterable<Key> | 'all' | undefined): Selection | undefined {
  if (keys === undefined) return undefined;
  return keys === 'all' ? 'all' : new Set(keys as Iterable<Key>);
}

const noKeys: ReadonlySet<Key> = new Set();

/**
 * The selection the canvas acts on: none in `none` mode, the nodes and edges it holds that still
 * exist, and of those only the first in `single` mode (for `'all'`, the first node).
 */
function toEffective(
  value: Selection,
  selectionMode: SelectionMode,
  allKeys: readonly Key[],
): ReadonlySet<Key> {
  if (selectionMode === 'none') return noKeys;
  const eligible = new Set(allKeys);
  const keys = value === 'all' ? allKeys : [...value].filter((key) => eligible.has(key));
  return new Set(selectionMode === 'single' ? keys.slice(0, 1) : keys);
}

/**
 * The selected nodes and edges, controlled or not, in the canvas's selection mode. The canvas shows
 * and acts on the effective selection only. The selection it holds, or its owner holds, is left as
 * it is and reported to nobody: it returns in full when the mode widens again, and the next
 * selection change starts from the effective one.
 */
export function useDiagramSelection(options: DiagramSelectionOptions): DiagramSelection {
  const { selectionMode, allKeys } = options;
  const [value, setValue] = useControllableState<Selection>(
    toSelection(options.selectedKeys),
    toSelection(options.defaultSelectedKeys) ?? new Set(),
    options.onSelectionChange,
  );
  const selected = useMemo(
    () => toEffective(value, selectionMode, allKeys),
    [value, selectionMode, allKeys],
  );
  const replace = (keys: readonly Key[]) => {
    if (selectionMode === 'none') return;
    const next = selectionMode === 'single' ? keys.slice(0, 1) : keys;
    const isSame = next.length === selected.size && next.every((key) => selected.has(key));
    if (!isSame) setValue(new Set(next));
  };
  const select = (key: Key, toggle: boolean) => {
    if (!toggle || selectionMode !== 'multiple') {
      replace([key]);
      return;
    }
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setValue(next);
  };
  return { selected, select, replace };
}
