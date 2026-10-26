import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createHooks, dataAttributes } from '../../core/hooks.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
const hooks = createHooks('prose-table', ['caption']);
function ProseTableBodyCell({ column, children, }) {
    const data = dataAttributes({ align: column?.align });
    if (column?.isRowHeader) {
        return (_jsx("th", { ...data, scope: "row", children: children }));
    }
    return _jsx("td", { ...data, children: children });
}
function renderRows(rows, header) {
    return rows.map((row) => (_jsxs("tr", { children: [row.cells.map((cell, index) => (_jsx(ProseTableBodyCell, { column: header[index], children: cell.content }, cell.key))), header.slice(row.cells.length).map((column) => (_jsx(ProseTableBodyCell, { column: column }, `missing:${column.key}`)))] }, row.key)));
}
/** A static table inside running text: column headings, body and footer rows, nothing interactive. */
export function ProseTable({ header, rows, footer, caption, stickyHeader = false, className, ...rest }) {
    return (_jsxs("table", { ...rest, ...hooks.root({ className, data: { stickyHeader } }), children: [isEmptyNode(caption) ? null : _jsx("caption", { ...hooks.slot('caption'), children: caption }), _jsx("thead", { children: _jsx("tr", { children: header.map((column) => (_jsx("th", { ...dataAttributes({ align: column.align }), scope: "col", children: column.content }, column.key))) }) }), _jsx("tbody", { children: renderRows(rows, header) }), footer && footer.length > 0 ? _jsx("tfoot", { children: renderRows(footer, header) }) : null] }));
}
//# sourceMappingURL=prose-table.js.map