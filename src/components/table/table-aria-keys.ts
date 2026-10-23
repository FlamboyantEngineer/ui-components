import type { Key, Selection } from '../../core/props.js';
import { useMemo } from 'react';
import { createKeyIndex } from '../../utils/create-key-index.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { walkTree } from '../../utils/walk-tree.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import {
  fromCollectionSelection,
  toCollectionSelection,
} from '../../utils/collection-selection.js';
import type { TableChildRows } from './table-tree.js';
import type { TableRow } from './table-rows.js';
import type { TableExpansion } from './use-table-expansion.js';
import type { TableSelection } from './use-table-selection.js';

interface TableAriaKeysOptions<T> {
  selection: TableSelection<T>;
  expansion: TableExpansion;
  disabledKeys: Iterable<Key> | undefined;
}

/** Indexes all source rows so callbacks retain keys of rows outside the current page. */
export function useTableKeyIndex<T extends TableRow>(
  rows: readonly T[],
  getChildRows: TableChildRows<T>,
  isEnabled: boolean,
): ReadonlyMap<string, Key> {
  return useMemo(
    () =>
      isEnabled
        ? createKeyIndex(
            Array.from(
              walkTree(rows, (row) => getChildRows?.(row) ?? undefined),
              (row) => row.id,
            ),
          )
        : new Map(),
    [rows, getChildRows, isEnabled],
  );
}

/** Internal notice, detail and group rows never report caller row actions. */
export function createTableRowAction(
  index: ReadonlyMap<string, Key>,
  onAction: ((key: Key) => void) | undefined,
): ((key: Key) => void) | undefined {
  return (
    onAction &&
    ((key) => {
      const original = index.get(String(key));
      if (original !== undefined) onAction(original);
    })
  );
}

/** Keeps public row keys typed while the collection receives whitespace-safe identities. */
export function createTableAriaKeys<T>(options: TableAriaKeysOptions<T>) {
  const { selection, expansion, disabledKeys } = options;
  const selected = selection.selection;
  return {
    selectedKeys: toCollectionSelection(selected),
    onSelectionChange: (keys: Selection) => selection.setSelection(fromCollectionSelection(keys)),
    disabledKeys:
      disabledKeys === undefined ? undefined : Array.from(disabledKeys, toCollectionKey),
    expandedKeys: new Set([...expansion.expandedKeys].map(toCollectionKey)),
    onExpandedChange: (keys: Set<Key>) =>
      expansion.onExpandedChange(new Set([...keys].map(fromCollectionKey))),
  };
}
