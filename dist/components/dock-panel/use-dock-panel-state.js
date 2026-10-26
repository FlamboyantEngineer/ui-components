import { useState } from 'react';
import { usePersistentState } from '../../core/provider.js';
import { clamp } from '../../utils/clamp.js';
function isKey(value) {
    return typeof value === 'string' || typeof value === 'number';
}
function isSize(value) {
    return typeof value === 'number' && Number.isFinite(value);
}
/** Reads a stored panel state, refusing anything that is not one so the defaults apply. */
const storedStateCodec = {
    parse(raw) {
        const value = JSON.parse(raw);
        if (typeof value !== 'object' || value === null)
            throw new Error('Not a panel state');
        const { selectedKey, isExpanded, size } = value;
        return {
            selectedKey: isKey(selectedKey) ? selectedKey : undefined,
            isExpanded: typeof isExpanded === 'boolean' ? isExpanded : undefined,
            size: isSize(size) ? size : undefined,
        };
    },
    stringify: (state) => JSON.stringify(state),
};
/** The first candidate that names an enabled pane, else the first enabled pane. */
function resolveSelectedKey(candidates, enabledKeys) {
    const match = candidates.find((key) => isKey(key) && enabledKeys.includes(key));
    return isKey(match) ? match : (enabledKeys[0] ?? null);
}
/**
 * The selected pane, the expanded state and the size of an dock panel, each controlled or held by
 * the panel, which restores and saves the values it holds under `persistKey`.
 */
export function useDockPanelState(options) {
    const { enabledKeys, onSelectionChange, onExpandedChange, onSizeChange } = options;
    const [stored, setStored] = usePersistentState(options.persistKey, {}, storedStateCodec);
    const [liveSize, setLiveSize] = useState(null);
    const isSizeControlled = options.size !== undefined;
    const store = (patch) => setStored((current) => ({ ...current, ...patch }));
    const rawSize = options.size ?? liveSize ?? stored.size ?? options.defaultSize;
    return {
        selectedKey: resolveSelectedKey([options.selectedKey, stored.selectedKey, options.defaultSelectedKey], enabledKeys),
        setSelectedKey(key) {
            if (options.selectedKey === undefined)
                store({ selectedKey: key });
            onSelectionChange?.(key);
        },
        isExpanded: options.isExpanded ?? stored.isExpanded ?? options.defaultExpanded,
        setExpanded(isExpanded) {
            if (options.isExpanded === undefined)
                store({ isExpanded });
            onExpandedChange?.(isExpanded);
        },
        size: clamp(rawSize, options.minSize, options.maxSize),
        changeSize(size) {
            if (!isSizeControlled)
                setLiveSize(size);
            onSizeChange?.(size);
        },
        commitSize(size) {
            if (isSizeControlled)
                return;
            setLiveSize(null);
            store({ size });
        },
    };
}
//# sourceMappingURL=use-dock-panel-state.js.map