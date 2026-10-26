const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
function isCellValue(value) {
    return (value === null ||
        value === undefined ||
        value instanceof Date ||
        ['string', 'number', 'boolean'].includes(typeof value));
}
/** Whether a cell value reads as text: a string or a number. */
export function isTextValue(value) {
    return typeof value === 'string' || typeof value === 'number';
}
function toSortKey(value) {
    if (isTextValue(value))
        return value;
    if (typeof value === 'boolean')
        return value ? 1 : 0;
    return value instanceof Date ? value.getTime() : '';
}
/** The value `column` reads from `row`. */
export function getCellValue(row, column) {
    if (column.getValue)
        return column.getValue(row);
    const value = row[column.id];
    return isCellValue(value) ? value : undefined;
}
/** Orders two cell values: numbers, booleans and dates numerically, text naturally ignoring case. */
export function compareCellValues(left, right) {
    const a = toSortKey(left);
    const b = toSortKey(right);
    if (typeof a === 'number' && typeof b === 'number')
        return a - b;
    return collator.compare(String(a), String(b));
}
/** The text of a row's string and number cells in `columns`, or its id when there is none. */
export function getRowText(row, columns) {
    const parts = columns.map((column) => getCellValue(row, column)).filter(isTextValue);
    return parts.length > 0 ? parts.join(' ') : String(row.id);
}
/** A copy of `rows` with the moved rows, in their current order, placed beside the target. */
export function applyTableMove(rows, move) {
    const moving = new Set(move.keys);
    const moved = rows.filter((row) => moving.has(row.id));
    const rest = rows.filter((row) => !moving.has(row.id));
    const index = rest.findIndex((row) => row.id === move.targetKey);
    if (index === -1 || moved.length === 0)
        return [...rows];
    const at = move.position === 'before' ? index : index + 1;
    return [...rest.slice(0, at), ...moved, ...rest.slice(at)];
}
/** Whether applying `move` would change the order of `rows`. */
export function isEffectiveTableMove(rows, move) {
    const next = applyTableMove(rows, move);
    return next.some((row, index) => row !== rows[index]);
}
//# sourceMappingURL=table-rows.js.map