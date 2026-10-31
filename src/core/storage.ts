/**
 * Where components persist layout state (panel sizes, column widths, collapsed sections).
 * The library never touches browser storage itself; a host passes an adapter to `UiProvider`.
 */
export interface UiStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** An in-memory store: values last for the page session. This is the default. */
export function createMemoryStorage(initial?: Record<string, string>): UiStorage {
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
export function createSafeStorage(storage: UiStorage): UiStorage {
  return {
    getItem(key) {
      try {
        return storage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem(key, value) {
      try {
        storage.setItem(key, value);
      } catch {
        // Persistence is best effort.
      }
    },
    removeItem(key) {
      try {
        storage.removeItem(key);
      } catch {
        // Persistence is best effort.
      }
    },
  };
}
