import { useMemo, useRef } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { nextSortDescriptor, nextSortDescriptors, toSortDescriptors } from './table-sort.js';
/**
 * A table's sort: one column cycling through ascending, descending and unsorted, or, with a sort
 * list, several columns where a plain press sorts by one column and Shift adds or cycles a column.
 * `onChange` runs after every change, so the table can return to its first page.
 */
export function useTableSort(options, onChange) {
    const isMultiple = options.sortDescriptors !== undefined || options.defaultSortDescriptors !== undefined;
    const [single, setSingle] = useControllableState(options.sortDescriptor, options.defaultSortDescriptor ?? null, options.onSortChange);
    const [multiple, setMultiple] = useControllableState(options.sortDescriptors, options.defaultSortDescriptors ?? [], options.onSortDescriptorsChange);
    // React Aria reports the requested sort without the event, so the press notes Shift first.
    const isAdditive = useRef(false);
    const noteModifier = (event) => {
        isAdditive.current = event.shiftKey;
    };
    const descriptors = useMemo(() => (isMultiple ? multiple : toSortDescriptors(single)), [isMultiple, multiple, single]);
    const onSortChange = (requested) => {
        if (isMultiple)
            setMultiple(nextSortDescriptors(multiple, requested.column, isAdditive.current));
        else
            setSingle(nextSortDescriptor(single, requested));
        onChange();
    };
    return {
        descriptors,
        isControlled: isMultiple
            ? options.sortDescriptors !== undefined
            : options.sortDescriptor !== undefined,
        isMultiple,
        onSortChange,
        rootProps: { onPointerDownCapture: noteModifier, onKeyDownCapture: noteModifier },
    };
}
//# sourceMappingURL=use-table-sort.js.map