import type { Key } from 'react-aria-components';
import type { TableRow } from './table-rows.js';

/** A row with the child rows the table presents under it, keyed by the row's id. */
export interface TableNode<T> {
  id: Key;
  row: T;
  children: readonly TableNode<T>[];
}

/** Reads a row's child rows; without one every row is a leaf. */
export type TableChildRows<T> = ((row: T) => readonly T[] | null | undefined) | undefined;

/** The rows as nodes, each holding its child rows as nodes, depth first. */
export function buildTableNodes<T extends TableRow>(
  rows: readonly T[],
  getChildRows: TableChildRows<T>,
): readonly TableNode<T>[] {
  return rows.map((row) => ({
    id: row.id,
    row,
    children: getChildRows ? buildTableNodes(getChildRows(row) ?? [], getChildRows) : [],
  }));
}

/**
 * The nodes whose row matches, or that hold a matching descendant, each keeping only its kept
 * children, so a match deep in the tree keeps the rows above it.
 */
export function filterTableNodes<T extends TableRow>(
  nodes: readonly TableNode<T>[],
  matches: (row: T) => boolean,
): readonly TableNode<T>[] {
  return nodes.flatMap((node) => {
    const children = filterTableNodes(node.children, matches);
    return matches(node.row) || children.length > 0 ? [{ ...node, children }] : [];
  });
}

/** The nodes ordered by `compare` at every level; rows it cannot separate keep their order. */
export function sortTableNodes<T extends TableRow>(
  nodes: readonly TableNode<T>[],
  compare: (left: T, right: T) => number,
): readonly TableNode<T>[] {
  return nodes
    .map((node, index) => ({ node, index }))
    .sort((left, right) => compare(left.node.row, right.node.row) || left.index - right.index)
    .map(({ node }) => ({ ...node, children: sortTableNodes(node.children, compare) }));
}
