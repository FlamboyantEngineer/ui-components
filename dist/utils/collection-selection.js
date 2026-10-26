import { fromCollectionKey } from './from-collection-key.js';
import { toCollectionKey } from './to-collection-key.js';
import { materializeIterator } from './materialize-iterator.js';
const primitiveSelections = new WeakMap();
/** Restores the caller's key types after a primitive changes selection. */
export function fromCollectionSelection(keys) {
    if (keys === 'all')
        return keys;
    const decoded = new Set([...keys].map(fromCollectionKey));
    primitiveSelections.set(decoded, keys);
    return decoded;
}
/** Reuses an unchanged event selection so the primitive keeps its range-selection anchor. */
export function toCollectionSelection(keys) {
    if (keys === undefined || keys === 'all')
        return keys;
    const encoded = new Set(Array.from(materializeIterator(keys), toCollectionKey));
    const original = keys instanceof Set ? primitiveSelections.get(keys) : undefined;
    return original &&
        original.size === encoded.size &&
        [...encoded].every((key) => original.has(key))
        ? original
        : encoded;
}
/** Adapts controlled, initial and disabled selections at a collection boundary. */
export function toCollectionSelectionProps({ selectedKeys, defaultSelectedKeys, disabledKeys, onSelectionChange, }) {
    return {
        selectedKeys: toCollectionSelection(selectedKeys),
        defaultSelectedKeys: toCollectionSelection(defaultSelectedKeys),
        disabledKeys: disabledKeys === undefined
            ? undefined
            : Array.from(materializeIterator(disabledKeys), toCollectionKey),
        onSelectionChange: onSelectionChange && ((keys) => onSelectionChange(fromCollectionSelection(keys))),
    };
}
//# sourceMappingURL=collection-selection.js.map