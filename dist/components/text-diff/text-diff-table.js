import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Button } from '../button/button.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { textDiffHooks as hooks } from './text-diff-hooks.js';
const markers = { added: '+', removed: '−', unchanged: '' };
function toPublicLine({ change, oldNumber, newNumber, text }) {
    return { change, oldNumber, newNumber, text };
}
function columnCount(side) {
    return side === 'both' ? 4 : 3;
}
/** Whether a line's widget draws on this side: a split diff draws it beside its new line if any. */
function drawsWidget(line, side) {
    return side === 'both' || side === (line.newNumber === null ? 'old' : 'new');
}
function LineText({ line }) {
    const content = line.words
        ? line.words.map((part, index) => part.isChanged ? (_jsx("span", { ...hooks.slot('word'), children: part.text }, index)) : (part.text))
        : line.text;
    if (line.change === 'added')
        return _jsx("ins", { ...hooks.slot('text'), children: content });
    if (line.change === 'removed')
        return _jsx("del", { ...hooks.slot('text'), children: content });
    return _jsx("span", { ...hooks.slot('text'), children: content });
}
function NumberCell({ side, value }) {
    return (_jsx("td", { ...hooks.slot('number', { side }), children: _jsx("span", { "aria-hidden": "true", children: value }) }));
}
function LineRows({ line, side, change, options }) {
    const strings = useUiStrings();
    const widget = drawsWidget(line, side) ? options.renderLineWidget?.(toPublicLine(line)) : null;
    const label = strings.textDiffLine(line.change, side === 'new' ? null : line.oldNumber, side === 'old' ? null : line.newNumber);
    return (_jsxs(_Fragment, { children: [_jsxs("tr", { id: getRowId(options.baseId, side, line.key), tabIndex: -1, ...hooks.slot('line', {
                    change: line.change,
                    current: change !== null && change === options.current,
                }), children: [side === 'new' ? null : _jsx(NumberCell, { side: "old", value: line.oldNumber }), side === 'old' ? null : _jsx(NumberCell, { side: "new", value: line.newNumber }), _jsxs("td", { ...hooks.slot('marker'), children: [_jsx("span", { "aria-hidden": "true", children: markers[line.change] }), _jsx(VisuallyHidden, { elementType: "span", children: label })] }), _jsx("td", { ...hooks.slot('content'), children: _jsx(LineText, { line: line }) })] }), isEmptyNode(widget) ? null : (_jsx("tr", { ...hooks.slot('widget'), children: _jsx("td", { colSpan: columnCount(side), children: widget }) }))] }));
}
/** Folded unchanged lines: the new side, or the unified table, offers to show them. */
function FoldRows({ fold, side, options, }) {
    const strings = useUiStrings();
    const label = strings.textDiffShowLines(fold.count);
    return (_jsx("tr", { ...hooks.slot('fold'), children: _jsx("td", { colSpan: columnCount(side), children: side === 'old' ? (_jsx("span", { "aria-hidden": "true", children: label })) : (_jsx(Button, { variant: "ghost", size: "sm", className: hooks.slotClass('expand'), onPress: () => options.onExpand(fold), children: label })) }) }));
}
/** The id of the row that draws a line on one side. */
export function getRowId(baseId, side, key) {
    return `${baseId}-${side}-${key}`;
}
/** The id of a change's first row: its first added line in a split diff, when it adds any. */
export function getChangeRowId(baseId, block, isSplit) {
    const [removed] = block.removed;
    const [added] = block.added;
    if (!isSplit)
        return getRowId(baseId, 'both', (removed ?? added).key);
    return added ? getRowId(baseId, 'new', added.key) : getRowId(baseId, 'old', removed.key);
}
/** Both texts in one table: each change's removed lines, then its added lines. */
export function UnifiedTable({ rows, options }) {
    return (_jsx("table", { ...hooks.slot('table'), children: _jsx("tbody", { children: rows.map((row) => row.kind === 'fold' ? (_jsx(FoldRows, { fold: row, side: "both", options: options }, row.key)) : (_jsx(LineRows, { line: row.line, side: "both", change: row.change, options: options }, row.key))) }) }));
}
/** One side of a split diff; a line the other side has alone leaves an empty filler row. */
export function SplitTable({ rows, side, options, }) {
    return (_jsx("table", { ...hooks.slot('table'), children: _jsx("tbody", { children: rows.map((row) => {
                if (row.kind === 'fold') {
                    return _jsx(FoldRows, { fold: row, side: side, options: options }, row.key);
                }
                const line = row[side];
                if (!line) {
                    return (_jsx("tr", { "aria-hidden": "true", ...hooks.slot('filler'), children: _jsx("td", { colSpan: columnCount(side) }) }, row.key));
                }
                return (_jsx(LineRows, { line: line, side: side, change: row.change, options: options }, row.key));
            }) }) }));
}
//# sourceMappingURL=text-diff-table.js.map