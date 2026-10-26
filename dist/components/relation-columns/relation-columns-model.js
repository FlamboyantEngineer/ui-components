export const emptyRelationPath = { upstream: [], downstream: [] };
/** The columns of one side, nearest first: one per chosen item, plus the one after the last. */
function resolveSide(options, direction) {
    const columns = [];
    const keys = options.path[direction];
    let source = options.item;
    for (let depth = 1; source !== undefined; depth += 1) {
        const items = options.getRelated(source, direction);
        const key = keys[depth - 1];
        const selected = key === undefined ? undefined : items.find((entry) => entry.id === key);
        columns.push({ direction, depth, source, items, selectedKey: selected?.id ?? null });
        source = selected;
    }
    return columns;
}
/**
 * The columns of a relation walk from `item`, in reading order: the upstream columns, furthest
 * first, the start item's column, then the downstream columns. Each side walks the chosen keys of
 * `path` while each is among the related items of the one before, and ends with the column of
 * the last chosen item's related items.
 */
export function resolveRelationColumns(options) {
    const own = {
        ...{ direction: 'item', depth: 0, source: options.item },
        ...{ items: [options.item], selectedKey: null },
    };
    return [
        ...resolveSide(options, 'upstream').reverse(),
        own,
        ...resolveSide(options, 'downstream'),
    ];
}
/** The chosen items along the walk, in reading order: furthest upstream to furthest downstream. */
export function listRelationTrail(columns) {
    return columns.flatMap((column) => {
        const key = column.direction === 'item' ? column.source.id : column.selectedKey;
        const item = column.items.find((entry) => entry.id === key);
        return item ? [{ item, column }] : [];
    });
}
/** `path` with `key` chosen in the column at `depth` of `direction`, dropping the choices past it. */
export function chooseRelation(path, choice) {
    const kept = path[choice.direction].slice(0, choice.depth - 1);
    return { ...path, [choice.direction]: choice.key === null ? kept : [...kept, choice.key] };
}
//# sourceMappingURL=relation-columns-model.js.map