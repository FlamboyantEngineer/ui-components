import { findMaximum } from '../../utils/find-maximum.js';
import { countDecimalPlaces } from '../../utils/count-decimal-places.js';
import { formatTsv } from '../../utils/tsv.js';
import { listBoundsCells } from './table-cell-range.js';
import { getCellValue, } from './table-rows.js';
const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
};
/** A value as the text a copy writes and a fill reads: dates in ISO 8601, nothing as empty text. */
export function formatCellText(value) {
    if (value instanceof Date)
        return value.toISOString();
    return value === null || value === undefined ? '' : String(value);
}
/** Typed text as a cell value: a number when the cell held a number and the text reads as one. */
export function parseCellText(text, previous) {
    const number = Number(text);
    return typeof previous === 'number' && text.trim() !== '' && Number.isFinite(number)
        ? number
        : text;
}
/** A text read as a cell's value by the column's `parseValue`, checked by its `validateValue`. */
export function readCellText(row, column, text) {
    const value = column.parseValue
        ? column.parseValue(text, row)
        : parseCellText(text, getCellValue(row, column));
    return { value, error: column.validateValue?.(value, row) ?? null };
}
/**
 * The edits that writes make, in order: only cells of editable columns in enabled rows, only
 * values the column accepts, and only values that differ from the cell's.
 */
export function resolveCellWrites(writes, isDisabled) {
    return writes.flatMap(({ row, column, text }) => {
        if (!column.allowsEditing || isDisabled(row))
            return [];
        const { value, error } = readCellText(row, column, text);
        if (error !== null || Object.is(value, getCellValue(row, column)))
            return [];
        return [{ row, columnId: column.id, value }];
    });
}
function escapeHtml(text) {
    return text.replace(/[&<>"]/g, (character) => htmlEscapes[character] ?? character);
}
/** The text of the cells in `bounds` as tab-separated text and as an HTML table. */
export function copyBounds(grid, bounds) {
    const texts = listBoundsCells(grid, bounds).map((cells) => cells.map(({ row, column }) => formatCellText(getCellValue(row, column))));
    const rows = texts.map((cells) => `<tr>${cells.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`);
    return { text: formatTsv(texts), html: `<table><tbody>${rows.join('')}</tbody></table>` };
}
/**
 * The writes of pasted rows of text and the cells they cover. One value fills the whole range;
 * more values land from the range's top start cell, as far as the grid reaches.
 */
export function planPaste(grid, bounds, block) {
    const width = findMaximum(block, (cells) => cells.length, 0);
    if (width === 0)
        return null;
    const isSingle = block.length === 1 && width === 1;
    const target = isSingle
        ? bounds
        : {
            top: bounds.top,
            start: bounds.start,
            bottom: Math.min(bounds.top + block.length - 1, grid.rows.length - 1),
            end: Math.min(bounds.start + width - 1, grid.columns.length - 1),
        };
    const writes = listBoundsCells(grid, target).flatMap((cells, rowIndex) => cells.map(({ row, column }, columnIndex) => ({
        row,
        column,
        text: (isSingle ? block[0]?.[0] : block[rowIndex]?.[columnIndex]) ?? '',
    })));
    return { writes, bounds: target };
}
/** Writes that empty every cell of `bounds`. */
export function planClear(grid, bounds) {
    return listBoundsCells(grid, bounds).flatMap((cells) => cells.map(({ row, column }) => ({ row, column, text: '' })));
}
/** The step, final value and precision of an evenly spaced run of finite numbers. */
function readSeries(values) {
    const [first, second] = values;
    if (typeof first !== 'number' || typeof second !== 'number')
        return null;
    const step = second - first;
    if (!Number.isFinite(step))
        return null;
    let last = first;
    let decimals = 0;
    for (let index = 0; index < values.length; index += 1) {
        const value = values[index];
        if (typeof value !== 'number' || !Number.isFinite(value))
            return null;
        const tolerance = Number.EPSILON * Math.max(Math.abs(value), Math.abs(last), Math.abs(step)) * 4;
        if (index > 0 && Math.abs(value - last - step) > tolerance)
            return null;
        decimals = Math.max(decimals, countDecimalPlaces(value));
        last = value;
    }
    return { step, last, decimals };
}
/**
 * `count` values that follow `values`: an evenly spaced run of numbers continues by its step,
 * rounded to its decimals; anything else repeats in turn.
 */
export function extendSeries(values, count) {
    if (values.length === 0)
        return [];
    const series = readSeries(values);
    if (!series) {
        return Array.from({ length: count }, (_, index) => values[index % values.length]);
    }
    return Array.from({ length: count }, (_, index) => {
        const next = series.last + series.step * (index + 1);
        return series.decimals <= 100 ? Number(next.toFixed(series.decimals)) : next;
    });
}
function listIndices(from, to) {
    return Array.from({ length: Math.max(0, to - from + 1) }, (_, index) => from + index);
}
/** The writes that extend `source` along one axis to `target`, line by line. */
function fillAxis(grid, bounds, isDown) {
    const { source, target } = bounds;
    const lines = isDown
        ? listIndices(target.start, target.end)
        : listIndices(target.top, target.bottom);
    const from = isDown
        ? listIndices(source.top, source.bottom)
        : listIndices(source.start, source.end);
    const to = isDown
        ? listIndices(source.bottom + 1, target.bottom)
        : listIndices(source.end + 1, target.end);
    const cellAt = (line, step) => {
        const row = grid.rows[isDown ? step : line];
        const column = grid.columns[isDown ? line : step];
        return row && column ? { row, column } : null;
    };
    return lines.flatMap((line) => {
        const values = from.map((step) => {
            const cell = cellAt(line, step);
            return cell ? getCellValue(cell.row, cell.column) : undefined;
        });
        const series = extendSeries(values, to.length);
        return to.flatMap((step, index) => {
            const cell = cellAt(line, step);
            return cell ? [{ ...cell, text: formatCellText(series[index]) }] : [];
        });
    });
}
/**
 * The writes that fill `target` from `source`, the cells at its top start: down, when `target`
 * reaches lower, each column continues its source values; else right, each row does.
 */
export function planFill(grid, source, target) {
    if (target.bottom > source.bottom)
        return fillAxis(grid, { source, target }, true);
    if (target.end > source.end)
        return fillAxis(grid, { source, target }, false);
    return [];
}
/**
 * The cells a fill handle dragged from `source` to the cell `at` covers: down when the cell is
 * further below than beyond the end, else towards the end; null over the source or before it.
 */
export function resolveFillTarget(source, at) {
    const down = at.row - source.bottom;
    const across = at.column - source.end;
    if (down > 0 && down >= across)
        return { ...source, bottom: at.row };
    if (across > 0)
        return { ...source, end: at.column };
    return null;
}
//# sourceMappingURL=table-cell-writes.js.map