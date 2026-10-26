import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useLocale } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import { useUiStrings } from '../../core/provider.js';
import { pivot } from '../../utils/pivot.js';
import { Table } from '../table/table.js';
import { createPivotColumns } from './pivot-columns.js';
import { PivotFieldChooser } from './pivot-field-chooser.js';
import { pivotTableHooks as hooks } from './pivot-table-hooks.js';
const emptyLayout = { rows: [], columns: [], values: [] };
// The table encodes its row keys itself, so group keys that hold spaces stay distinct.
function toTableRow(group, order) {
    return { id: group.key, group, order };
}
/**
 * A pivot of plain records: rows grouped by row fields in expandable groups, columns by column
 * fields, cells aggregating value fields, with row and column totals and sortable columns, drawn
 * as a `Table`. An optional field chooser moves fields between rows, columns and values.
 */
export function PivotTable({ records, fields, layout, defaultLayout, onLayoutChange, fieldChooser = false, expandedKeys, defaultExpandedKeys, onExpandedChange, className, id, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, 'aria-describedby': ariaDescribedBy, 'aria-details': ariaDetails, ...rest }) {
    const strings = useUiStrings();
    const { locale } = useLocale();
    const [current, setCurrent] = useControllableState(layout, defaultLayout ?? emptyLayout, onLayoutChange);
    const result = useMemo(() => pivot(records, current), [records, current]);
    const { columns, groups } = createPivotColumns({
        result,
        layout: current,
        fields,
        strings,
        locale,
    });
    const rows = current.rows.length > 0
        ? result.rows.map(toTableRow)
        : [{ id: 'total', group: null, order: 0 }];
    return (_jsxs("div", { ...hooks.root({ className, props: rest }), id: id, children: [fieldChooser ? (_jsx(PivotFieldChooser, { fields: fields, layout: current, onLayoutChange: setCurrent })) : null, _jsx(Table, { className: hooks.slotClass('table'), "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy, "aria-describedby": ariaDescribedBy, "aria-details": ariaDetails, columns: columns, columnGroups: groups, rows: rows, getChildRows: current.rows.length > 1 ? (row) => row.group?.children.map(toTableRow) : undefined, expandedKeys: expandedKeys, defaultExpandedKeys: defaultExpandedKeys, onExpandedChange: onExpandedChange })] }));
}
//# sourceMappingURL=pivot-table.js.map