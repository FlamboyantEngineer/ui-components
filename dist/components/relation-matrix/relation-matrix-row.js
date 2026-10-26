import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { RelationCount } from './relation-matrix-header.js';
import { relationMatrixHooks as hooks } from './relation-matrix-hooks.js';
/** A related cell's mark: a glyph, read as its kind's label (or the provider's `related` text). */
function RelationMark({ label }) {
    return (_jsxs("span", { ...hooks.slot('mark'), children: [_jsx(Glyph, { name: "check" }), _jsx(VisuallyHidden, { elementType: "span", children: label })] }));
}
function RelationMatrixCell({ relation, position, gridColumn, context }) {
    const strings = useUiStrings();
    const kind = relation?.kind === undefined ? undefined : context.kinds.get(relation.kind);
    const isFocused = context.focus.row === position.row && context.focus.column === position.column;
    const tone = relation ? (kind?.tone ?? 'neutral') : undefined;
    return (_jsx("div", { role: "gridcell", "aria-colindex": position.column + 2, tabIndex: isFocused ? 0 : -1, ...hooks.slot('cell', { related: Boolean(relation), kind: relation?.kind, tone }), style: { gridColumn }, onClick: context.isActionable ? () => context.onCellPress(position) : undefined, children: relation ? _jsx(RelationMark, { label: kind?.label ?? strings.related }) : null }));
}
function rowStyle(context, rowIndex) {
    const style = {
        width: 'max-content',
        gridTemplateColumns: context.tracks.template,
    };
    if (!context.virtualized)
        return style;
    return {
        ...style,
        position: 'absolute',
        top: rowIndex * context.rowHeight,
        insetInlineStart: 0,
        height: context.rowHeight,
    };
}
/**
 * One row of the matrix: its row header (label and relation count), pinned to the start, then a
 * cell per rendered column, marked when its row and column items are related.
 */
export function RelationMatrixRow({ row, rowIndex, context }) {
    const { columns, indices, tracks, index, focus, isFocusWithin } = context;
    const count = index.countRow(row.id);
    const isHeaderFocused = focus.row === rowIndex && focus.column === -1;
    return (_jsxs("div", { role: "row", "aria-rowindex": rowIndex + 2, ...hooks.slot('row', { uncovered: count === 0 }), style: rowStyle(context, rowIndex), children: [_jsxs("div", { role: "rowheader", "aria-colindex": 1, tabIndex: isHeaderFocused ? 0 : -1, ...hooks.slot('row-header', {
                    uncovered: count === 0,
                    current: isFocusWithin && focus.row === rowIndex,
                }), style: { position: 'sticky', insetInlineStart: 0, zIndex: 1, gridColumn: 1 }, children: [_jsx("span", { ...hooks.slot('row-label'), children: row.label }), ' ', _jsx(RelationCount, { count: count, slot: "row-count" })] }), indices.map((columnIndex) => {
                const column = columns[columnIndex];
                return (_jsx(RelationMatrixCell, { relation: index.get(row.id, column.id), position: { row: rowIndex, column: columnIndex }, gridColumn: tracks.lines.get(columnIndex), context: context }, toKeyIdentity(column.id)));
            })] }));
}
//# sourceMappingURL=relation-matrix-row.js.map