import { useMemo } from 'react';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { isSection } from './combobox-options.js';
function encodeComboboxValue(value) {
    if (value === null || value === undefined)
        return value;
    return Array.isArray(value) ? value.map(toCollectionKey) : toCollectionKey(value);
}
/** Retains selection identity while the input and remote search rerender independently. */
export function useComboboxValues(value, defaultValue) {
    return {
        value: useMemo(() => encodeComboboxValue(value), [value]),
        defaultValue: useMemo(() => encodeComboboxValue(defaultValue), [defaultValue]),
    };
}
export function decodeComboboxValue(value) {
    if (value === null)
        return value;
    return Array.isArray(value) ? value.map(fromCollectionKey) : fromCollectionKey(value);
}
export function encodeComboboxItems(items) {
    return Array.from(items, (item) => isSection(item)
        ? {
            ...item,
            id: toCollectionKey(item.id),
            options: item.options.map((option) => ({ ...option, id: toCollectionKey(option.id) })),
        }
        : { ...item, id: toCollectionKey(item.id) });
}
//# sourceMappingURL=combobox-values.js.map