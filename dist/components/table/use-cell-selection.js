import { useLayoutEffect, useMemo, useRef, } from 'react';
import { useLocale } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import { parseTsv } from '../../utils/tsv.js';
import { createBoundsRange, createCellRange, findDataCell, getRangeBounds, isSameCellRange, readCellPosition, stepCell, } from './table-cell-range.js';
import { copyBounds, planClear, planFill, planPaste, resolveCellWrites, } from './table-cell-writes.js';
import { useCellPointer } from './use-cell-pointer.js';
const arrowSteps = {
    ArrowUp: [-1, 0],
    ArrowDown: [1, 0],
    ArrowLeft: [0, -1],
    ArrowRight: [0, 1],
};
/** What a key pressed on a cell does in spreadsheet mode, if anything. */
function resolveKeyAction(event, mode, isRtl) {
    const step = arrowSteps[event.key];
    if (step && event.shiftKey && mode === 'range') {
        const [rows, columns] = step;
        return { type: 'extend', rows, columns: isRtl ? -columns : columns };
    }
    if (event.key === 'Delete' || event.key === 'Backspace')
        return { type: 'clear' };
    if (!(event.ctrlKey || event.metaKey) || event.altKey)
        return null;
    const letter = event.key.toLowerCase();
    if (letter === 'd')
        return { type: 'fill-down' };
    return letter === 'r' ? { type: 'fill-right' } : null;
}
/** The position of the data cell an event happened on, ignoring events inside its controls. */
function readEventCell(grid, event) {
    const cell = findDataCell(event.target, event.currentTarget);
    return cell && cell === event.target ? readCellPosition(grid, cell) : null;
}
/**
 * Moves focus that reaches a data row on to its cell in `columnId`, else its first data cell, so
 * spreadsheet mode keeps focus on cells.
 */
function focusRowCell(event, columnId) {
    const row = event.target;
    const isRow = row instanceof HTMLElement && row.classList.contains('ui-table__row');
    if (!isRow || row.closest('.ui-table') !== event.currentTarget)
        return;
    const cells = [
        ...row.querySelectorAll(':scope > .ui-table__cell[data-kind="data"]'),
    ];
    (cells.find((cell) => cell.dataset['column'] === columnId) ?? cells[0])?.focus();
}
/**
 * Copying the selected cells as tab-separated text and an HTML table, and pasting tab-separated
 * text into them, which then selects the cells the paste covers.
 */
function createClipboardHandlers(parts) {
    const { grid, resolveBounds, write, setRange } = parts;
    const readArea = (event) => {
        const position = readEventCell(grid, event);
        return position ? resolveBounds(position) : null;
    };
    return {
        onCopy: (event) => {
            const area = readArea(event);
            if (!area)
                return;
            const { text, html } = copyBounds(grid, area);
            event.clipboardData.setData('text/plain', text);
            event.clipboardData.setData('text/html', html);
            event.preventDefault();
        },
        onPaste: (event) => {
            const area = readArea(event);
            const text = event.clipboardData.getData('text/plain');
            const plan = area ? planPaste(grid, area, parseTsv(text)) : null;
            if (!plan)
                return;
            event.preventDefault();
            write(plan.writes);
            setRange(createBoundsRange(grid, plan.bounds));
        },
    };
}
/**
 * Spreadsheet mode: a focused cell and, in `range` mode, rectangles of cells. Shift with arrow
 * keys extends the range; Delete clears it, Control or Command with D or R fills it down or right
 * from its first row or column; copying writes its cells as tab-separated text and HTML, and
 * pasting tab-separated text writes into it. Writes go through each column's reading and checks
 * and are reported in one batch.
 */
export function useCellSelection(options) {
    const { grid, cellSelection: mode = 'none', isRowDisabled, onCellsChange } = options;
    const { direction } = useLocale();
    const [range, setOwnRange] = useControllableState(options.selectedRange, options.defaultSelectedRange ?? null, options.onSelectedRangeChange);
    const current = useRef(range);
    useLayoutEffect(() => {
        current.current = range;
    });
    const setRange = (next) => {
        if (isSameCellRange(current.current, next))
            return;
        current.current = next;
        setOwnRange(next);
    };
    const bounds = useMemo(() => getRangeBounds(grid, range), [grid, range]);
    const write = (writes) => {
        const edits = resolveCellWrites(writes, isRowDisabled);
        if (edits.length > 0)
            onCellsChange?.(edits);
    };
    const pointer = useCellPointer({ mode, grid, range, bounds, setRange, write });
    /** The selected cells, or the cell the event is on when the selection does not hold it. */
    const resolveBounds = (position) => bounds ?? getRangeBounds(grid, createCellRange(position));
    const perform = (action, position) => {
        const selected = bounds ? range : createCellRange(position);
        const area = resolveBounds(position);
        if (!selected || !area)
            return;
        if (action.type === 'extend') {
            setRange({ anchor: selected.anchor, focus: stepCell(grid, selected.focus, action) });
        }
        else if (action.type === 'clear') {
            write(planClear(grid, area));
        }
        else {
            const source = action.type === 'fill-down' ? { ...area, bottom: area.top } : { ...area, end: area.start };
            write(planFill(grid, source, area));
        }
    };
    const onKeyDownCapture = (event) => {
        const position = readEventCell(grid, event);
        const action = position ? resolveKeyAction(event, mode, direction === 'rtl') : null;
        if (!position || !action)
            return;
        event.preventDefault();
        event.stopPropagation();
        perform(action, position);
    };
    // Focus reaching a cell selects it, unless it returns to the anchor of the selected cells.
    const onFocus = (event) => {
        const position = readEventCell(grid, event);
        if (!position) {
            focusRowCell(event, range?.focus.columnId);
            return;
        }
        const isAnchor = bounds !== null &&
            range !== null &&
            isSameCellRange(createCellRange(range.anchor), createCellRange(position));
        if (!isAnchor)
            setRange(createCellRange(position));
    };
    const clipboard = createClipboardHandlers({ grid, resolveBounds, write, setRange });
    return {
        mode,
        grid,
        bounds,
        fillBounds: pointer.fillBounds,
        rootProps: mode === 'none' ? {} : { onKeyDownCapture, onFocus, ...clipboard, ...pointer.rootProps },
    };
}
//# sourceMappingURL=use-cell-selection.js.map