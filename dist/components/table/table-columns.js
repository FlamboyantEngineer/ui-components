const pinRanks = { start: 0, none: 1, end: 2 };
function pinRank(column) {
    return pinRanks[column.pin ?? 'none'];
}
function readIds(source, known) {
    if (!Array.isArray(source))
        return undefined;
    const ids = source.filter((id) => typeof id === 'string' && known.has(id));
    return [...new Set(ids)];
}
/** The columns in `order`: the listed ones first, then the others in their declared order. */
export function orderColumns(columns, order) {
    if (!order || order.length === 0)
        return [...columns];
    const rank = new Map(order.map((id, index) => [id, index]));
    return columns
        .map((column, index) => ({ column, index: rank.get(column.id) ?? order.length + index }))
        .sort((left, right) => left.index - right.index)
        .map((entry) => entry.column);
}
/**
 * The columns a table draws, in display order: the layout's order, without its hidden columns, with
 * the columns pinned to the start first and those pinned to the end last.
 */
export function arrangeColumns(columns, layout) {
    const hidden = new Set(layout.hidden ?? []);
    return orderColumns(columns, layout.order)
        .filter((column) => !hidden.has(column.id))
        .sort((left, right) => pinRank(left) - pinRank(right));
}
/** The full column order after a move, or null when the columns are pinned to different edges. */
export function applyColumnMove(columns, layout, move) {
    const ordered = orderColumns(columns, layout.order);
    const moving = ordered.find((column) => column.id === move.id);
    const target = ordered.find((column) => column.id === move.targetId);
    if (!moving || !target || moving === target || pinRank(moving) !== pinRank(target))
        return null;
    const rest = ordered.filter((column) => column !== moving).map((column) => column.id);
    const at = rest.indexOf(target.id) + (move.position === 'after' ? 1 : 0);
    return [...rest.slice(0, at), moving.id, ...rest.slice(at)];
}
/**
 * The move of `id` one step towards the end (`1`) or the start (`-1`) among the drawn columns, or
 * null at the edge of its pinned group.
 */
export function stepColumnMove(columns, id, step) {
    const index = columns.findIndex((column) => column.id === id);
    const target = index === -1 ? undefined : columns[index + step];
    if (!target || pinRank(target) !== pinRank(columns[index]))
        return null;
    return { id, targetId: target.id, position: step === 1 ? 'after' : 'before' };
}
/** The usable part of a stored layout: arrays of known column ids, each listed once. */
export function readColumnLayout(source, columns) {
    if (typeof source !== 'object' || source === null)
        return {};
    const known = new Set(columns.map((column) => column.id));
    const { order, hidden } = source;
    return { order: readIds(order, known), hidden: readIds(hidden, known) };
}
/**
 * The cells of the group header row over the drawn columns: one per run of neighbouring columns of
 * the same group, and gaps over ungrouped columns and the `leading` and `trailing` fixed columns.
 */
export function groupColumnCells(columns, groups, edges) {
    const groupOf = new Map(groups.flatMap((group) => group.columns.map((id) => [id, group])));
    const entries = [
        ...Array.from({ length: edges.leading }, () => null),
        ...columns.map((column) => groupOf.get(column.id) ?? null),
        ...Array.from({ length: edges.trailing }, () => null),
    ];
    const cells = [];
    for (const group of entries) {
        const last = cells.at(-1);
        if (last && last.group === group)
            last.span += 1;
        else
            cells.push({ key: `${group?.id ?? 'ui-table-gap'}:${cells.length}`, group, span: 1 });
    }
    return cells;
}
//# sourceMappingURL=table-columns.js.map