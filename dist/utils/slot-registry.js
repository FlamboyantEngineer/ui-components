// Commit-time registry of named element slots, read back by the component that rendered them.
/**
 * Creates a registry that components fill through ref callbacks and read on demand, instead of
 * querying their own markup for slot classes.
 */
export function createSlotRegistry() {
    const nodes = new Map();
    const callbacks = new Map();
    const callbackFor = (key) => {
        let callback = callbacks.get(key);
        if (!callback) {
            callback = (node) => {
                if (node)
                    nodes.set(key, node);
                else
                    nodes.delete(key);
            };
            callbacks.set(key, callback);
        }
        return callback;
    };
    return {
        ref: (slot) => callbackFor(slot),
        refAt: (slot, index) => callbackFor(`${slot}:${index}`),
        read: (slot) => nodes.get(slot) ?? null,
        readAll(slot) {
            const prefix = `${slot}:`;
            return [...nodes.entries()]
                .filter(([key]) => key.startsWith(prefix))
                .map(([key, node]) => [Number(key.slice(prefix.length)), node])
                .sort(([left], [right]) => left - right)
                .map(([, node]) => node);
        },
    };
}
//# sourceMappingURL=slot-registry.js.map