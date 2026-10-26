/**
 * One value that changes often, read by a few components only: setting it re-renders the components
 * that read it through `useStoreValue`, not the component that owns the store.
 */
export interface ValueStore<T> {
    get(): T;
    /** Replaces the value and notifies the readers, unless it is the same value. */
    set(value: T): void;
    subscribe(listener: () => void): () => void;
}
/** A store holding `initial` until it is set. */
export declare function createValueStore<T>(initial: T): ValueStore<T>;
/** The store's value, re-rendering the caller when it changes. */
export declare function useStoreValue<T>(store: ValueStore<T>): T;
//# sourceMappingURL=value-store.d.ts.map