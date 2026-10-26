import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Cell, Collection, Row, useNumberFormatter, } from '../../primitives/index.js';
import { measuredProperty } from '../../core/hooks.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { useUiStrings } from '../../core/provider.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { aggregateCellValues, formatGroupValue, isGroupNode, } from './table-groups.js';
import { tableHooks as hooks } from './table-hooks.js';
import { TableDataRow, TableExpandButton } from './table-row.js';
import { getCellValue } from './table-rows.js';
import { actionsColumnId, getColumnPin, getPinStyle, selectionColumnId, } from './table-structure.js';
/** A column's cell in a group header row: its aggregate of the group's rows, if it has one. */
function renderAggregate(column, rows, format) {
    const { aggregate } = column;
    if (aggregate === undefined)
        return null;
    if (typeof aggregate === 'function')
        return aggregate(rows);
    const value = aggregateCellValues(rows.map((row) => getCellValue(row, column)), aggregate);
    return value === null ? null : format.format(value);
}
/** The group's heading as text: the grouping's name and the group's value. */
function useGroupHeading(group) {
    const strings = useUiStrings();
    const value = formatGroupValue(group.value);
    return strings.groupHeading(group.label, value === '' ? strings.emptyValue : value);
}
/** The group cell's content: the expand button, the label and the number of rows. */
function GroupLabel(props) {
    const strings = useUiStrings();
    const count = props.group.rows.length;
    return (_jsxs(_Fragment, { children: [_jsx(TableExpandButton, { ...props.values }), _jsx("span", { className: hooks.slotClass('group-label'), children: props.label }), _jsx("span", { className: hooks.slotClass('group-count'), "aria-hidden": "true", children: props.format.format(count) }), ' ', _jsx(VisuallyHidden, { elementType: "span", children: strings.itemCount(count) })] }));
}
/**
 * A group header row: the expand button, label and count under the first data column, the other
 * columns' aggregates, then its rows.
 */
function TableGroupRow({ id, node, model, }) {
    const strings = useUiStrings();
    const format = useNumberFormatter();
    const { group } = node;
    const { structure, pinOffsets } = model;
    const heading = useGroupHeading(group);
    const firstColumn = structure.columns[0];
    const labelPin = firstColumn ? getColumnPin(structure, firstColumn) : undefined;
    const labelStyle = ({ level }) => ({
        ...getPinStyle(labelPin, firstColumn ? pinOffsets[firstColumn.id] : undefined),
        ...measuredProperty('table-level', String(level)),
    });
    const selectionPin = getColumnPin(structure, 'selection');
    const actionsPin = getColumnPin(structure, 'actions');
    return (_jsxs(Row, { id: id, textValue: strings.labelWithCount(heading, strings.itemCount(group.rows.length)), 
        // Focusable to expand and collapse, never selectable.
        isDisabled: true, disabledBehavior: "selection", className: hooks.slotClass('group-row'), children: [structure.hasSelection ? (_jsx(Cell, { style: getPinStyle(selectionPin, pinOffsets[selectionColumnId]), ...hooks.slot('aggregate-cell', { kind: 'selection', pinned: selectionPin }) })) : null, _jsx(Cell, { style: labelStyle, ...hooks.slot('group-cell', { column: firstColumn?.id, pinned: labelPin }), children: (values) => (_jsx(GroupLabel, { values: values, group: group, label: model.renderGroupLabel?.(group) ?? heading, format: format })) }), structure.columns.slice(1).map((column) => {
                const pin = getColumnPin(structure, column);
                return (_jsx(Cell, { style: getPinStyle(pin, pinOffsets[column.id]), ...hooks.slot('aggregate-cell', {
                        kind: 'data',
                        align: column.align ?? 'start',
                        column: column.id,
                        pinned: pin,
                    }), children: renderAggregate(column, group.rows, format) }, column.id));
            }), structure.hasActions ? (_jsx(Cell, { style: getPinStyle(actionsPin, pinOffsets[actionsColumnId]), ...hooks.slot('aggregate-cell', { kind: 'actions', pinned: actionsPin }) })) : null, _jsx(Collection, { items: node.children, dependencies: [model], children: (child) => renderBodyNode(child, model) })] }));
}
/** A node of the table body: a group header row with its contents, or a row with its own. */
export function renderBodyNode(node, model) {
    return isGroupNode(node) ? (_jsx(TableGroupRow, { id: toCollectionKey(node.id), node: node, model: model })) : (_jsx(TableDataRow, { id: toCollectionKey(node.id), node: node, model: model }));
}
//# sourceMappingURL=table-group-row.js.map