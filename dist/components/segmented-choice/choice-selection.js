import { usePendingChange } from './pending-change.js';
/** What picking the selected segment of a single choice again commits, if anything. */
function resolveRepick(current, { isInherited, isClearable }) {
    if (current === null)
        return undefined;
    if (isInherited)
        return current;
    return isClearable ? null : undefined;
}
/**
 * The group's selection mode, selected keys and selection handler. A single choice applies the
 * rules for picking the selected segment again; a multiple one reports its values in option order.
 */
export function useChoiceSelection({ options, selectionMode, value, defaultValue, onChange, isInherited, isClearable, isReadOnly, }) {
    const isMultiple = selectionMode === 'multiple';
    const empty = (isMultiple ? [] : null);
    const { value: current, isPending, change: commit, } = usePendingChange(value, defaultValue ?? empty, onChange);
    if (isMultiple) {
        return {
            selectionMode: 'multiple',
            isPending,
            selectedKeys: [...current],
            onSelectionChange: (keys) => {
                if (isReadOnly)
                    return;
                const picked = options.map((option) => option.value).filter((key) => keys.has(key));
                commit(picked);
            },
        };
    }
    const single = current;
    return {
        selectionMode: 'single',
        isPending,
        selectedKeys: single === null ? [] : [single],
        // React Aria reports an empty selection when the selected segment is picked again.
        onSelectionChange: (keys) => {
            if (isReadOnly)
                return;
            const [picked] = keys;
            const next = picked === undefined ? resolveRepick(single, { isInherited, isClearable }) : String(picked);
            if (next !== undefined)
                commit(next);
        },
    };
}
//# sourceMappingURL=choice-selection.js.map