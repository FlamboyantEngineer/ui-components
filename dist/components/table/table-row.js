import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Button as AriaButton, Cell, Collection, Row, } from '../../primitives/index.js';
import { measuredProperty, pickDataAttributes } from '../../core/hooks.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { DragHandle } from '../drag-handle/drag-handle.js';
import { useExpandGlyph } from '../expand-toggle/expand-toggle.js';
import { Icon } from '../icon/icon.js';
import { TableCellEditorView } from './table-cell-editor.js';
import { TableCheckbox } from './table-header.js';
import { tableHooks as hooks } from './table-hooks.js';
import { getCellValue, getRowText } from './table-rows.js';
import { actionsColumnId, countTableColumns, getColumnPin, getPinStyle, getRowHeaderColumns, selectionColumnId, } from './table-structure.js';
import { placeInBounds } from './table-cell-range.js';
import { isEditingCell } from './use-cell-editing.js';
/** A row's caller attributes: `false` leaves an attribute out, unlike a root `data-*` prop. */
function toRowAttributes(attributes) {
    const shown = Object.entries(attributes ?? {}).filter(([, value]) => value !== false);
    return pickDataAttributes(Object.fromEntries(shown));
}
/** Cell elements marked selected for assistive technology, inside a range of selected cells. */
const selectedCells = {
    td: (props) => (_jsx("td", { ...props, "aria-selected": "true" })),
    div: (props) => (_jsx("div", { ...props, "aria-selected": "true" })),
};
/** The key prefix of detail rows, kept out of row actions, selection and moves. */
export const detailRowPrefix = 'ui-table-detail:';
function renderCellContent(row, column) {
    if (column.renderCell)
        return column.renderCell(row);
    const value = getCellValue(row, column);
    return typeof value === 'string' || typeof value === 'number' ? value : null;
}
/** A row element without React Aria's `draggable`, so only its handle starts a pointer drag. */
function createHandleRow(isVirtualized) {
    return ({ draggable: _draggable, ...props }) => isVirtualized ? (_jsx("div", { ...props })) : (_jsx("tr", { ...props }));
}
/**
 * The expand button of a row with child or detail rows, named by React Aria after the row
 * (`Expand <row>`, `Collapse <row>`), or a spacer holding its place.
 */
export function TableExpandButton({ hasChildItems, isExpanded, }) {
    const glyph = useExpandGlyph(isExpanded);
    if (!hasChildItems)
        return _jsx("span", { ...hooks.slot('expand-spacer'), "aria-hidden": "true" });
    return (_jsx(AriaButton, { slot: "chevron", className: hooks.slotClass('expand'), children: _jsx(Icon, { glyph: glyph, size: "sm" }) }));
}
/** Where a cell sits in spreadsheet mode's selected cells and in a dragged fill. */
function describeRangeCell(view, row, column) {
    const at = {
        row: view?.grid.rowIndex.get(toCollectionKey(row.id)) ?? -1,
        column: view?.grid.columnIndex.get(column.id) ?? -1,
    };
    const place = placeInBounds(view?.bounds ?? null, at);
    const isFillTarget = !place.isInRange && placeInBounds(view?.fillBounds ?? null, at).isInRange;
    const hasFillHandle = view?.mode === 'range' && view.canFill && place.isCorner;
    return { ...place, isFillTarget, hasFillHandle };
}
function TableDataCell(props) {
    const { row, column, isFirst, model } = props;
    const pin = getColumnPin(model.structure, column);
    const pinStyle = getPinStyle(pin, model.pinOffsets[column.id]);
    const isTree = model.structure.treeColumn === column.id;
    const isEditing = isEditingCell(model.editing.editing, row, column.id);
    const range = describeRangeCell(model.cells, row, column);
    const style = isTree
        ? ({ level }) => ({
            ...pinStyle,
            ...measuredProperty('table-level', String(level)),
        })
        : pinStyle;
    return (_jsx(Cell, { style: style, render: range.isInRange ? selectedCells[model.structure.isVirtualized ? 'div' : 'td'] : undefined, ...hooks.slot('cell', {
            kind: 'data',
            align: column.align ?? 'start',
            column: column.id,
            pinned: pin,
            editing: isEditing,
            inRange: range.isInRange,
            rangeTop: range.isTop,
            rangeBottom: range.isBottom,
            rangeStart: range.isStart,
            rangeEnd: range.isEnd,
            fillTarget: range.isFillTarget,
        }), children: (values) => (_jsxs(_Fragment, { children: [model.isReorderable && isFirst ? (_jsx(DragHandle, { className: hooks.slotClass('drag-handle'), isDisabled: !model.isMovable(row) })) : null, isTree ? _jsx(TableExpandButton, { ...values }) : null, isEditing ? (_jsx(TableCellEditorView, { row: row, column: column, editing: model.editing, movesOnCommit: model.cells !== null })) : (renderCellContent(row, column)), range.hasFillHandle ? (_jsx("span", { className: hooks.slotClass('fill-handle'), "aria-hidden": "true" })) : null] })) }));
}
/** A full-width row under its parent, holding the parent's detail content. */
function TableDetailRow(props) {
    const { row, model } = props;
    return (_jsx(Row, { id: `${detailRowPrefix}${toCollectionKey(row.id)}`, textValue: getRowText(row, getRowHeaderColumns(model.structure.columns)), 
        // Focusable so controls in the detail stay reachable, never selectable.
        isDisabled: true, disabledBehavior: "selection", className: hooks.slotClass('detail-row'), children: _jsx(Cell, { colSpan: countTableColumns(model.structure), className: hooks.slotClass('detail-cell'), children: props.children }) }));
}
/** One row with its cells, then its detail row and its child rows. */
export function TableDataRow({ id, node, model, }) {
    const { row } = node;
    const { structure, renderRowActions } = model;
    const detail = model.renderRowDetail?.(row);
    const selectionPin = getColumnPin(structure, 'selection');
    const actionsPin = getColumnPin(structure, 'actions');
    return (_jsxs(Row, { ...toRowAttributes(model.getRowAttributes?.(row)), id: id, textValue: getRowText(row, getRowHeaderColumns(structure.columns)), ...hooks.slot('row'), render: model.dragTrigger === 'handle' ? createHandleRow(structure.isVirtualized) : undefined, children: [structure.hasSelection ? (_jsx(Cell, { style: getPinStyle(selectionPin, model.pinOffsets[selectionColumnId]), ...hooks.slot('cell', { kind: 'selection', pinned: selectionPin }), children: _jsx(TableCheckbox, {}) })) : null, structure.columns.map((column, index) => (_jsx(TableDataCell, { row: row, column: column, isFirst: index === 0, model: model }, column.id))), structure.hasActions && renderRowActions ? (_jsx(Cell, { style: getPinStyle(actionsPin, model.pinOffsets[actionsColumnId]), ...hooks.slot('cell', { kind: 'actions', pinned: actionsPin }), children: renderRowActions(row) })) : null, isEmptyNode(detail) ? null : (_jsx(TableDetailRow, { row: row, model: model, children: detail })), node.children.length > 0 ? (_jsx(Collection, { items: node.children, dependencies: [model], children: (child) => _jsx(TableDataRow, { id: toCollectionKey(child.id), node: child, model: model }) })) : null] }));
}
//# sourceMappingURL=table-row.js.map