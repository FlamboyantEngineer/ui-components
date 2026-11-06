import type { Key } from '../../core/props.js';
import { mapTree } from '../../utils/map-tree.js';
import type { TableRow } from './table-rows.js';

/** The edge of the body a pinned row stays at. */
export type TableRowPin = 'top' | 'bottom';

/** A row with the child rows the table presents under it, keyed by the row's id. */
export interface TableNode<T> {
  id: Key;
  row: T;
  children: readonly TableNode<T>[];
  /** The edge a pinned row stays at; a pinned row draws without child or detail rows. */
  pin?: TableRowPin | undefined;
}

/** Reads a row's child rows; without one every row is a leaf. */
export type TableChildRows<T> = ((row: T) => readonly T[] | null | undefined) | undefined;

/** The rows as nodes, each holding its child rows as nodes, depth first. */
export function buildTableNodes<T extends TableRow>(
  rows: readonly T[],
  getChildRows: TableChildRows<T>,
): readonly TableNode<T>[] {
  return mapTree<T, TableNode<T>>(
    rows,
    (row) => getChildRows?.(row),
    (row, children) => ({ id: row.id, row, children }),
  );
}

/**
 * The nodes whose row matches, or that hold a matching descendant, each keeping only its kept
 * children, so a match deep in the tree keeps the rows above it.
 */
export function filterTableNodes<T extends TableRow>(
  nodes: readonly TableNode<T>[],
  matches: (row: T) => boolean,
): readonly TableNode<T>[] {
  return mapTree(
    nodes,
    (node) => node.children,
    (node, children: TableNode<T>[]) =>
      matches(node.row) || children.length > 0 ? { ...node, children } : null,
  );
}

/** The nodes ordered by `compare` at every level; rows it cannot separate keep their order. */
export function sortTableNodes<T extends TableRow>(
  nodes: readonly TableNode<T>[],
  compare: (left: T, right: T) => number,
): readonly TableNode<T>[] {
  const ordered = (siblings: readonly TableNode<T>[]) =>
    [...siblings].sort((left, right) => compare(left.row, right.row));
  return mapTree(
    ordered(nodes),
    (node) => ordered(node.children),
    (node, children: TableNode<T>[]) => ({ ...node, children }),
  );
}
