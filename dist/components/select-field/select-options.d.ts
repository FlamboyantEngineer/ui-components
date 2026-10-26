import type { Key } from '../../core/props.js';
import type { IconSource } from '../icon/icon.js';
/** One choice of a select field. */
export interface SelectFieldOption {
    /** The stored value. */
    id: Key;
    /** The visible text, matched by the filter and announced. */
    label: string;
    /** Secondary text on the option's row, also matched by the filter. */
    description?: string | undefined;
    /** A built-in glyph name or icon node, shown on the row, in the trigger and on the chip. */
    icon?: IconSource;
    isDisabled?: boolean | undefined;
}
/** A headed section of a select field's options; a group without a label only sets them apart. */
export interface SelectFieldGroup {
    id: Key;
    /** The section's heading, which names its options' group. */
    label?: string | undefined;
    options: readonly SelectFieldOption[];
}
/** An entry of a select field's options: one option or a group of them. */
export type SelectFieldItem = SelectFieldOption | SelectFieldGroup;
/** The option the field shows for a chosen key; a key no option names is shown as itself. */
export interface ChosenSelectOption extends SelectFieldOption {
    isMissing: boolean;
}
export declare function isSelectFieldGroup(item: SelectFieldItem): item is SelectFieldGroup;
/** The options of a list of options and groups, in display order. */
export declare function flattenSelectItems(items: readonly SelectFieldItem[]): SelectFieldOption[];
/** The chosen keys of a single (`Key | null`) or multiple (`Key[]`) value, without repeats. */
export declare function toSelectKeys(value: Key | readonly Key[] | null | undefined): Key[];
/** Options without repeated keys, the first of each key winning, in the order given. */
export declare function mergeSelectOptions(...lists: ReadonlyArray<readonly SelectFieldOption[]>): SelectFieldOption[];
/** Orders chosen keys by the options' order; keys no option names keep their order after them. */
export declare function orderSelectKeys(keys: readonly Key[], options: readonly SelectFieldOption[]): Key[];
/** The option of each chosen key, or a stand-in labelled with the key when no option names it. */
export declare function resolveSelectOptions(keys: readonly Key[], options: readonly SelectFieldOption[]): ChosenSelectOption[];
/** The keys a value added to, and removed from, the committed value. */
export declare function diffSelectKeys(keys: readonly Key[], committedKeys: readonly Key[]): {
    added: Set<Key>;
    removed: Key[];
};
//# sourceMappingURL=select-options.d.ts.map