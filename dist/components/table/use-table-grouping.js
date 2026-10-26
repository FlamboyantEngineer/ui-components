import { useMemo } from 'react';
import { walkTree } from '../../utils/walk-tree.js';
import { groupTableNodes, listGroupKeys, resolveGroupings, } from './table-groups.js';
import { useTableExpansion, } from './use-table-expansion.js';
/**
 * Groups the rows of the current page with `groupBy` once they are filtered and sorted, ordering
 * groups by the table's sort of their column, and tracks which rows and groups are expanded.
 */
export function useTableGrouping(options, view) {
    const { groupBy, columns, rows, getChildRows } = options;
    const descriptors = view.sort.descriptors;
    const nodes = useMemo(() => {
        const groupings = resolveGroupings(groupBy ?? [], columns, descriptors);
        if (groupings.length === 0)
            return view.nodes;
        const reserved = Array.from(walkTree(rows, (row) => getChildRows?.(row) ?? undefined), (row) => row.id);
        return groupTableNodes(view.nodes, groupings, reserved);
    }, [groupBy, columns, descriptors, view.nodes, rows, getChildRows]);
    const groupKeys = useMemo(() => listGroupKeys(nodes), [nodes]);
    const expansion = useTableExpansion(options, groupKeys);
    return { nodes, isGrouped: groupKeys.length > 0, expansion };
}
//# sourceMappingURL=use-table-grouping.js.map