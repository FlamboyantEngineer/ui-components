import { useMemo } from 'react';
import type { ExpansionProps } from '../../core/events.js';
import {
  groupTableNodes,
  listGroupKeys,
  resolveGroupings,
  type TableBodyNode,
} from './table-groups.js';
import type { TableColumn, TableRow } from './table-rows.js';
import {
  useTableExpansion,
  type TableExpansion,
  type TableGroupingProps,
} from './use-table-expansion.js';
import type { TableRowsView } from './use-table-rows.js';

interface TableGroupingOptions<T> extends TableGroupingProps<T>, ExpansionProps {
  /** Every column, drawn or hidden, which `groupBy` may name. */
  columns: readonly TableColumn<T>[];
}

/** The table body's nodes, grouped or not, and the expansion of its rows and groups. */
export interface TableGroupedBody<T> {
  nodes: readonly TableBodyNode<T>[];
  isGrouped: boolean;
  expansion: TableExpansion;
}

/**
 * Groups the rows of the current page with `groupBy` once they are filtered and sorted, ordering
 * groups by the table's sort of their column, and tracks which rows and groups are expanded.
 */
export function useTableGrouping<T extends TableRow>(
  options: TableGroupingOptions<T>,
  view: Pick<TableRowsView<T>, 'nodes' | 'sort'>,
): TableGroupedBody<T> {
  const { groupBy, columns } = options;
  const descriptors = view.sort.descriptors;
  const nodes = useMemo(() => {
    const groupings = resolveGroupings(groupBy ?? [], columns, descriptors);
    return groupings.length > 0 ? groupTableNodes(view.nodes, groupings) : view.nodes;
  }, [groupBy, columns, descriptors, view.nodes]);
  const groupKeys = useMemo(() => listGroupKeys(nodes), [nodes]);
  const expansion = useTableExpansion(options, groupKeys);
  return { nodes, isGrouped: groupKeys.length > 0, expansion };
}
