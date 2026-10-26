import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { orderColumns } from './table-columns.js';
import { TableColumnsMenu } from './table-columns-menu.js';
import { tableHooks as hooks } from './table-hooks.js';
/**
 * The controls above the grid: the search box and, when a column allows hiding, the columns menu.
 * Without either it draws nothing.
 */
export function TableToolbar({ filter, columns, layout }) {
    const hasMenu = columns.some((column) => column.allowsHiding);
    if (!filter && !hasMenu)
        return null;
    return (_jsxs("div", { ...hooks.slot('toolbar'), children: [filter, hasMenu ? (_jsx(TableColumnsMenu, { columns: orderColumns(columns, layout.layout.order), hidden: layout.layout.hidden ?? [], onHiddenChange: layout.setHidden })) : null] }));
}
//# sourceMappingURL=table-toolbar.js.map