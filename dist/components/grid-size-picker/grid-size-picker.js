import { createElement as _createElement } from "react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLayoutEffect, useRef, useState } from 'react';
import { useLocale } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { getShownGridSize, moveGridSize } from './grid-size.js';
const hooks = createHooks('grid-size-picker', ['grid', 'row', 'cell', 'readout']);
function GridCell({ rows, columns, preview, isDisabled, onPreview, onSelect, focusRef, }) {
    const strings = useUiStrings();
    const isPreview = rows === preview.rows && columns === preview.columns;
    return (_jsx("div", { ...hooks.slot('cell', {
            inRange: rows <= preview.rows && columns <= preview.columns,
            active: isPreview,
        }), ref: isPreview ? focusRef : undefined, role: "gridcell", "aria-label": strings.gridSizeCell(rows, columns), tabIndex: isPreview && !isDisabled ? 0 : -1, onPointerEnter: isDisabled ? undefined : () => onPreview({ rows, columns }), onFocus: isDisabled ? undefined : () => onPreview({ rows, columns }), onClick: isDisabled ? undefined : () => onSelect({ rows, columns }), onKeyDown: (event) => {
            // The focused cell, not a hovered one, is the size the reader hears and chooses.
            if (isDisabled || (event.key !== 'Enter' && event.key !== ' '))
                return;
            event.preventDefault();
            event.stopPropagation();
            onSelect({ rows, columns });
        } }));
}
/** The previewed size, and the keyboard handling that moves it and moves focus along. */
function useGridPreview(max, autoFocus) {
    const { direction } = useLocale();
    const [own, setPreview] = useState({ rows: 1, columns: 1 });
    const preview = {
        rows: Math.min(own.rows, max.rows),
        columns: Math.min(own.columns, max.columns),
    };
    const cellRef = useRef(null);
    const shouldFocus = useRef(autoFocus);
    useLayoutEffect(() => {
        if (!shouldFocus.current)
            return;
        shouldFocus.current = false;
        cellRef.current?.focus();
    });
    const move = (event) => {
        const next = moveGridSize(preview, {
            key: event.key,
            isRtl: direction === 'rtl',
            isCorner: event.ctrlKey || event.metaKey,
            max,
        });
        if (!next)
            return;
        event.preventDefault();
        event.stopPropagation();
        shouldFocus.current = true;
        setPreview(next);
    };
    const focusRef = (node) => {
        cellRef.current = node;
    };
    return { preview, setPreview, move, focusRef };
}
/**
 * Chooses a number of rows and columns, as for a new table, from a grid of cells: hovering or
 * focusing a cell previews its size, shown in a readout such as `3 × 4`, and the grid grows one row
 * and column past the preview up to its maximum. Arrow keys, Home and End move the preview; a press
 * chooses the pressed cell, and Enter or Space the focused one.
 */
export function GridSizePicker({ onSelect, maxRows = 10, maxColumns = 10, minRows = 5, minColumns = 5, isDisabled = false, autoFocus = false, className, id, ...rest }) {
    const strings = useUiStrings();
    const max = { rows: maxRows, columns: maxColumns };
    const { preview, setPreview, move, focusRef } = useGridPreview(max, autoFocus);
    const shown = getShownGridSize(preview, { min: { rows: minRows, columns: minColumns }, max });
    const onKeyDown = (event) => {
        if (!isDisabled)
            move(event);
    };
    const cell = { preview, isDisabled, onPreview: setPreview, onSelect, focusRef };
    return (_jsxs("div", { ...hooks.root({ className, props: rest, data: { disabled: isDisabled } }), id: id, children: [_jsx("div", { ...hooks.slot('grid'), role: "grid", "aria-label": rest['aria-labelledby'] ? undefined : (rest['aria-label'] ?? strings.gridSizePicker), "aria-labelledby": rest['aria-labelledby'], "aria-describedby": rest['aria-describedby'], "aria-details": rest['aria-details'], "aria-disabled": isDisabled || undefined, onKeyDown: onKeyDown, children: Array.from({ length: shown.rows }, (_, row) => (_createElement("div", { ...hooks.slot('row'), key: row, role: "row" }, Array.from({ length: shown.columns }, (_, column) => (_jsx(GridCell, { rows: row + 1, columns: column + 1, ...cell }, column)))))) }), _jsx("div", { ...hooks.slot('readout'), "aria-hidden": "true", children: strings.gridSize(preview.rows, preview.columns) })] }));
}
//# sourceMappingURL=grid-size-picker.js.map