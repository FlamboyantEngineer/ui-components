// The plain data of a column mapping: suggestions, and the counts and problems a mapping has.
/** The mapping the suggestions make: each column to its suggested target, if it is known. */
export function suggestMapping(columns, targets, suggest) {
    const known = new Set(targets.map((target) => target.id));
    return Object.fromEntries(columns.map((column) => {
        const target = suggest?.(column, targets) ?? null;
        return [column.id, target !== null && known.has(target) ? target : null];
    }));
}
/** The target a column maps to, or `null` when it is not imported or maps to an unknown target. */
export function readMappedTarget(value, column, targets) {
    const target = value[column] ?? null;
    return target !== null && targets.some((candidate) => candidate.id === target) ? target : null;
}
/** Counts the mapped and skipped columns and finds unmapped required and duplicate targets. */
export function summarizeMapping(columns, targets, value) {
    const sources = new Map();
    for (const column of columns) {
        const target = readMappedTarget(value, column.id, targets);
        if (target !== null)
            sources.set(target, [...(sources.get(target) ?? []), column.id]);
    }
    const mappedCount = [...sources.values()].reduce((total, ids) => total + ids.length, 0);
    const unmappedRequired = targets
        .filter((target) => target.isRequired && !sources.has(target.id))
        .map((target) => target.id);
    const duplicates = Object.fromEntries([...sources].filter(([, ids]) => ids.length > 1));
    return {
        mappedCount,
        skippedCount: columns.length - mappedCount,
        unmappedRequired,
        duplicates,
        isComplete: unmappedRequired.length === 0,
    };
}
//# sourceMappingURL=mapping.js.map