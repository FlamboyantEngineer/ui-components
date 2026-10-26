// Pivot of plain records (specs/PIVOT-TABLE.md): groups by row and column fields and aggregates
// value fields per group, with row, column and grand totals computed from the records.
import { summarizeNumbers } from './summarize-numbers.js';
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
function readKey(record, field) {
    const value = record[field];
    if (value === undefined || value === null || value === '')
        return null;
    // JSON has no non-finite numbers: NaN would share the empty group's `null` key.
    if (typeof value === 'number' && !Number.isFinite(value))
        return String(value);
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return value;
    }
    return String(value);
}
/** Orders keys: numbers by value, booleans false first, text naturally, empty keys last. */
function compareKeys(left, right) {
    if (left === null || right === null)
        return (left === null ? 1 : 0) - (right === null ? 1 : 0);
    if (typeof left === 'number' && typeof right === 'number')
        return left - right;
    if (typeof left === 'boolean' && typeof right === 'boolean')
        return Number(left) - Number(right);
    return collator.compare(String(left), String(right));
}
/** The records grouped by their key in `field`, groups in key order. */
function groupRecords(records, field) {
    const groups = new Map();
    for (const record of records) {
        const key = readKey(record, field);
        const id = JSON.stringify(key);
        const group = groups.get(id) ?? { key, records: [] };
        group.records.push(record);
        groups.set(id, group);
    }
    return [...groups.values()].sort((left, right) => compareKeys(left.key, right.key));
}
function isPresent(value) {
    return value !== undefined && value !== null && value !== '';
}
/**
 * One value's aggregate over records: `count` counts the non-empty values; `sum`, `min`, `max` and
 * `average` read the finite numbers and give `null` without one; a function gets every value.
 */
function aggregateValue(records, value) {
    const values = records.map((record) => record[value.field]);
    const { aggregate = 'sum' } = value;
    if (typeof aggregate === 'function')
        return aggregate(values);
    if (aggregate === 'count')
        return values.filter(isPresent).length;
    const summary = summarizeNumbers(values);
    if (summary.count === 0)
        return null;
    return aggregate === 'average' ? summary.sum / summary.count : summary[aggregate];
}
function aggregateAll(records, layout) {
    return layout.values.map((value) => aggregateValue(records, value));
}
function columnKey(record, layout) {
    return JSON.stringify(layout.columns.map((field) => readKey(record, field)));
}
/** The aggregates of records in each column they fall in, by column key. */
function aggregateColumns(records, layout) {
    const byColumn = new Map();
    for (const record of records) {
        const key = columnKey(record, layout);
        const members = byColumn.get(key) ?? [];
        members.push(record);
        byColumn.set(key, members);
    }
    return Object.fromEntries([...byColumn].map(([key, members]) => [key, aggregateAll(members, layout)]));
}
function buildColumns(records, fields, path) {
    const field = fields[path.length];
    if (field === undefined)
        return [{ key: JSON.stringify(path), path }];
    return groupRecords(records, field).flatMap((group) => buildColumns(group.records, fields, [...path, group.key]));
}
function buildRows(records, layout, parent) {
    const field = layout.rows[parent.length];
    if (field === undefined)
        return [];
    return groupRecords(records, field).map((group) => {
        const path = [...parent, group.key];
        return {
            key: JSON.stringify(path),
            field,
            value: group.key,
            path,
            cells: aggregateColumns(group.records, layout),
            total: aggregateAll(group.records, layout),
            children: buildRows(group.records, layout, path),
        };
    });
}
/**
 * Pivots records: rows grouped by the layout's row fields (nested, outermost first) and columns by
 * its column fields, every cell and total aggregating the values over the records it covers. Keys
 * order numerically, false before true, text naturally, and empty values last as `null` keys.
 */
export function pivot(records, layout) {
    return {
        rows: buildRows(records, layout, []),
        columns: buildColumns(records, layout.columns, []),
        totals: aggregateColumns(records, layout),
        grandTotal: aggregateAll(records, layout),
    };
}
//# sourceMappingURL=pivot.js.map