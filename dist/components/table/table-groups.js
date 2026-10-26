import { summarizeNumbers } from '../../utils/summarize-numbers.js';
import { walkTree } from '../../utils/walk-tree.js';
import { getColumnText } from './table-column.js';
import { compareCellValues, getCellValue, } from './table-rows.js';
/** The key prefix of group header rows, kept out of row actions, selection and moves. */
export const groupKeyPrefix = 'ui-table-group:';
/** Whether a node is a group header row. */
export function isGroupNode(node) {
    return 'group' in node;
}
/** Whether a value counts as no value: absent, null or empty text. */
export function isEmptyCellValue(value) {
    return value === null || value === undefined || value === '';
}
/** A value as the text of a group key or a group header: dates as their `YYYY-MM-DD` day. */
export function formatGroupValue(value) {
    if (value instanceof Date)
        return value.toISOString().slice(0, 10);
    return isEmptyCellValue(value) ? '' : String(value);
}
/**
 * The groupings `groupBy` names: columns by id, read with their values and names, and computed
 * groupings as given. Unknown column ids are skipped. Groups follow the sort direction of their
 * column, ascending unless the table sorts that column descending.
 */
export function resolveGroupings(groupBy, columns, sort) {
    const directionOf = (id) => sort.find((descriptor) => String(descriptor.column) === id)?.direction ?? 'ascending';
    return groupBy.flatMap((entry) => {
        if (typeof entry !== 'string')
            return [{ ...entry, direction: directionOf(entry.id) }];
        const column = columns.find((candidate) => candidate.id === entry);
        if (!column)
            return [];
        return [
            {
                id: column.id,
                label: getColumnText(column),
                getValue: (row) => getCellValue(row, column),
                direction: directionOf(column.id),
            },
        ];
    });
}
/** Orders two group values in a direction, keeping groups without a value last. */
function compareGroupValues(left, right, direction) {
    const isLeftEmpty = isEmptyCellValue(left);
    if (isLeftEmpty !== isEmptyCellValue(right))
        return isLeftEmpty ? 1 : -1;
    const order = compareCellValues(left, right);
    return direction === 'descending' ? -order : order;
}
function encodeGroupPart(value) {
    return value.replace(/[%/=:]/g, encodeURIComponent);
}
function groupLevel(nodes, groupings, at) {
    const [grouping, ...rest] = groupings;
    if (!grouping)
        return nodes;
    const buckets = new Map();
    for (const node of nodes) {
        const value = grouping.getValue(node.row);
        const valueKey = formatGroupValue(value);
        const bucket = buckets.get(valueKey) ?? { value, nodes: [] };
        bucket.nodes.push(node);
        buckets.set(valueKey, bucket);
    }
    const ordered = [...buckets].sort(([, left], [, right]) => compareGroupValues(left.value, right.value, grouping.direction));
    return ordered.map(([valueKey, bucket]) => {
        const base = `${at.prefix}${encodeGroupPart(grouping.id)}=${encodeGroupPart(valueKey)}`;
        let key = base;
        let suffix = 0;
        while (at.reserved.has(key))
            key = `${base}:${++suffix}`;
        at.reserved.add(key);
        return {
            id: key,
            group: {
                key,
                groupingId: grouping.id,
                label: grouping.label,
                value: bucket.value,
                rows: bucket.nodes.map((node) => node.row),
                level: at.level,
            },
            children: groupLevel(bucket.nodes, rest, {
                prefix: `${base}/`,
                level: at.level + 1,
                reserved: at.reserved,
            }),
        };
    });
}
/**
 * The nodes under one group header row per value of the first grouping, each holding the groups
 * of the next grouping, and so on. Rows keep their order inside a group; groups are ordered by
 * value, those without one last. Group keys are unique paths of grouping ids and values.
 */
export function groupTableNodes(nodes, groupings, reservedKeys = []) {
    if (groupings.length === 0)
        return nodes;
    const reserved = new Set(reservedKeys);
    for (const node of walkTree(nodes, (node) => node.children))
        reserved.add(node.id);
    return groupLevel(nodes, groupings, { prefix: groupKeyPrefix, level: 1, reserved });
}
/** The keys of every group header row, nested ones included. */
export function listGroupKeys(nodes) {
    const keys = [];
    for (const node of walkTree(nodes, (node) => (isGroupNode(node) ? node.children : undefined))) {
        if (isGroupNode(node))
            keys.push(node.id);
    }
    return keys;
}
/** The data rows a reader sees, in order: inside expanded groups and under expanded rows. */
export function listVisibleRows(nodes, expandedKeys) {
    const rows = [];
    for (const node of walkTree(nodes, (node) => expandedKeys.has(node.id) ? node.children : undefined)) {
        if (!isGroupNode(node))
            rows.push(node.row);
    }
    return rows;
}
/**
 * A built-in aggregate of cell values: `count` counts the values that are not empty; `sum`, `min`
 * and `max` take the finite numbers, and are null without any.
 */
export function aggregateCellValues(values, kind) {
    if (kind === 'count')
        return values.filter((value) => !isEmptyCellValue(value)).length;
    const summary = summarizeNumbers(values);
    return summary.count === 0 ? null : summary[kind];
}
//# sourceMappingURL=table-groups.js.map