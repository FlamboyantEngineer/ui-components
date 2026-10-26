import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Cell, Row, TableFooter as AriaTableFooter } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { tableHooks as hooks } from './table-hooks.js';
import { actionsColumnId, getColumnPin, getPinStyle, selectionColumnId, } from './table-structure.js';
/** The key of the summary row, kept out of row actions, selection and moves. */
export const footerRowId = 'ui-table-footer';
/**
 * React Aria numbers a tree grid's summary row among the tree's rows with a negative position,
 * which is not a valid one: the row draws without a position in the tree.
 */
function createFooterRow(isVirtualized) {
    return ({ 'aria-posinset': _position, 'aria-setsize': _size, ...props }) => isVirtualized ? (_jsx("div", { ...props })) : (_jsx("tr", { ...props }));
}
/** Whether any drawn column has a summary cell. */
export function hasTableFooter(structure) {
    return structure.columns.some((column) => column.renderFooter !== undefined);
}
/**
 * The summary row under the rows: each data column's `renderFooter` from the rows the table
 * presents, and empty cells under the selection and actions columns.
 */
export function TableFooter({ structure, rows, pinOffsets, }) {
    const strings = useUiStrings();
    const selectionPin = getColumnPin(structure, 'selection');
    const actionsPin = getColumnPin(structure, 'actions');
    return (_jsx(AriaTableFooter, { className: hooks.slotClass('footer'), children: _jsxs(Row, { id: footerRowId, textValue: strings.summary, 
            // Focusable so its content stays reachable, never selectable.
            isDisabled: true, disabledBehavior: "selection", className: hooks.slotClass('footer-row'), render: createFooterRow(structure.isVirtualized), children: [structure.hasSelection ? (_jsx(Cell, { style: getPinStyle(selectionPin, pinOffsets[selectionColumnId]), ...hooks.slot('footer-cell', { kind: 'selection', pinned: selectionPin }) })) : null, structure.columns.map((column) => {
                    const pin = getColumnPin(structure, column);
                    return (_jsx(Cell, { style: getPinStyle(pin, pinOffsets[column.id]), ...hooks.slot('footer-cell', {
                            kind: 'data',
                            align: column.align ?? 'start',
                            column: column.id,
                            pinned: pin,
                        }), children: column.renderFooter?.(rows) }, column.id));
                }), structure.hasActions ? (_jsx(Cell, { style: getPinStyle(actionsPin, pinOffsets[actionsColumnId]), ...hooks.slot('footer-cell', { kind: 'actions', pinned: actionsPin }) })) : null] }) }));
}
//# sourceMappingURL=table-footer.js.map