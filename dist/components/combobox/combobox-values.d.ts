import type { Key } from '../../core/props.js';
import { type ComboboxItem } from './combobox-options.js';
type Value = Key | Key[] | null | undefined;
/** Retains selection identity while the input and remote search rerender independently. */
export declare function useComboboxValues(value: Value, defaultValue: Value): {
    value: Value;
    defaultValue: Value;
};
export declare function decodeComboboxValue(value: Exclude<Value, undefined>): Exclude<Value, undefined>;
export declare function encodeComboboxItems(items: Iterable<ComboboxItem>): ComboboxItem[];
export {};
//# sourceMappingURL=combobox-values.d.ts.map