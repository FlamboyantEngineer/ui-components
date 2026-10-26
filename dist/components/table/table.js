import { createElement as _createElement } from "react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ResizableTableContainer, Table as AriaTable, TableLayout, useDragAndDrop, Virtualizer, } from '../../primitives/index.js';
import { splitDataAttributes } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { Pagination } from '../pagination/pagination.js';
import { TableBody } from './table-body.js';
import { TableSelectionBar } from './table-bulk-edit.js';
import { TableColumnFilter } from './table-column-filter.js';
import { getColumnText } from './table-column.js';
import { TableSearch } from './table-search.js';
import { isEmptyFilterValue, setColumnFilter } from './table-filters.js';
import { hasTableFooter, TableFooter } from './table-footer.js';
import { hasGroupRow, renderTableWithTracks, TableHeader, } from './table-header.js';
import { tableHooks as hooks } from './table-hooks.js';
import { TableToolbar } from './table-toolbar.js';
import { useTableGrid } from './use-table-grid.js';
const virtualRowHeights = { md: 40, sm: 32 };
/** What the header row shows, from the grid and the table's own props. */
function createHeaderModel(grid, options) {
    const { view } = grid;
    const values = view.filter.columns ?? {};
    return {
        widths: grid.widths.widths,
        groups: options.columnGroups ?? [],
        pinOffsets: grid.pinOffsets,
        onPinOffsets: grid.onPinOffsets,
        sort: view.sort.descriptors,
        isMultipleSort: view.sort.isMultiple,
        dropTarget: grid.columnReorder.dropTarget,
        isFiltered: (column) => !isEmptyFilterValue(values[column.id]),
        renderFilter: (column) => column.filter ? (_jsx(TableColumnFilter, { column: column, label: getColumnText(column), value: values[column.id], rows: options.rows, onChange: (value) => view.onFilterChange(setColumnFilter(view.filter, column.id, value)) })) : null,
    };
}
function TableGridElement({ grid, options, }) {
    const { ariaProps, view, reordering, onRowAction, body, structure } = grid;
    const header = createHeaderModel(grid, options);
    const { dragAndDropHooks } = useDragAndDrop(grid.dragAndDrop);
    return (_createElement(AriaTable, { ...ariaProps, 
        // React Aria keeps drag and drop hooks for a table's lifetime: remount when reorder toggles.
        key: reordering ? 'reorder' : 'static', className: hooks.slotClass('grid'), render: hasGroupRow(structure, header.groups) ? renderTableWithTracks : undefined, treeColumn: structure.treeColumn === null ? undefined : toCollectionKey(structure.treeColumn), sortDescriptor: view.sort.descriptors[0] && {
            ...view.sort.descriptors[0],
            column: toCollectionKey(String(view.sort.descriptors[0].column)),
        }, onSortChange: (descriptor) => view.sort.onSortChange({ ...descriptor, column: fromCollectionKey(descriptor.column) }), onRowAction: onRowAction, dragAndDropHooks: reordering ? dragAndDropHooks : undefined },
        _jsx(TableHeader, { structure: structure, model: header }),
        _jsx(TableBody, { ...body }),
        body.status === null && hasTableFooter(structure) ? (_jsx(TableFooter, { structure: structure, rows: view.presentedRows, pinOffsets: grid.pinOffsets })) : null));
}
/**
 * A data table on React Aria's Table: columns and rows as plain data with render callbacks;
 * sorting by one or several columns; a search box and column filters; selection with a selection
 * bar and bulk edit; resizable, reorderable, hideable, pinned and grouped columns; row groups with
 * aggregates; nested and detail rows; cell editing and a spreadsheet mode; a summary row; row
 * reordering; pagination, loading more and virtualization; and loading, empty and error notices.
 */
export function Table({ size = 'md', stickyHeader, rowHeight, filterable, filterLabel, className, id, ...rest }) {
    const strings = useUiStrings();
    const [dataAttributes, gridProps] = splitDataAttributes(rest);
    const grid = useTableGrid(gridProps);
    const { view, layout } = grid;
    const { virtualized } = rest;
    const height = rowHeight ?? virtualRowHeights[size];
    const element = _jsx(TableGridElement, { grid: grid, options: rest });
    const label = rest['aria-label'];
    return (_jsxs("div", { ...grid.rootProps, ...hooks.root({
            className,
            props: dataAttributes,
            data: { size, stickyHeader, virtualized },
        }), id: id, "aria-busy": grid.body.status === 'loading' || undefined, children: [_jsx(TableToolbar, { filter: filterable ? (_jsx(TableSearch, { label: filterLabel ?? strings.filterRows, value: view.filter.query ?? '', onChange: (query) => view.onFilterChange({ ...view.filter, query }) })) : null, columns: rest.columns, layout: layout }), grid.selectionBar ? _jsx(TableSelectionBar, { ...grid.selectionBar }) : null, _jsx(ResizableTableContainer, { className: hooks.slotClass('scroll'), onResize: grid.widths.onResize, onResizeEnd: grid.widths.onResizeEnd, children: virtualized ? (_jsx(Virtualizer, { layout: TableLayout, layoutOptions: { rowHeight: height, headingHeight: height }, children: element })) : (element) }), view.pages ? (_jsx(Pagination, { className: hooks.slotClass('pagination'), "aria-label": label ? strings.paginationOf(label) : undefined, pageCount: view.pages.pageCount, page: view.pages.page, onPageChange: view.pages.onPageChange })) : null] }));
}
//# sourceMappingURL=table.js.map