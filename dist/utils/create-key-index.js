import { toCollectionKey } from './to-collection-key.js';
/** Resolves a rendered typed identity back to one of the supplied collection keys. */
export function createKeyIndex(keys) {
    const index = new Map();
    for (const key of keys)
        index.set(toCollectionKey(key), key);
    return index;
}
//# sourceMappingURL=create-key-index.js.map