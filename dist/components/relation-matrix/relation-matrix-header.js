import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { useUiStrings } from '../../core/provider.js';
import { TruncationTooltip } from '../truncation-tooltip/truncation-tooltip.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { relationMatrixHooks as hooks } from './relation-matrix-hooks.js';
/** A count shown as digits and read as the provider's `relationCount` text. */
export function RelationCount({ count, slot, }) {
    const strings = useUiStrings();
    return (_jsxs("span", { ...hooks.slot(slot), children: [_jsx("span", { "aria-hidden": "true", children: count }), _jsx(VisuallyHidden, { elementType: "span", children: strings.relationCount(count) })] }));
}
/**
 * The header row, pinned to the top of the matrix: the corner header naming the row headers,
 * pinned to its start, then one column header per rendered column with its label (cut or rotated
 * by the stylesheet, shown whole in a tooltip when cut) and its relation count.
 */
export function RelationMatrixHeader({ headerRef, cornerRef, columns, indices, tracks, index, rowsLabel, focus, isFocusWithin, }) {
    return (_jsxs("div", { ref: headerRef, role: "row", "aria-rowindex": 1, ...hooks.slot('header'), style: {
            position: 'sticky',
            top: 0,
            zIndex: 2,
            width: 'max-content',
            gridTemplateColumns: tracks.template,
        }, children: [_jsx("div", { ref: cornerRef, role: "columnheader", "aria-colindex": 1, tabIndex: focus.row === -1 && focus.column === -1 ? 0 : -1, ...hooks.slot('corner'), style: { position: 'sticky', insetInlineStart: 0, zIndex: 1, gridColumn: 1 }, children: rowsLabel }), indices.map((columnIndex) => {
                const column = columns[columnIndex];
                const count = index.countColumn(column.id);
                const isFocused = focus.row === -1 && focus.column === columnIndex;
                const isCurrent = isFocusWithin && focus.column === columnIndex;
                return (_jsxs("div", { role: "columnheader", "aria-colindex": columnIndex + 2, tabIndex: isFocused ? 0 : -1, ...hooks.slot('column', { uncovered: count === 0, current: isCurrent }), style: { gridColumn: tracks.lines.get(columnIndex) }, children: [_jsx(TruncationTooltip, { className: hooks.slotClass('column-label'), children: column.label }), ' ', _jsx(RelationCount, { count: count, slot: "column-count" })] }, toKeyIdentity(column.id)));
            })] }));
}
//# sourceMappingURL=relation-matrix-header.js.map