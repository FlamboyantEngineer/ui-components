import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { useContext, useLayoutEffect } from 'react';
import { Checkbox as AriaCheckbox, Column, TableColumnResizeStateContext, TableHeader as AriaTableHeader, TableStateContext, } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { Icon } from '../icon/icon.js';
import { resolveColumnWidth } from './column-sizing.js';
import { DataColumn } from './table-column.js';
import { groupColumnCells } from './table-columns.js';
import { tableHooks as hooks } from './table-hooks.js';
import { actionsColumnId, getColumnPin, getPinStyle, getRowHeaderColumns, selectionColumnId, } from './table-structure.js';
import { computePinOffsets } from './use-pinned-offsets.js';
const selectionColumnWidth = 44;
/** The pin of every drawn column, fixed ones included, by column key. */
function collectPins(structure) {
    const pins = {
        [selectionColumnId]: getColumnPin(structure, 'selection'),
        [actionsColumnId]: getColumnPin(structure, 'actions'),
    };
    for (const column of structure.columns)
        pins[column.id] = getColumnPin(structure, column);
    return pins;
}
/**
 * Reports the pinned offsets from React Aria's column widths. It renders inside the header, so it
 * follows every layout React Aria draws, live during a resize.
 */
function PinnedOffsetsProbe({ pins, onMeasure, }) {
    const state = useContext(TableStateContext);
    const layout = useContext(TableColumnResizeStateContext);
    const offsets = computePinOffsets((state?.collection.columns ?? []).map((column) => ({
        key: String(fromCollectionKey(column.key)),
        width: layout?.getColumnWidth(column.key) ?? 0,
        pin: pins[String(fromCollectionKey(column.key))],
    })));
    useLayoutEffect(() => onMeasure(offsets));
    return null;
}
function FixedColumn({ id, kind, width, pin, pinOffset, children, }) {
    return (_jsx(Column, { id: id, width: width, minWidth: width, maxWidth: width, style: getPinStyle(pin, pinOffset), ...hooks.slot('column', { kind, pinned: pin }), children: children }));
}
/** The selection checkbox of a row, or the select-all checkbox of the header. */
export function TableCheckbox() {
    return (_jsx(AriaCheckbox, { slot: "selection", className: hooks.slotClass('checkbox'), children: ({ isSelected, isIndeterminate }) => {
            const glyph = isIndeterminate ? 'minus' : isSelected ? 'check' : null;
            return (_jsx("span", { ...hooks.slot('checkbox-box'), children: glyph ? _jsx(Icon, { glyph: glyph, size: "sm" }) : null }));
        } }));
}
/** What one data column header shows, from the header model. */
function getHeaderState(column, { structure, model }) {
    const pin = getColumnPin(structure, column);
    const sortIndex = model.sort.findIndex((descriptor) => descriptor.column === column.id);
    const isDropTarget = model.dropTarget?.id === column.id;
    return {
        width: resolveColumnWidth(column, model.widths[column.id]),
        isRowHeader: getRowHeaderColumns(structure.columns).includes(column),
        pin,
        pinOffset: pin ? model.pinOffsets[column.id] : undefined,
        sortDirection: model.sort[sortIndex]?.direction,
        sortPriority: model.isMultipleSort && sortIndex !== -1 ? sortIndex + 1 : undefined,
        dropPosition: isDropTarget ? model.dropTarget?.position : undefined,
        isFiltered: model.isFiltered(column),
        filter: model.renderFilter(column),
        probe: null,
    };
}
/** Whether the header draws a group row: groups exist and the table is not virtualized. */
export function hasGroupRow(structure, groups) {
    return groups.length > 0 && !structure.isVirtualized;
}
/**
 * The widths of React Aria's columns as layout tracks. A fixed table layout takes its column widths
 * from its first row, which a group row would otherwise decide.
 */
function TableColumnTracks() {
    const state = useContext(TableStateContext);
    const layout = useContext(TableColumnResizeStateContext);
    return (_jsx("colgroup", { children: (state?.collection.columns ?? []).map((column) => (_jsx("col", { style: { width: layout?.getColumnWidth(column.key) } }, toKeyIdentity(column.key)))) }));
}
/** The grid's `table` element with column tracks first, for a table with a group row. */
export function renderTableWithTracks(props) {
    // Groups draw only in a table element, so the props are a `table`'s.
    return (_jsxs("table", { ...props, children: [_jsx(TableColumnTracks, {}), props.children] }));
}
/** A header element that draws the group header row above React Aria's column row. */
function createGroupedHeader({ structure, model }) {
    const cells = groupColumnCells(structure.columns, model.groups, {
        leading: Number(structure.hasSelection),
        trailing: Number(structure.hasActions),
    });
    // Groups draw only in a table element, so the props are a `thead`'s.
    return (props) => (_jsxs("thead", { ...props, children: [_jsx("tr", { role: "row", children: cells.map(({ key, group, span }) => group ? (_jsx("th", { role: "columnheader", scope: "colgroup", colSpan: span, className: hooks.slotClass('column-group'), children: group.header }, key)) : (_jsx("td", { colSpan: span, "aria-hidden": "true", ...hooks.slot('column-group', { ungrouped: true }) }, key))) }), props.children] }));
}
/**
 * The header: an optional row of group headers, then the select-all checkbox, the data columns and
 * the actions column. A virtualized table positions its header rows itself and draws no groups.
 */
export function TableHeader(props) {
    const strings = useUiStrings();
    const { structure, model } = props;
    const hasGroups = hasGroupRow(structure, model.groups);
    const selectionPin = getColumnPin(structure, 'selection');
    const actionsPin = getColumnPin(structure, 'actions');
    const pins = collectPins(structure);
    const probe = Object.values(pins).some(Boolean) ? (_jsx(PinnedOffsetsProbe, { pins: pins, onMeasure: model.onPinOffsets })) : null;
    return (_jsxs(AriaTableHeader, { className: hooks.slotClass('header'), render: hasGroups ? createGroupedHeader(props) : undefined, children: [structure.hasSelection ? (_jsx(FixedColumn, { id: selectionColumnId, kind: "selection", width: selectionColumnWidth, pin: selectionPin, pinOffset: model.pinOffsets[selectionColumnId], children: _jsx(TableCheckbox, {}) })) : null, structure.columns.map((column, index) => (_jsx(DataColumn, { column: column, state: { ...getHeaderState(column, props), probe: index === 0 ? probe : null } }, column.id))), structure.hasActions ? (_jsx(FixedColumn, { id: actionsColumnId, kind: "actions", width: structure.actionsColumnWidth, pin: actionsPin, pinOffset: model.pinOffsets[actionsColumnId], children: _jsx("span", { ...hooks.slot('column-label'), children: strings.rowActions }) })) : null] }));
}
//# sourceMappingURL=table-header.js.map