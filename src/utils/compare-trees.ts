// Aligns two hierarchies row by row (specs/TREE-COMPARE.md): a keyed tree diff.

import type { Key } from '../core/props.js';
import { diffSequences } from './diff.js';

/** A node of a compared hierarchy. Its children are nodes of the same type. */
export interface CompareTreeNode {
  /** Identifies the node in both trees; unique within each tree. */
  id: Key;
  label: string;
  children?: readonly CompareTreeNode[] | undefined;
}

/** How a row differs between the left and the right tree. */
export type TreeChange = 'unchanged' | 'added' | 'removed' | 'changed' | 'moved';

/** How many nodes were added, removed, changed and moved; a moved node counts once. */
export type TreeChangeCounts = Record<Exclude<TreeChange, 'unchanged'>, number>;

/** One aligned row: a node on the left, on the right or on both sides, and its child rows. */
export interface ComparedTreeRow<T extends CompareTreeNode = CompareTreeNode> {
  /** Unique among the rows: the node's id, or `moved-from:<id>` for a moved node's old position. */
  id: Key;
  /** The node's id. */
  nodeId: Key;
  /** The node in the left tree, when the row shows it there. */
  left?: T | undefined;
  /** The node in the right tree, when the row shows it there. */
  right?: T | undefined;
  change: TreeChange;
  /** For a moved node, the id of its row at the other position. */
  counterpartId?: Key | undefined;
  children: Array<ComparedTreeRow<T>>;
}

export interface TreeComparison<T extends CompareTreeNode = CompareTreeNode> {
  rows: Array<ComparedTreeRow<T>>;
  counts: TreeChangeCounts;
}

export interface CompareTreesOptions<T extends CompareTreeNode> {
  /** Whether a node present on both sides is unchanged. Defaults to comparing labels. */
  isEqual?: ((left: T, right: T) => boolean) | undefined;
}

interface Comparison<T extends CompareTreeNode> {
  left: Map<Key, T>;
  right: Map<Key, T>;
  isEqual: (left: T, right: T) => boolean;
  counts: TreeChangeCounts;
}

const haveSameLabel = (left: CompareTreeNode, right: CompareTreeNode) => left.label === right.label;

const toMovedFromId = (id: Key): Key => `moved-from:${String(id)}`;

const childrenOf = <T extends CompareTreeNode>(node: T) => (node.children ?? []) as readonly T[];

function indexTree<T extends CompareTreeNode>(nodes: readonly T[], index = new Map<Key, T>()) {
  for (const node of nodes) {
    index.set(node.id, node);
    indexTree(childrenOf(node), index);
  }
  return index;
}

function pairRow<T extends CompareTreeNode>(left: T, right: T, comparison: Comparison<T>) {
  const change: TreeChange = comparison.isEqual(left, right) ? 'unchanged' : 'changed';
  if (change === 'changed') comparison.counts.changed += 1;
  const children = alignRows(childrenOf(left), childrenOf(right), comparison);
  return { id: left.id, nodeId: left.id, left, right, change, children };
}

/** A node only the left sibling list holds: removed, or the old position of a moved node. */
function leftRow<T extends CompareTreeNode>(
  node: T,
  comparison: Comparison<T>,
): ComparedTreeRow<T> {
  if (comparison.right.has(node.id)) {
    const id = toMovedFromId(node.id);
    return {
      id,
      nodeId: node.id,
      left: node,
      change: 'moved',
      counterpartId: node.id,
      children: [],
    };
  }
  comparison.counts.removed += 1;
  const children = alignRows(childrenOf(node), [], comparison);
  return { id: node.id, nodeId: node.id, left: node, change: 'removed', children };
}

/**
 * A node only the right sibling list holds: added, or the new position of a moved node, under
 * which its children on both sides are compared.
 */
function rightRow<T extends CompareTreeNode>(
  node: T,
  comparison: Comparison<T>,
): ComparedTreeRow<T> {
  const old = comparison.left.get(node.id);
  if (old) {
    comparison.counts.moved += 1;
    const children = alignRows(childrenOf(old), childrenOf(node), comparison);
    const counterpartId = toMovedFromId(node.id);
    return { id: node.id, nodeId: node.id, right: node, change: 'moved', counterpartId, children };
  }
  comparison.counts.added += 1;
  const children = alignRows([], childrenOf(node), comparison);
  return { id: node.id, nodeId: node.id, right: node, change: 'added', children };
}

/** Aligns two sibling lists on their longest common run of ids. */
function alignRows<T extends CompareTreeNode>(
  left: readonly T[],
  right: readonly T[],
  comparison: Comparison<T>,
): Array<ComparedTreeRow<T>> {
  const leftById = new Map(left.map((node) => [node.id, node]));
  const rightById = new Map(right.map((node) => [node.id, node]));
  const ids = (nodes: readonly T[]) => nodes.map((node) => node.id);
  return diffSequences(ids(left), ids(right)).flatMap(({ kind, items }) =>
    items.map((id) => {
      if (kind === 'equal') return pairRow(leftById.get(id)!, rightById.get(id)!, comparison);
      if (kind === 'delete') return leftRow(leftById.get(id)!, comparison);
      return rightRow(rightById.get(id)!, comparison);
    }),
  );
}

/**
 * Aligns two hierarchies row by row, matching nodes by id. A node on both sides under the same
 * parent and in the same order is one row, `unchanged` or `changed`; a node on one side only is
 * `added` or `removed` with its subtree; a node whose parent or order differs is `moved` and has
 * two rows, its old position (left only, no children) and its new one (right only, its children
 * compared under it), each naming the other as its counterpart.
 */
export function compareTrees<T extends CompareTreeNode>(
  left: readonly T[],
  right: readonly T[],
  options: CompareTreesOptions<T> = {},
): TreeComparison<T> {
  const comparison: Comparison<T> = {
    left: indexTree(left),
    right: indexTree(right),
    isEqual: options.isEqual ?? haveSameLabel,
    counts: { added: 0, removed: 0, changed: 0, moved: 0 },
  };
  return { rows: alignRows(left, right, comparison), counts: comparison.counts };
}
