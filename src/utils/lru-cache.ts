interface LruCache<K, V> {
  get(key: K): V | undefined;
  set(key: K, value: V): void;
}

/** A bounded cache: reads and writes keep an entry until it is the least recently used. */
export function createLruCache<K, V>(capacity: number): LruCache<K, V> {
  if (!Number.isInteger(capacity) || capacity < 1) {
    throw new RangeError('Cache capacity must be a positive integer.');
  }
  const entries = new Map<K, V>();
  return {
    get(key: K): V | undefined {
      const value = entries.get(key);
      if (value !== undefined || entries.has(key)) {
        entries.delete(key);
        entries.set(key, value as V);
      }
      return value;
    },
    set(key: K, value: V): void {
      entries.delete(key);
      entries.set(key, value);
      if (entries.size > capacity) {
        const oldest = entries.keys().next();
        if (!oldest.done) entries.delete(oldest.value);
      }
    },
  };
}
