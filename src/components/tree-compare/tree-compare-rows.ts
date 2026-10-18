// What the tree comparison derives from its aligned rows: filtering, order, ancestors and names.

import type { Key } from '../../core/props.js';
import type { UiStrings } from '../../core/strings.js';
import type { CompareTreeNode, ComparedTreeRow } from '../../utils/compare-trees.js';

/** The rows in reading order, with each row's position and ancestors, whatever is expanded. */
export interface TreeCompareRowIndex<T extends CompareTreeNode> {
  /** Every row, parents before children. */
  order: Array<ComparedTreeRow<T>>;
  /** Each row's place in `order`, by id. */
  position: Map<Key, number>;
  /** Each row's ancestor ids, outermost first. */
  ancestors: Map<Key, Key[]>;
  /** Each row by id, and by the key text its row element carries. */
  byId: Map<Key, ComparedTreeRow<T>>;
  byText: Map<string, ComparedTreeRow<T>>;
}

/** The rows that differ, with the rows above them as context. */
export function filterChangedRows<T extends CompareTreeNode>(
  rows: ReadonlyArray<ComparedTreeRow<T>>,
): Array<ComparedTreeRow<T>> {
  return rows.flatMap((row) => {
    const children = filterChangedRows(row.children);
    return row.change === 'unchanged' && children.length === 0 ? [] : [{ ...row, children }];
  });
}

/** The ids of the rows with a difference somewhere below them. */
export function collectKeysAboveChanges<T extends CompareTreeNode>(
  rows: ReadonlyArray<ComparedTreeRow<T>>,
): Set<Key> {
  const keys = new Set<Key>();
  const visit = (row: ComparedTreeRow<T>): boolean => {
    const hasChangeBelow = row.children.map(visit).some(Boolean);
    if (hasChangeBelow) keys.add(row.id);
    return hasChangeBelow || row.change !== 'unchanged';
  };
  rows.forEach(visit);
  return keys;
}

export function indexRows<T extends CompareTreeNode>(
  rows: ReadonlyArray<ComparedTreeRow<T>>,
): TreeCompareRowIndex<T> {
  const index: TreeCompareRowIndex<T> = {
    order: [],
    position: new Map(),
    ancestors: new Map(),
    byId: new Map(),
    byText: new Map(),
  };
  const visit = (row: ComparedTreeRow<T>, ancestors: Key[]) => {
    index.position.set(row.id, index.order.length);
    index.order.push(row);
    index.ancestors.set(row.id, ancestors);
    index.byId.set(row.id, row);
    index.byText.set(String(row.id), row);
    for (const child of row.children) visit(child, [...ancestors, row.id]);
  };
  for (const row of rows) visit(row, []);
  return index;
}

/** The row with a difference after (`1`) or before (`-1`) the current row, wrapping around. */
export function findNextChange<T extends CompareTreeNode>(
  index: TreeCompareRowIndex<T>,
  { from, step }: { from: Key | null; step: 1 | -1 },
): ComparedTreeRow<T> | undefined {
  const changes = index.order.filter((row) => row.change !== 'unchanged');
  const current = from === null ? undefined : index.position.get(from);
  if (current === undefined) return step === 1 ? changes[0] : changes.at(-1);
  const isAhead = (row: ComparedTreeRow<T>) => step * (index.position.get(row.id)! - current) > 0;
  const ahead = step === 1 ? changes : [...changes].reverse();
  return ahead.find(isAhead) ?? ahead[0];
}

/** A row's accessible name and typeahead text: its label and how it differs. */
export function nameRow<T extends CompareTreeNode>(row: ComparedTreeRow<T>, strings: UiStrings) {
  const { left, right } = row;
  const label = (right ?? left)?.label ?? '';
  switch (row.change) {
    case 'added':
      return strings.treeAddedRow(label);
    case 'removed':
      return strings.treeRemovedRow(label);
    case 'changed':
      return strings.treeChangedRow(label, left && left.label !== label ? left.label : null);
    case 'moved':
      return right ? strings.treeMovedHereRow(label) : strings.treeMovedAwayRow(label);
    default:
      return label;
  }
}
