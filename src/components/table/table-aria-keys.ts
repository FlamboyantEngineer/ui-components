import { useMemo } from 'react';
import type { Key, Selection } from '../../core/props.js';
import {
  fromCollectionSelection,
  toCollectionSelection,
} from '../../utils/collection-selection.js';
import { createKeyIndex } from '../../utils/create-key-index.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { walkTree } from '../../utils/walk-tree.js';
import type { TableRow } from './table-rows.js';
import type { TableChildRows } from './table-tree.js';
import type { TableExpansion } from './use-table-expansion.js';
import type { TableSelection } from './use-table-selection.js';

interface TableAriaKeysOptions<T extends TableRow> {
  selection: TableSelection<T>;
  /** The rows the table draws now, on the current page with open groups; React Aria knows only these. */
  drawnRows: readonly T[];
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

/**
 * A selection React Aria reports after a selection of all: it lists only the rows it draws, so the
 * rows on other pages and in closed groups stay selected, and a drawn row it leaves out is unticked.
 */
function narrowAllSelection<T extends TableRow>(
  next: Selection,
  {
    previous,
    selection,
    drawnRows,
  }: Pick<TableAriaKeysOptions<T>, 'selection' | 'drawnRows'> & {
    previous: Selection;
  },
): Selection {
  // Clearing every row, as the header checkbox does, reports an empty selection.
  if (previous !== 'all' || next === 'all' || next.size === 0) return next;
  const unticked = new Set(drawnRows.filter((row) => !next.has(row.id)).map((row) => row.id));
  return new Set(selection.selectedRows.map((row) => row.id).filter((id) => !unticked.has(id)));
}

/** Keeps public row keys typed while the collection receives whitespace-safe identities. */
export function createTableAriaKeys<T extends TableRow>(options: TableAriaKeysOptions<T>) {
  const { selection, expansion, disabledKeys } = options;
  const selected = selection.selection;
  return {
    selectedKeys: toCollectionSelection(selected),
    onSelectionChange: (keys: Selection) =>
      selection.setSelection(
        narrowAllSelection(fromCollectionSelection(keys), { ...options, previous: selected }),
      ),
    disabledKeys:
      disabledKeys === undefined ? undefined : Array.from(disabledKeys, toCollectionKey),
    expandedKeys: new Set([...expansion.expandedKeys].map(toCollectionKey)),
    onExpandedChange: (keys: Set<Key>) =>
      expansion.onExpandedChange(new Set([...keys].map(fromCollectionKey))),
  };
}
