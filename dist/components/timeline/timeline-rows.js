// The timeline's rows: groups with children, flattened to the rows on screen (specs/TIMELINE.md).
import { walkTree } from '../../utils/walk-tree.js';
/**
 * The rows on screen in display order, with their depth: the rows whose groups are all in
 * `expandedKeys`, or every row when it is not given.
 */
export function flattenTimelineRows(rows, expandedKeys) {
    const result = [];
    const stack = [{ rows, index: 0 }];
    while (stack.length > 0) {
        const frame = stack.at(-1);
        const row = frame.rows[frame.index++];
        if (!row) {
            stack.pop();
            continue;
        }
        const hasChildren = (row.children?.length ?? 0) > 0;
        const isExpanded = hasChildren && (expandedKeys?.has(row.id) ?? true);
        result.push({ row, level: stack.length, hasChildren, isExpanded });
        if (isExpanded)
            stack.push({ rows: row.children, index: 0 });
    }
    return result;
}
/** The ids of every group, expanded by default. */
export function collectGroupKeys(rows) {
    const keys = [];
    for (const row of walkTree(rows, (entry) => entry.children)) {
        if (row.children?.length)
            keys.push(row.id);
    }
    return keys;
}
//# sourceMappingURL=timeline-rows.js.map