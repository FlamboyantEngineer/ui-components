// Aligns two hierarchies row by row (specs/TREE-COMPARE.md): a keyed tree diff.

import type { Key } from '../core/props.js';
import { diffSequences } from './diff.js';
import { isShallowEqual } from './is-shallow-equal.js';
import { requireDefined } from './require-defined.js';
import { walkTree } from './walk-tree.js';

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
  /** Unique among rows: the node's id, or an unused `moved-from:<id>` key for its old position. */
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
  movedFrom: Map<Key, Key>;
  rowIds: Set<Key>;
}

const haveSameLabel = (left: CompareTreeNode, right: CompareTreeNode) => left.label === right.label;

function getMovedFromId<T extends CompareTreeNode>(id: Key, comparison: Comparison<T>): Key {
  const known = comparison.movedFrom.get(id);
  if (known !== undefined) return known;
  const base = `moved-from:${String(id)}`;
  let candidate = base;
  for (let suffix = 2; comparison.rowIds.has(candidate); suffix += 1)
    candidate = `${base}:${suffix}`;
  comparison.rowIds.add(candidate);
  comparison.movedFrom.set(id, candidate);
  return candidate;
}

const childrenOf = <T extends CompareTreeNode>(node: T) => (node.children ?? []) as readonly T[];

function indexTree<T extends CompareTreeNode>(nodes: readonly T[]) {
  const index = new Map<Key, T>();
  for (const node of walkTree(nodes, childrenOf)) index.set(node.id, node);
  return index;
}

function pairRow<T extends CompareTreeNode>(
  left: T,
  right: T,
  comparison: Comparison<T>,
): ComparedTreeRow<T> {
  const change: TreeChange = comparison.isEqual(left, right) ? 'unchanged' : 'changed';
  if (change === 'changed') comparison.counts.changed += 1;
  return { id: left.id, nodeId: left.id, left, right, change, children: [] };
}

/** A node only the left sibling list holds: removed, or the old position of a moved node. */
function leftRow<T extends CompareTreeNode>(
  node: T,
  comparison: Comparison<T>,
): ComparedTreeRow<T> {
  if (comparison.right.has(node.id)) {
    const id = getMovedFromId(node.id, comparison);
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
  return { id: node.id, nodeId: node.id, left: node, change: 'removed', children: [] };
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
    const counterpartId = getMovedFromId(node.id, comparison);
    return {
      id: node.id,
      nodeId: node.id,
      right: node,
      change: 'moved',
      counterpartId,
      children: [],
    };
  }
  comparison.counts.added += 1;
  return { id: node.id, nodeId: node.id, right: node, change: 'added', children: [] };
}

/** Aligns two sibling lists on their longest common run of ids. */
function* alignSiblings<T extends CompareTreeNode>(
  left: readonly T[],
  right: readonly T[],
  comparison: Comparison<T>,
): Generator<ComparedTreeRow<T>> {
  const ids = (nodes: readonly T[]) => nodes.map((node) => node.id);
  for (const { kind, items } of diffSequences(ids(left), ids(right))) {
    for (const id of items) {
      if (kind === 'equal')
        yield pairRow(
          requireDefined(comparison.left.get(id)),
          requireDefined(comparison.right.get(id)),
          comparison,
        );
      else if (kind === 'delete')
        yield leftRow(requireDefined(comparison.left.get(id)), comparison);
      else yield rightRow(requireDefined(comparison.right.get(id)), comparison);
    }
  }
}

function alignRows<T extends CompareTreeNode>(
  left: readonly T[],
  right: readonly T[],
  comparison: Comparison<T>,
): Array<ComparedTreeRow<T>> {
  const rows: Array<ComparedTreeRow<T>> = [];
  const stack = [{ rows, entries: alignSiblings(left, right, comparison) }];
  while (stack.length > 0) {
    const frame = requireDefined(stack.at(-1));
    const next = frame.entries.next();
    if (next.done) {
      stack.pop();
      continue;
    }
    const row = next.value;
    frame.rows.push(row);
    if (row.change === 'moved' && !row.right) continue;
    const oldNode = row.left ?? comparison.left.get(row.nodeId);
    const oldChildren = oldNode ? childrenOf(oldNode) : [];
    const newChildren = row.right ? childrenOf(row.right) : [];
    if (oldChildren.length === 0 && newChildren.length === 0) continue;
    stack.push({
      rows: row.children,
      entries: alignSiblings(oldChildren, newChildren, comparison),
    });
  }
  return rows;
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
    movedFrom: new Map(),
    rowIds: new Set(),
  };
  for (const id of comparison.left.keys()) comparison.rowIds.add(id);
  for (const id of comparison.right.keys()) comparison.rowIds.add(id);
  return { rows: alignRows(left, right, comparison), counts: comparison.counts };
}

/** Whether two nodes hold the same own fields (shallowly) and the same children in order. */
function isSameNode(left: CompareTreeNode, right: CompareTreeNode): boolean {
  if (left === right) return true;
  const { children: leftChildren = [], ...leftFields } = left;
  const { children: rightChildren = [], ...rightFields } = right;
  return isShallowEqual(leftFields, rightFields) && isSameTrees(leftChildren, rightChildren);
}

/**
 * Whether two lists of trees hold the same nodes in the same shape, as a parent that rebuilds its
 * data on each render passes them: each node's own fields are compared shallowly and its children
 * in order, so the check costs no more than walking the trees once.
 */
export function isSameTrees(
  left: readonly CompareTreeNode[],
  right: readonly CompareTreeNode[],
): boolean {
  return (
    left === right ||
    (left.length === right.length &&
      left.every((node, index) => isSameNode(node, requireDefined(right[index]))))
  );
}
