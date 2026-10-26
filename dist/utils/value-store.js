import { useSyncExternalStore } from 'react';
/** A store holding `initial` until it is set. */
export function createValueStore(initial) {
    let value = initial;
    const listeners = new Set();
    return {
        get: () => value,
        set: (next) => {
            if (Object.is(next, value))
                return;
            value = next;
            for (const listener of listeners)
                listener();
        },
        subscribe: (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
    };
}
/** The store's value, re-rendering the caller when it changes. */
export function useStoreValue(store) {
    return useSyncExternalStore(store.subscribe, store.get, store.get);
}
//# sourceMappingURL=value-store.js.map