import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// A traceability matrix: row items × column items with a mark in each related cell, on a grid
// that windows both axes, since React Aria's table renders every column of a row.
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { useMemo, useRef } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { relationMatrixHooks as hooks } from './relation-matrix-hooks.js';
import { RelationMatrixHeader } from './relation-matrix-header.js';
import { indexRelations } from './relation-matrix-model.js';
import { RelationMatrixRow } from './relation-matrix-row.js';
import { useMatrixNavigation } from './use-matrix-navigation.js';
import { useMatrixWindow } from './use-matrix-window.js';
const defaultRowHeight = 32;
const defaultColumnWidth = 32;
/**
 * A matrix of row items × column items: a grid with a header row pinned to the top and a row
 * header column pinned to the start, each header with its relation count (rows and columns without
 * one publish `data-uncovered`), and a mark in each related cell by its relation's kind. Arrow
 * keys, PageUp, PageDown, Home and End move between cells; with `onCellAction`, a press or Enter on
 * a cell reports it so the owner can add or remove the relation. `virtualized` windows both axes.
 */
export function RelationMatrix({ rows, columns, relations, kinds, rowsLabel, columnLabels = 'rotated', onCellAction, virtualized = false, rowHeight = defaultRowHeight, columnWidth = defaultColumnWidth, className, ...rest }) {
    const strings = useUiStrings();
    const root = useRef(null);
    const header = useRef(null);
    const corner = useRef(null);
    const index = useMemo(() => indexRelations(relations, { rows, columns }), [relations, rows, columns]);
    const kindMap = useMemo(() => new Map(kinds?.map((kind) => [kind.id, kind])), [kinds]);
    const onCellPress = ({ row, column }) => {
        const rowItem = rows[row];
        const columnItem = columns[column];
        if (!onCellAction || !rowItem || !columnItem)
            return;
        const relation = index.get(rowItem.id, columnItem.id) ?? null;
        onCellAction({ row: rowItem.id, column: columnItem.id, relation });
    };
    const counts = { rowCount: rows.length, columnCount: columns.length };
    const navigation = useMatrixNavigation({ root, ...counts, onCellAction: onCellPress });
    const view = useMatrixWindow({
        ...{ root, header, corner, virtualized, ...counts, rowHeight, columnWidth },
        focus: navigation.focus,
    });
    const context = {
        ...{ columns, indices: view.columns, tracks: view.tracks, index, kinds: kindMap },
        ...{ focus: navigation.focus, isFocusWithin: navigation.isFocusWithin },
        ...{ isActionable: Boolean(onCellAction), onCellPress, virtualized, rowHeight },
    };
    return (_jsxs("div", { ref: root, role: "grid", "aria-rowcount": rows.length + 1, "aria-colcount": columns.length + 1, ...rest, ...hooks.root({
            className,
            props: rest,
            data: { columnLabels, virtualized, actionable: Boolean(onCellAction) },
        }), ...navigation.gridProps, onScroll: view.onScroll, children: [_jsx(RelationMatrixHeader, { headerRef: header, cornerRef: corner, columns, indices: view.columns, tracks: view.tracks, index, rowsLabel: rowsLabel ?? strings.relationItems, focus: navigation.focus, isFocusWithin: navigation.isFocusWithin }), _jsx("div", { role: "rowgroup", ...hooks.slot('body'), style: virtualized ? { position: 'relative', height: rows.length * rowHeight } : undefined, children: view.rows.map((rowIndex) => {
                    const row = rows[rowIndex];
                    return _jsx(RelationMatrixRow, { row, rowIndex, context }, toKeyIdentity(row.id));
                }) })] }));
}
//# sourceMappingURL=relation-matrix.js.map