import { useMemo } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { clamp } from '../../utils/clamp.js';
import { createRowMatcher } from './table-filters.js';
import { createRowComparator } from './table-sort.js';
import { buildTableNodes, filterTableNodes, sortTableNodes, } from './table-tree.js';
import { useTableSort } from './use-table-sort.js';
/** The current page of `total` top-level rows, and the range of them it shows when the table cuts. */
function resolvePages(pagination, requested, total) {
    const size = Math.max(1, Math.floor(pagination?.pageSize ?? 1));
    const pageCount = Math.max(1, Math.ceil((pagination?.rowCount ?? total) / size));
    const page = clamp(requested, 1, pageCount);
    // Rows paged by the caller arrive as the current page.
    const isCut = pagination !== undefined && pagination.rowCount === undefined;
    return {
        page,
        pageCount,
        start: isCut ? (page - 1) * size : 0,
        end: isCut ? page * size : total,
    };
}
/**
 * The rows a table presents: built into nested nodes, filtered and sorted by the table unless the
 * caller controls the filter or the sort, then cut to the current page.
 */
export function useTableRows(options) {
    const { rows, columns, getChildRows, pagination } = options;
    const [filter, setFilter] = useControllableState(options.filter, options.defaultFilter ?? {}, options.onFilterChange);
    const isFilterOwned = options.filter === undefined;
    const [requestedPage, setPage] = useControllableState(pagination?.page, pagination?.defaultPage ?? 1, pagination?.onPageChange);
    const resetPage = () => {
        if (pagination && requestedPage !== 1)
            setPage(1);
    };
    const sort = useTableSort(options, resetPage);
    const presented = useMemo(() => {
        const nodes = buildTableNodes(rows, getChildRows);
        const matches = isFilterOwned ? createRowMatcher(columns, filter) : null;
        const filtered = matches ? filterTableNodes(nodes, matches) : nodes;
        const compare = sort.isControlled ? null : createRowComparator(columns, sort.descriptors);
        return compare ? sortTableNodes(filtered, compare) : filtered;
    }, [rows, getChildRows, columns, filter, isFilterOwned, sort.isControlled, sort.descriptors]);
    const { page, pageCount, start, end } = resolvePages(pagination, requestedPage, presented.length);
    const nodes = useMemo(() => presented.slice(start, end), [presented, start, end]);
    const pageRows = useMemo(() => nodes.map((node) => node.row), [nodes]);
    const presentedRows = useMemo(() => presented.map((node) => node.row), [presented]);
    return {
        nodes,
        rows: pageRows,
        presentedRows,
        presentedNodes: presented,
        sort,
        filter,
        onFilterChange: (next) => {
            setFilter(next);
            resetPage();
        },
        pages: pagination ? { page, pageCount, onPageChange: setPage } : null,
    };
}
//# sourceMappingURL=use-table-rows.js.map