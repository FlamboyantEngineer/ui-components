import { compareCellValues, getCellValue, } from './table-rows.js';
/** The next step of a column's sort: ascending, descending, then unsorted. */
function nextDirection(existing) {
    if (!existing)
        return 'ascending';
    return existing.direction === 'ascending' ? 'descending' : null;
}
function toSortKeys(columns, sort) {
    return toSortDescriptors(sort).flatMap((descriptor) => {
        const column = columns.find((candidate) => candidate.id === String(descriptor.column));
        return column ? [{ column, sign: descriptor.direction === 'descending' ? -1 : 1 }] : [];
    });
}
/** A sort as a list in priority order. */
export function toSortDescriptors(sort) {
    if (!sort)
        return [];
    return 'column' in sort ? [sort] : sort;
}
/**
 * A comparison of rows by the sort's columns in priority order, each later column breaking the
 * ties of the earlier ones, or null when no sorted column exists. Each value is read once per row.
 */
export function createRowComparator(columns, sort) {
    const keys = toSortKeys(columns, sort);
    if (keys.length === 0)
        return null;
    const cache = new Map();
    const read = (row) => {
        let values = cache.get(row);
        if (!values) {
            values = keys.map((key) => getCellValue(row, key.column));
            cache.set(row, values);
        }
        return values;
    };
    return (left, right) => {
        const a = read(left);
        const b = read(right);
        for (const [index, key] of keys.entries()) {
            const order = compareCellValues(a[index], b[index]) * key.sign;
            if (order !== 0)
                return order;
        }
        return 0;
    };
}
/**
 * The rows ordered by the sort, one descriptor or several in priority order. Rows the sort cannot
 * separate keep their given order. Without a sort or a matching column the rows are returned
 * unchanged; the input array is never modified.
 */
export function sortTableRows(rows, columns, sort) {
    const compare = createRowComparator(columns, sort);
    if (!compare)
        return rows;
    return [...rows].sort(compare);
}
/**
 * The sort after a header press, given what React Aria requests: ascending, then descending, then
 * unsorted again.
 */
export function nextSortDescriptor(current, requested) {
    const restarts = current?.column === requested.column &&
        current.direction === 'descending' &&
        requested.direction === 'ascending';
    return restarts ? null : requested;
}
/**
 * The sort list after a press on `column`'s header. Its direction steps from unsorted to
 * ascending, descending and unsorted again. A plain press sorts by that column alone; an additive
 * press (with Shift) keeps the other columns, changing the column in place or adding it last.
 */
export function nextSortDescriptors(current, column, isAdditive) {
    const existing = current.find((descriptor) => descriptor.column === column);
    const direction = nextDirection(existing);
    const next = direction ? { column, direction } : null;
    if (!isAdditive)
        return next ? [next] : [];
    if (!existing)
        return next ? [...current, next] : [...current];
    return current.flatMap((descriptor) => descriptor.column !== column ? [descriptor] : next ? [next] : []);
}
//# sourceMappingURL=table-sort.js.map