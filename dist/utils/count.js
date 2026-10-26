// Count normalization and display shared by count badges and paging controls (specs/COUNT.md).
/** A whole, nonnegative count, or `undefined` when `value` is not a finite number. */
export function normalizeCount(value) {
    if (typeof value !== 'number' || !Number.isFinite(value))
        return undefined;
    return Math.max(0, Math.floor(value));
}
/**
 * The visible text of a count: `"12"`, `"9+"` above a cap of 9, or `"12+"` when more entries exist.
 * A count that is not a finite number has no text (`""`).
 */
export function formatCount(count, { max, more = false } = {}) {
    const value = normalizeCount(count);
    if (value === undefined)
        return '';
    const cap = typeof max === 'number' && max >= 0 ? normalizeCount(max) : undefined;
    if (cap !== undefined && value > cap)
        return `${cap}+`;
    return more ? `${value}+` : String(value);
}
//# sourceMappingURL=count.js.map