// The loaded nodes of a tree select field's hierarchy, by key: where each sits, its ancestors and
// descendants, and the chosen keys read and changed against them.
/** Reuses shared parent paths while checking a fixed set of selected ancestors. */
function createAncestorCheck(index, chosen) {
    const known = new Map();
    return (key) => {
        const pending = new Set();
        let parent = index.get(key)?.parent ?? null;
        let covered = false;
        while (parent !== null && !pending.has(parent)) {
            if (chosen.has(parent)) {
                covered = true;
                break;
            }
            const previous = known.get(parent);
            if (previous !== undefined) {
                covered = previous;
                break;
            }
            pending.add(parent);
            parent = index.get(parent)?.parent ?? null;
        }
        for (const ancestor of pending)
            known.set(ancestor, covered);
        return covered;
    };
}
/** Indexes every loaded node of `items` by its `id`, in reading (depth-first) order. */
export function indexTreeItems(items, getChildren) {
    const index = new Map();
    const stack = [{ items, parent: null, position: 0 }];
    while (stack.length > 0) {
        const frame = stack.at(-1);
        const item = frame.items[frame.position++];
        if (!item) {
            stack.pop();
            continue;
        }
        if (index.has(item.id))
            continue;
        index.set(item.id, { item, parent: frame.parent, order: index.size });
        const children = getChildren(item);
        if (children?.length)
            stack.push({ items: children, parent: item.id, position: 0 });
    }
    return index;
}
/** The distinct ancestors of loaded keys, visiting a shared parent path only once. */
export function collectAncestorKeys(index, keys) {
    const ancestors = new Set();
    for (const key of keys) {
        let parent = index.get(key)?.parent ?? null;
        while (parent !== null && !ancestors.has(parent)) {
            ancestors.add(parent);
            parent = index.get(parent)?.parent ?? null;
        }
    }
    return ancestors;
}
/** The keys of the ancestors of `key`, from the top level down; none for an unknown key. */
export function getAncestorKeys(index, key) {
    return [...collectAncestorKeys(index, [key])].reverse();
}
/** `keys` in reading order; keys of nodes not loaded follow, in their own order. */
export function orderChosenKeys(keys, index) {
    const rank = (key) => index.get(key)?.order ?? Number.MAX_SAFE_INTEGER;
    return [...new Set(keys)].sort((a, b) => rank(a) - rank(b));
}
/** The chosen keys none of whose ancestors is chosen: one entry per chosen branch. */
export function getTopChosenKeys(keys, index) {
    const hasChosenAncestor = createAncestorCheck(index, new Set(keys));
    return keys.filter((key) => !hasChosenAncestor(key));
}
/**
 * `keys` without `key`; with `cascade`, also without its descendants and ancestors, as a cascading
 * selection drops them along with it.
 */
export function removeChosenKey(keys, { key, index, cascade }) {
    if (!cascade)
        return keys.filter((candidate) => candidate !== key);
    const ancestors = new Set(getAncestorKeys(index, key));
    const isDescendant = createAncestorCheck(index, new Set([key]));
    return keys.filter((candidate) => candidate !== key && !ancestors.has(candidate) && !isDescendant(candidate));
}
//# sourceMappingURL=tree-index.js.map