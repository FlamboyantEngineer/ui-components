const relativeSize = /^\d+(?:\.\d+)?(?:%|fr)$/;
const defaultWidth = '1fr';
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function listEntries(source) {
    if (source instanceof Map)
        return source.entries();
    return isRecord(source) ? Object.entries(source) : [];
}
/** Whether `value` is a usable width: a positive pixel count, percentage or share. */
export function isColumnSize(value) {
    if (typeof value === 'number')
        return Number.isFinite(value) && value > 0;
    return typeof value === 'string' && relativeSize.test(value) && Number.parseFloat(value) > 0;
}
/** The column's bounds, with a maximum never below the minimum. */
export function getColumnBounds(column) {
    const { minWidth, maxWidth } = column;
    if (minWidth === undefined || maxWidth === undefined)
        return { minWidth, maxWidth };
    return { minWidth, maxWidth: Math.max(minWidth, maxWidth) };
}
/** Keeps a pixel width inside the column's bounds; percentages and shares pass unchanged. */
export function clampColumnWidth(width, column) {
    if (typeof width !== 'number')
        return width;
    const { minWidth = 0, maxWidth = Number.POSITIVE_INFINITY } = getColumnBounds(column);
    return Math.min(Math.max(width, minWidth), maxWidth);
}
/** The width a column renders at: a usable stored width, else its declared width, else `1fr`. */
export function resolveColumnWidth(column, stored) {
    const width = isColumnSize(stored) ? stored : (column.width ?? defaultWidth);
    return clampColumnWidth(width, column);
}
/**
 * The usable widths of the given columns in `source`, a map (as React Aria reports resizes) or a
 * plain object (as storage returns them), clamped to each column's bounds. Unknown columns and
 * unusable values are dropped.
 */
export function pickColumnWidths(source, columns) {
    const byId = new Map(columns.map((column) => [column.id, column]));
    const widths = {};
    for (const [key, value] of listEntries(source)) {
        const column = byId.get(String(key));
        if (column && isColumnSize(value))
            widths[column.id] = clampColumnWidth(value, column);
    }
    return widths;
}
//# sourceMappingURL=column-sizing.js.map