import type { Key, SortDescriptor } from '../../core/props.js';
import { isGroupNode, type TableBodyNode } from './table-groups.js';
import type { TableMove, TableRow } from './table-rows.js';
import type { TableReorderOptions } from './use-table-reorder.js';

interface GroupedReorderRows<T> {
  rows: T[];
  groupKeys: Map<Key, Key>;
}

interface GroupedBody<T> {
  nodes: readonly TableBodyNode<T>[];
  isGrouped: boolean;
  expansion: { expandedKeys: ReadonlySet<Key> };
}

interface ReorderView<T> {
  rows: readonly T[];
  reorder: TableReorderOptions<T> | undefined;
  groupKeys?: ReadonlyMap<Key, Key>;
}

function collectGroupRows<T extends TableRow>(
  nodes: readonly TableBodyNode<T>[],
  at: { expanded: ReadonlySet<Key>; topLevel: ReadonlySet<Key>; group?: Key },
  result: GroupedReorderRows<T>,
): void {
  for (const node of nodes) {
    if (isGroupNode(node)) {
      if (at.expanded.has(node.id))
        collectGroupRows(node.children, { ...at, group: node.id }, result);
    } else if (at.group !== undefined && at.topLevel.has(node.id)) {
      result.rows.push(node.row);
      result.groupKeys.set(node.id, at.group);
    }
  }
}

/** The visible top-level rows and their leaf groups; headers and nested data rows never move. */
export function resolveGroupReorder<T extends TableRow>(
  options: { reorder?: TableReorderOptions<T> },
  view: { rows: readonly T[]; sort: { descriptors: readonly SortDescriptor[] } },
  grouped: GroupedBody<T>,
): ReorderView<T> {
  if (!grouped.isGrouped) return { rows: view.rows, reorder: options.reorder };
  if (options.reorder?.grouped !== 'within-group' || view.sort.descriptors.length > 0) {
    return { rows: view.rows, reorder: undefined };
  }
  const result: GroupedReorderRows<T> = { rows: [], groupKeys: new Map() };
  collectGroupRows(
    grouped.nodes,
    {
      expanded: grouped.expansion.expandedKeys,
      topLevel: new Set(view.rows.map((row) => row.id)),
    },
    result,
  );
  return { ...result, reorder: options.reorder };
}

/** A grouped move stays within one visible leaf group; an ordinary move has no group constraint. */
export function isWithinReorderGroup(
  groups: ReadonlyMap<Key, Key> | undefined,
  move: TableMove,
): boolean {
  if (!groups) return true;
  const target = groups.get(move.targetKey);
  return target !== undefined && move.keys.every((key) => groups.get(key) === target);
}
