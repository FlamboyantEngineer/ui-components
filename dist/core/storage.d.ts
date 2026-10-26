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
export declare function createMemoryStorage(initial?: Record<string, string>): UiStorage;
/** Wraps a storage that may throw (quota, privacy mode) so reads return null and writes are dropped. */
export declare function createSafeStorage(storage: Pick<UiStorage, 'getItem' | 'setItem' | 'removeItem'>): UiStorage;
//# sourceMappingURL=storage.d.ts.map