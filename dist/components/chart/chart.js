import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useId } from 'react';
import { ToggleButton } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { ProseTable } from '../prose-table/prose-table.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { chartHooks as hooks } from './chart-hooks.js';
/** The table view: the first column names each row. */
function ChartValueTable({ table, name, }) {
    return (_jsx(ProseTable, { className: hooks.slotClass('table'), ...name, header: table.columns.map((content, index) => ({
            key: String(index),
            content,
            isRowHeader: index === 0,
        })), rows: table.rows.map((cells, row) => ({
            key: String(row),
            cells: cells.map((content, index) => ({ key: String(index), content })),
        })) }));
}
/**
 * The accessible frame of a chart: a named figure described by a text summary, with a legend, the
 * drawing, and a toggle that shows the values as a table instead. Bar, line and donut charts render
 * it around their drawings; a host wraps its own drawing in it the same way.
 */
export function Chart({ label, summary, showSummary = false, table, legend, view, defaultView = 'chart', onViewChange, children, className, 'aria-describedby': describedBy, ...rest }) {
    const strings = useUiStrings();
    const titleId = useId();
    const summaryId = useId();
    const [shown, setShown] = useControllableState(view, defaultView, onViewChange);
    const hasTitle = label != null && rest['aria-labelledby'] === undefined && !rest['aria-label'];
    const labelId = hasTitle ? titleId : rest['aria-labelledby'];
    const summaryText = (_jsx("p", { ...hooks.slot('summary'), id: summaryId, children: summary }));
    return (_jsxs("div", { ...rest, ...hooks.root({ className, data: { view: shown } }), role: "figure", "aria-labelledby": labelId, "aria-describedby": describedBy ? `${summaryId} ${describedBy}` : summaryId, children: [_jsxs("div", { ...hooks.slot('header'), children: [label != null ? (_jsx("span", { ...hooks.slot('title'), id: titleId, children: label })) : null, _jsxs(ToggleButton, { className: hooks.slotClass('view-toggle'), isSelected: shown === 'table', onChange: (isSelected) => setShown(isSelected ? 'table' : 'chart'), children: [_jsx(Glyph, { name: "table" }), strings.showAsTable] })] }), showSummary ? summaryText : _jsx(VisuallyHidden, { children: summaryText }), shown === 'table' ? (_jsx(ChartValueTable, { table: table, name: labelId ? { 'aria-labelledby': labelId } : { 'aria-label': rest['aria-label'] } })) : (_jsxs(_Fragment, { children: [legend, _jsx("div", { ...hooks.slot('body'), children: children })] }))] }));
}
//# sourceMappingURL=chart.js.map