/** Whether a value is nullish, blank text or an empty list. */
export function isEmptyValue(value) {
    if (value === null || value === undefined)
        return true;
    if (typeof value === 'string')
        return value.trim() === '';
    return Array.isArray(value) && value.length === 0;
}
//# sourceMappingURL=is-empty-value.js.map