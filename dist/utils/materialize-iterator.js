const snapshots = new WeakMap();
/** Retains a one-shot iterator's values while reusable collections remain live. */
export function materializeIterator(items) {
    if (((typeof items !== 'object' || items === null) && typeof items !== 'function') ||
        typeof items.next !== 'function') {
        return items;
    }
    const cached = snapshots.get(items);
    if (cached)
        return cached;
    const iterator = items[Symbol.iterator]();
    const source = { [Symbol.iterator]: () => iterator };
    if (iterator !== items)
        return source;
    const values = Array.from(source);
    snapshots.set(items, values);
    return values;
}
//# sourceMappingURL=materialize-iterator.js.map