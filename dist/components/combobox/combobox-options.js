export function isSection(item) {
    return 'options' in item;
}
/** Every option, in display order, sections opened. */
export function flattenOptions(items) {
    return [...(items ?? [])].flatMap((item) => (isSection(item) ? [...item.options] : [item]));
}
/** Whether an option's label is `text`, ignoring case and surrounding spaces. */
export function hasOptionLabelled(options, text) {
    const wanted = text.trim().toLocaleLowerCase();
    return options.some((option) => option.label.toLocaleLowerCase() === wanted);
}
/**
 * The completion of `typed`: the first enabled option whose label starts with it, ignoring case and
 * longer than it, with the input's text keeping the typed characters as typed.
 */
export function findCompletion(options, typed) {
    if (!typed)
        return null;
    const prefix = typed.toLocaleLowerCase();
    const option = options.find((candidate) => !candidate.isDisabled &&
        candidate.label.length > typed.length &&
        candidate.label.toLocaleLowerCase().startsWith(prefix));
    if (!option)
        return null;
    return { typed, text: typed + option.label.slice(typed.length), key: option.id };
}
/** The key of the first item of a collection that `isDisabled` lets through, inside sections too. */
export function findFirstOptionKey(collection, isDisabled) {
    for (const node of collection) {
        const nodes = node.type === 'section' ? [...(collection.getChildren?.(node.key) ?? [])] : [node];
        const first = nodes.find((child) => child.type === 'item' && !isDisabled(child.key));
        if (first)
            return first.key;
    }
    return null;
}
//# sourceMappingURL=combobox-options.js.map