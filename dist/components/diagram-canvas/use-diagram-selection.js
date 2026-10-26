import { useControllableState } from '../../core/controllable-state.js';
function toSelection(keys) {
    if (keys === undefined)
        return undefined;
    return keys === 'all' ? 'all' : new Set(keys);
}
/** The selected nodes and edges, controlled or not, in the canvas's selection mode. */
export function useDiagramSelection(options) {
    const { selectionMode, allKeys } = options;
    const [value, setValue] = useControllableState(toSelection(options.selectedKeys), toSelection(options.defaultSelectedKeys) ?? new Set(), options.onSelectionChange);
    const selected = value === 'all' ? new Set(allKeys) : value;
    const replace = (keys) => {
        if (selectionMode === 'none')
            return;
        const next = selectionMode === 'single' ? keys.slice(0, 1) : keys;
        const isSame = next.length === selected.size && next.every((key) => selected.has(key));
        if (!isSame)
            setValue(new Set(next));
    };
    const select = (key, toggle) => {
        if (!toggle || selectionMode !== 'multiple') {
            replace([key]);
            return;
        }
        const next = new Set(selected);
        if (next.has(key))
            next.delete(key);
        else
            next.add(key);
        setValue(next);
    };
    return { selected, select, replace };
}
//# sourceMappingURL=use-diagram-selection.js.map