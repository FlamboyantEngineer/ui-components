import { useMemo } from 'react';
import { usePersistentState } from '../../core/provider.js';
/**
 * The collapsed columns or lanes of a board: the caller's keys when controlled, otherwise its own,
 * remembered through the provider storage when given a storage key.
 */
export function useCollapsedKeys({ value, defaultValue, onChange, storageKey, }) {
    const [own, setOwn] = usePersistentState(value === undefined ? storageKey : undefined, () => [...(defaultValue ?? [])]);
    const keys = useMemo(() => new Set(value ?? own), [value, own]);
    return {
        keys,
        setCollapsed(key, isCollapsed) {
            const next = new Set(keys);
            if (isCollapsed)
                next.add(key);
            else
                next.delete(key);
            if (value === undefined)
                setOwn([...next]);
            onChange?.(next);
        },
    };
}
//# sourceMappingURL=use-board-collapse.js.map