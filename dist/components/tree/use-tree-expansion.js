import { useCallback, useMemo } from 'react';
import { usePersistentState } from '../../core/provider.js';
const keyListCodec = {
    parse(raw) {
        const value = JSON.parse(raw);
        if (!isKeyList(value))
            throw new Error('Not a list of keys');
        return value;
    },
    stringify: (keys) => JSON.stringify(keys),
};
function isKeyList(value) {
    return (Array.isArray(value) && value.every((key) => typeof key === 'string' || typeof key === 'number'));
}
/**
 * Expansion that is controlled by `expandedKeys`, or owned by the tree from `defaultExpandedKeys`
 * and, with `persistKey`, kept in the provider's storage.
 */
export function useTreeExpansion({ expandedKeys, defaultExpandedKeys, onExpandedChange, persistKey, }) {
    const isControlled = expandedKeys !== undefined;
    const [storedKeys, setStoredKeys] = usePersistentState(persistKey, () => (defaultExpandedKeys ? [...defaultExpandedKeys] : []), keyListCodec);
    const expanded = useMemo(() => new Set(isControlled ? expandedKeys : storedKeys), [isControlled, expandedKeys, storedKeys]);
    const setExpandedKeys = useCallback((keys) => {
        if (!isControlled)
            setStoredKeys([...keys]);
        onExpandedChange?.(keys);
    }, [isControlled, setStoredKeys, onExpandedChange]);
    const expand = useCallback((key) => {
        if (!expanded.has(key))
            setExpandedKeys(new Set([...expanded, key]));
    }, [expanded, setExpandedKeys]);
    return { expandedKeys: expanded, setExpandedKeys, expand };
}
//# sourceMappingURL=use-tree-expansion.js.map