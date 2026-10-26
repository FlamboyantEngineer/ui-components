// How a file field's value differs from its committed value, and how one removed file goes back.
/** Compares the value with the committed value by file id. */
export function compareFileItems(value, committed) {
    const held = new Set(value.map(({ id }) => id));
    const kept = new Set(committed.map(({ id }) => id));
    return {
        added: new Set([...held].filter((id) => !kept.has(id))),
        removed: committed.filter(({ id }) => !held.has(id)),
    };
}
/**
 * The value with a removed committed file put back before the first file that follows it in the
 * committed order, or at the end.
 */
export function restoreFileItem(value, committed, item) {
    const order = new Map(committed.map(({ id }, index) => [id, index]));
    const position = order.get(item.id) ?? committed.length;
    const at = value.findIndex(({ id }) => (order.get(id) ?? Infinity) > position);
    const next = [...value];
    next.splice(at === -1 ? next.length : at, 0, item);
    return next;
}
//# sourceMappingURL=file-field-changes.js.map