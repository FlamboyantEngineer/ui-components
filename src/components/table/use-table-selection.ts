import { useMemo } from 'react';
import type { CollectionSelectionProps } from '../../core/events.js';
import type { Key, Selection } from '../../core/props.js';
import { useControllableState } from '../../core/controllable-state.js';
import { walkTree } from '../../utils/walk-tree.js';
import type { TableRow } from './table-rows.js';
import type { TableNode } from './table-tree.js';

/** The rows a table selects, and the rows its writes may not touch. */
export interface TableSelection<T> {
  selection: Selection;
  setSelection: (selection: Selection) => void;
  /** The selected rows the table presents across pages, nested rows included, in order. */
  selectedRows: readonly T[];
  isRowDisabled: (row: T) => boolean;
  disabledKeys: ReadonlySet<Key>;
}

function toSelection(keys: Iterable<Key> | 'all' | undefined): Selection | undefined {
  if (keys === undefined) return undefined;
  if (keys === 'all') return 'all';
  return keys instanceof Set ? keys : new Set(keys);
}

/**
 * The row selection, held by the table unless the caller controls it, so its selection bar knows
 * the selected rows: every enabled presented row for `all`, else those whose keys are selected.
 */
export function useTableSelection<T extends TableRow>(
  options: Pick<
    CollectionSelectionProps,
    'selectedKeys' | 'defaultSelectedKeys' | 'onSelectionChange' | 'disabledKeys'
  >,
  presented: readonly TableNode<T>[],
): TableSelection<T> {
  const controlled = useMemo(() => toSelection(options.selectedKeys), [options.selectedKeys]);
  const [selection, setSelection] = useControllableState(
    controlled,
    toSelection(options.defaultSelectedKeys) ?? new Set<Key>(),
    options.onSelectionChange,
  );
  const disabled = useMemo(() => new Set(options.disabledKeys ?? []), [options.disabledKeys]);
  const isRowDisabled = useMemo(() => (row: T) => disabled.has(row.id), [disabled]);
  const selectedRows = useMemo(() => {
    const keys = selection === 'all' ? null : selection;
    const rows: T[] = [];
    if (keys?.size === 0) return rows;
    for (const { row } of walkTree(presented, (node) => node.children)) {
      if (!isRowDisabled(row) && (!keys || keys.has(row.id))) rows.push(row);
    }
    return rows;
  }, [presented, selection, isRowDisabled]);
  return { selection, setSelection, selectedRows, isRowDisabled, disabledKeys: disabled };
}
