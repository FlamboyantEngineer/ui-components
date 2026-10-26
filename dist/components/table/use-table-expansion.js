import { useMemo } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
function toSet(keys) {
    return keys === undefined ? undefined : new Set(keys);
}
function isSameSet(left, right) {
    return left.size === right.size && [...left].every((key) => right.has(key));
}
/**
 * Expansion of nested rows and of group header rows as one set for React Aria. Rows are collapsed
 * until expanded (`expandedKeys`); groups are expanded until collapsed (`collapsedGroups`), so new
 * groups open. A change reports only the part it touches, and keeps collapsed groups that are not
 * drawn now, such as those of another page.
 */
export function useTableExpansion(options, groupKeys) {
    const controlledRows = useMemo(() => toSet(options.expandedKeys), [options.expandedKeys]);
    const controlledGroups = useMemo(() => toSet(options.collapsedGroups), [options.collapsedGroups]);
    const [rows, setRows] = useControllableState(controlledRows, toSet(options.defaultExpandedKeys) ?? new Set(), options.onExpandedChange);
    const [collapsed, setCollapsed] = useControllableState(controlledGroups, toSet(options.defaultCollapsedGroups) ?? new Set(), options.onCollapsedGroupsChange);
    const expandedKeys = useMemo(() => new Set([...rows, ...groupKeys.filter((key) => !collapsed.has(key))]), [rows, groupKeys, collapsed]);
    const onExpandedChange = (keys) => {
        const drawn = new Set(groupKeys);
        const nextRows = new Set([...keys].filter((key) => !drawn.has(key)));
        const nextCollapsed = new Set([
            ...[...collapsed].filter((key) => !drawn.has(key)),
            ...groupKeys.filter((key) => !keys.has(key)),
        ]);
        if (!isSameSet(nextRows, rows))
            setRows(nextRows);
        if (!isSameSet(nextCollapsed, collapsed))
            setCollapsed(nextCollapsed);
    };
    return { expandedKeys, onExpandedChange };
}
//# sourceMappingURL=use-table-expansion.js.map