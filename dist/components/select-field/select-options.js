// The option model of a select field: chosen keys, their order, their options and what changed.
export function isSelectFieldGroup(item) {
    return 'options' in item && Array.isArray(item.options);
}
/** The options of a list of options and groups, in display order. */
export function flattenSelectItems(items) {
    return items.flatMap((item) => (isSelectFieldGroup(item) ? item.options : [item]));
}
/** The chosen keys of a single (`Key | null`) or multiple (`Key[]`) value, without repeats. */
export function toSelectKeys(value) {
    if (value === null || value === undefined || value === '')
        return [];
    const keys = Array.isArray(value) ? value : [value];
    return [...new Set(keys)];
}
/** Options without repeated keys, the first of each key winning, in the order given. */
export function mergeSelectOptions(...lists) {
    const byKey = new Map();
    for (const option of lists.flat()) {
        if (!byKey.has(option.id))
            byKey.set(option.id, option);
    }
    return [...byKey.values()];
}
/** Orders chosen keys by the options' order; keys no option names keep their order after them. */
export function orderSelectKeys(keys, options) {
    const chosen = new Set(keys);
    const ordered = options.map((option) => option.id).filter((key) => chosen.has(key));
    const known = new Set(ordered);
    return [...ordered, ...keys.filter((key) => !known.has(key))];
}
/** The option of each chosen key, or a stand-in labelled with the key when no option names it. */
export function resolveSelectOptions(keys, options) {
    const byKey = new Map(options.map((option) => [option.id, option]));
    return keys.map((key) => {
        const option = byKey.get(key);
        return option
            ? { ...option, isMissing: false }
            : { id: key, label: String(key), isMissing: true };
    });
}
/** The keys a value added to, and removed from, the committed value. */
export function diffSelectKeys(keys, committedKeys) {
    const current = new Set(keys);
    const committed = new Set(committedKeys);
    return {
        added: new Set(keys.filter((key) => !committed.has(key))),
        removed: committedKeys.filter((key) => !current.has(key)),
    };
}
//# sourceMappingURL=select-options.js.map