/** A copy of `values` without its `undefined` entries, to merge over defaults without erasing them. */
export function omitUndefined(values) {
    return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined));
}
//# sourceMappingURL=omit-undefined.js.map