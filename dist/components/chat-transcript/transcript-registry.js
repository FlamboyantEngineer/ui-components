import { createValueStore } from '../../utils/value-store.js';
const emptyView = {
    tabStopKey: null,
    highlightedKey: null,
    positions: new Map(),
    setSize: 0,
};
/** Creates the registry a transcript shares with its messages through context. */
export function createTranscriptRegistry() {
    const entries = new Map();
    const registered = new Set();
    const elements = new Map();
    const keys = new WeakMap();
    const listeners = new Set();
    const keysById = new Map();
    const idsByKey = new Map();
    return {
        view: createValueStore(emptyView),
        register(key, entry) {
            const previous = entries.get(key);
            entries.set(key, entry);
            registered.add(key);
            if (entry.id !== undefined && entry.id !== key) {
                keysById.set(entry.id, key);
                idsByKey.set(key, entry.id);
            }
            for (const listener of listeners)
                listener(key, entry, previous);
        },
        unregister: (key) => entries.delete(key),
        entry: (key) => entries.get(key),
        hasRegistered: (key) => registered.has(key),
        attach(key, element) {
            if (element) {
                elements.set(key, element);
                keys.set(element, key);
            }
            else {
                elements.delete(key);
            }
        },
        element: (key) => elements.get(key) ?? null,
        keyOf(element) {
            const key = keys.get(element);
            return key !== undefined && elements.get(key) === element ? key : undefined;
        },
        keyFor: (id) => keysById.get(id) ?? id,
        idFor: (key) => idsByKey.get(key) ?? key,
        listen(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
    };
}
//# sourceMappingURL=transcript-registry.js.map