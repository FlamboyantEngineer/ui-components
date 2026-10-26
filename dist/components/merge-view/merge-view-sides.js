import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo, useId } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { ScrollRegion } from '../scroll-region/scroll-region.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { mergeViewHooks as hooks } from './merge-view-hooks.js';
const markers = { unchanged: '', changed: '•', conflict: '!' };
function LineRow({ line }) {
    const strings = useUiStrings();
    return (_jsxs("tr", { ...hooks.slot('line', { change: line.change }), children: [_jsx("td", { ...hooks.slot('number'), children: _jsx("span", { "aria-hidden": "true", children: line.number }) }), _jsxs("td", { ...hooks.slot('marker'), children: [_jsx("span", { "aria-hidden": "true", children: markers[line.change] }), _jsx(VisuallyHidden, { elementType: "span", children: strings.mergeViewLine(line.change, line.number) })] }), _jsx("td", { ...hooks.slot('content'), children: line.text })] }));
}
/** A titled pane with a scrolling area, shared by the input sides and the result. */
export function MergePane({ side, label, paneRef, children }) {
    const titleId = useId();
    return (_jsxs("div", { ...hooks.slot('side', { side }), children: [_jsx("div", { id: titleId, ...hooks.slot('title'), children: label }), _jsx(ScrollRegion, { className: hooks.slotClass('pane'), axis: "both", role: "group", tabIndex: 0, "aria-labelledby": titleId, ref: paneRef, children: children })] }));
}
/**
 * One input side: a table of its lines, one body per chunk, padded with filler rows so every side
 * draws as many rows for a chunk and the sides stay level. Its props hold while the reader edits a
 * conflict's result, so typing redraws only the result pane.
 */
export const MergeSidePane = memo(function MergeSidePane({ side, label, blocks, current, paneRef, }) {
    return (_jsx(MergePane, { side: side, label: label, paneRef: paneRef, children: _jsx("table", { ...hooks.slot('table'), children: blocks.map((block) => (_jsx("tbody", { ...hooks.slot('chunk', {
                    kind: block.chunk.kind,
                    current: block.conflict !== null && block.conflict === current,
                }), children: Array.from({ length: block.rows }, (_, row) => {
                    const line = block.lines[side][row];
                    return line ? (_jsx(LineRow, { line: line }, row)) : (_jsx("tr", { "aria-hidden": "true", ...hooks.slot('filler'), children: _jsx("td", { colSpan: 3 }) }, row));
                }) }, block.index))) }) }));
});
//# sourceMappingURL=merge-view-sides.js.map