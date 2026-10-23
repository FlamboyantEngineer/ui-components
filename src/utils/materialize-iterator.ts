const snapshots = new WeakMap<object, readonly unknown[]>();

/** Retains a one-shot iterator's values while reusable collections remain live. */
export function materializeIterator<T>(items: Iterable<T>): Iterable<T> {
  if (
    ((typeof items !== 'object' || items === null) && typeof items !== 'function') ||
    typeof (items as Partial<Iterator<T>>).next !== 'function'
  ) {
    return items;
  }
  const cached = snapshots.get(items);
  if (cached) return cached as readonly T[];
  const iterator = items[Symbol.iterator]();
  const source = { [Symbol.iterator]: () => iterator };
  if (iterator !== (items as IterableIterator<T>)) return source;
  const values = Array.from(source);
  snapshots.set(items, values);
  return values;
}
