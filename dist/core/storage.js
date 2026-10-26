/** An in-memory store: values last for the page session. This is the default. */
export function createMemoryStorage(initial) {
    const values = new Map(Object.entries(initial ?? {}));
    return {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => {
            values.set(key, value);
        },
        removeItem: (key) => {
            values.delete(key);
        },
    };
}
/** Wraps a storage that may throw (quota, privacy mode) so reads return null and writes are dropped. */
export function createSafeStorage(storage) {
    return {
        getItem(key) {
            try {
                return storage.getItem(key);
            }
            catch {
                return null;
            }
        },
        setItem(key, value) {
            try {
                storage.setItem(key, value);
            }
            catch {
                // Persistence is best effort.
            }
        },
        removeItem(key) {
            try {
                storage.removeItem(key);
            }
            catch {
                // Persistence is best effort.
            }
        },
    };
}
//# sourceMappingURL=storage.js.map