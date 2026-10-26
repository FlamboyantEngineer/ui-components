// Places the timeline's items on its visible rows and draws its dependencies (specs/TIMELINE.md).
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { createTimelineAxis, isDependencyConflict, readTimelineItem, resolveConnectorPath, resolveItemSpan, resolveTimelineRange, } from './timeline-geometry.js';
function placeItems(axis, rows, items) {
    const rowIndex = new Map(rows.map((entry, index) => [entry.row.id, index]));
    const placed = new Map();
    for (const { item, read } of items.values()) {
        const index = rowIndex.get(item.rowId);
        if (!read || index === undefined)
            continue;
        placed.set(item.id, { item, read, rowIndex: index, ...resolveItemSpan(axis, read) });
    }
    return placed;
}
function collectPredecessors(items, dependencies) {
    const result = new Map();
    for (const { from, to } of dependencies) {
        const source = items.get(from);
        const target = items.get(to);
        if (!source?.read || !target?.read)
            continue;
        const entry = result.get(to) ?? { names: [], hasConflict: false };
        entry.names.push(source.item.label);
        entry.hasConflict ||= isDependencyConflict(source.read, target.read);
        result.set(to, entry);
    }
    return result;
}
/**
 * The visible rows' items, placed on the axis in their rows, the connectors between visible items,
 * and each item's predecessors. Items whose row is hidden or whose first day is not a date are left
 * out; their dependencies still count toward descriptions.
 */
export function resolveTimelineLayout(options) {
    const { axis, rows, items, dependencies, rowHeight } = options;
    const indexed = new Map(items.map((item) => [item.id, { item, read: readTimelineItem(item) }]));
    const placed = placeItems(axis, rows, indexed);
    const rowItems = new Map(rows.map((entry) => [entry.row.id, []]));
    for (const entry of placed.values())
        rowItems.get(entry.item.rowId).push(entry);
    const centre = (entry) => entry.rowIndex * rowHeight + rowHeight / 2;
    const connectors = dependencies.flatMap(({ from, to }) => {
        const [source, target] = [placed.get(from), placed.get(to)];
        if (!source || !target)
            return [];
        const points = { x1: source.right, y1: centre(source), x2: target.left, y2: centre(target) };
        return [
            {
                key: JSON.stringify([toKeyIdentity(from), toKeyIdentity(to)]),
                path: resolveConnectorPath({ ...points, rowHeight }),
                hasConflict: isDependencyConflict(source.read, target.read),
            },
        ];
    });
    return { rowItems, connectors, predecessors: collectPredecessors(indexed, dependencies) };
}
function applyDraft(items, draft) {
    if (!draft)
        return items;
    return items.map((item) => (item.id === draft.id ? { ...item, ...draft } : item));
}
/**
 * The axis over the timeline's range (resolved from the items as given, so a drag never shifts it)
 * and the layout of its visible rows, with a drag in progress shown in place of the item's days.
 */
export function layoutTimeline(options) {
    const { items, draft, range, scale, today, locale } = options;
    const axis = createTimelineAxis(resolveTimelineRange({ range, items, scale, today, locale }), scale, locale);
    return {
        axis,
        layout: resolveTimelineLayout({ ...options, axis, items: applyDraft(items, draft) }),
    };
}
//# sourceMappingURL=timeline-layout.js.map