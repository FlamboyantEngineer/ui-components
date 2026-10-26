// Pure comparison of two values of a change: what kind of change it is, and which list items moved.
/** Whether a value is unset: nullish, an empty text or an empty list. */
export function isBlankValue(value) {
    return value === null || value === undefined || value.length === 0;
}
/** The kind of a change from its two values. */
export function resolveChangeKind(before, after) {
    if (isBlankValue(before) && !isBlankValue(after))
        return 'added';
    if (isBlankValue(after) && !isBlankValue(before))
        return 'removed';
    return 'changed';
}
/** Marks each item of `items` that `other` also has, matching repeated items one for one. */
function markItems(items, other, missing) {
    const counts = new Map();
    for (const value of other)
        counts.set(value, (counts.get(value) ?? 0) + 1);
    return items.map((value) => {
        const left = counts.get(value) ?? 0;
        if (left === 0)
            return { value, change: missing };
        counts.set(value, left - 1);
        return { value, change: 'unchanged' };
    });
}
/**
 * Compares two lists of texts: old items the new list lacks are `removed`, new items the old list
 * lacks are `added`, and the rest `unchanged`. Each side keeps its order; repeated items match one
 * for one.
 */
export function compareLists(before, after) {
    return { before: markItems(before, after, 'removed'), after: markItems(after, before, 'added') };
}
//# sourceMappingURL=list-changes.js.map