import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { listenPointerRelease } from '../../utils/pointer-drag.js';
import { createBoundsRange, createCellRange, findDataCell, locateCell, readCellPosition, } from './table-cell-range.js';
import { planFill, resolveFillTarget } from './table-cell-writes.js';
/** Controls inside a cell that keep their own presses. */
const interactiveSelector = 'button, a, input, select, textarea, [role="button"], [role="checkbox"], [contenteditable="true"]';
function isInteractive(target, cell) {
    const control = target.closest(interactiveSelector);
    return control !== null && control !== cell && cell.contains(control);
}
/** The selection or fill gesture, including its live target and document-level ending. */
function useCellDrag(options) {
    const [fillBounds, setFillBounds] = useState(null);
    const drag = useRef(null);
    const fillTarget = useRef(null);
    const stop = useRef(null);
    const latest = useRef(options);
    useLayoutEffect(() => {
        latest.current = options;
    });
    useEffect(() => () => stop.current?.(), []);
    const finish = (shouldCommit) => {
        const { bounds, grid, write, setRange } = latest.current;
        const target = fillTarget.current;
        if (shouldCommit && drag.current === 'fill' && bounds && target) {
            write(planFill(grid, bounds, target));
            setRange(createBoundsRange(grid, target));
        }
        drag.current = null;
        fillTarget.current = null;
        setFillBounds(null);
    };
    const begin = (kind, event) => {
        stop.current?.();
        drag.current = kind;
        const end = (shouldCommit) => {
            stop.current = null;
            finish(shouldCommit);
        };
        stop.current = listenPointerRelease({
            element: event.currentTarget,
            pointerId: event.pointerId,
            onRelease: () => end(true),
            onCancel: () => end(false),
        });
    };
    const extend = (position) => {
        const { grid, range, bounds, setRange } = latest.current;
        if (!drag.current || !range)
            return;
        if (drag.current === 'select') {
            setRange({ anchor: range.anchor, focus: position });
            return;
        }
        const at = locateCell(grid, position);
        fillTarget.current = bounds && at ? resolveFillTarget(bounds, at) : null;
        setFillBounds(fillTarget.current);
    };
    return { fillBounds, begin, extend };
}
/**
 * Selecting cells by pointer in spreadsheet mode: a press selects a cell and focuses it, Shift
 * with a press extends the range to the pressed cell, dragging extends it to the cell under the
 * pointer, and dragging the fill handle fills the cells it reaches when the pointer is released.
 * Presses on data cells select cells rather than rows; controls inside cells keep their presses.
 */
export function useCellPointer(options) {
    const { mode, grid, range, setRange } = options;
    const drag = useCellDrag(options);
    const press = (cell, position, event) => {
        if (event.shiftKey && mode === 'range' && range) {
            setRange({ anchor: range.anchor, focus: position });
            return;
        }
        setRange(createCellRange(position));
        cell.focus();
        if (mode === 'range')
            drag.begin('select', event);
    };
    const onPointerDownCapture = (event) => {
        if (mode === 'none' ||
            event.button !== 0 ||
            event.isPrimary === false ||
            !(event.target instanceof Element))
            return;
        if (event.target.closest('.ui-table__fill-handle')) {
            event.preventDefault();
            event.stopPropagation();
            drag.begin('fill', event);
            return;
        }
        const cell = findDataCell(event.target, event.currentTarget);
        if (!cell || isInteractive(event.target, cell) || cell.dataset['editing'])
            return;
        const position = readCellPosition(grid, cell);
        if (!position)
            return;
        // The press is the table's: no row selection, no text selection.
        event.preventDefault();
        event.stopPropagation();
        press(cell, position, event);
    };
    const onPointerOver = (event) => {
        const cell = findDataCell(event.target, event.currentTarget);
        const position = cell ? readCellPosition(grid, cell) : null;
        if (position)
            drag.extend(position);
    };
    return { fillBounds: drag.fillBounds, rootProps: { onPointerDownCapture, onPointerOver } };
}
//# sourceMappingURL=use-cell-pointer.js.map