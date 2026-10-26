import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Column, ColumnResizer } from '../../primitives/index.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { useUiStrings } from '../../core/provider.js';
import { Icon } from '../icon/icon.js';
import { getColumnBounds } from './column-sizing.js';
import { tableHooks as hooks } from './table-hooks.js';
import { getPinStyle } from './table-structure.js';
const sortGlyphs = {
    ascending: 'sort-ascending',
    descending: 'sort-descending',
    none: 'sort-none',
};
/** The accessible name of a column. */
export function getColumnText(column) {
    if (column.textValue)
        return column.textValue;
    const { header } = column;
    return typeof header === 'string' || typeof header === 'number' ? String(header) : column.id;
}
/**
 * One data column header: its label, which drags a reorderable column, the sort glyph, the filter
 * button and the resizer, with its pin, sort, filter and drop states.
 */
export function DataColumn({ column, state, }) {
    const strings = useUiStrings();
    const hasControls = column.allowsResizing === true || state.filter !== null;
    return (_jsxs(Column, { id: toCollectionKey(column.id), textValue: getColumnText(column), isRowHeader: state.isRowHeader, allowsSorting: column.allowsSorting, width: state.width, ...getColumnBounds(column), 
        // Focusable children: focus the header itself so Enter still sorts.
        focusMode: hasControls ? 'cell' : undefined, style: getPinStyle(state.pin, state.pinOffset), ...hooks.slot('column', {
            kind: 'data',
            align: column.align ?? 'start',
            column: column.id,
            pinned: state.pin,
            sortPriority: state.sortPriority,
            filtered: state.isFiltered,
            dropPosition: state.dropPosition,
            allowsReordering: column.allowsReordering,
        }), children: [_jsx("span", { ...hooks.slot('column-label'), draggable: column.allowsReordering || undefined, children: column.header }), column.allowsSorting ? (_jsx(Icon, { glyph: sortGlyphs[state.sortDirection ?? 'none'], size: "sm", className: hooks.slotClass('sort-icon') })) : null, state.filter, column.allowsResizing ? (_jsx(ColumnResizer, { className: hooks.slotClass('resizer'), "aria-label": strings.resize })) : null, state.probe] }));
}
//# sourceMappingURL=table-column.js.map