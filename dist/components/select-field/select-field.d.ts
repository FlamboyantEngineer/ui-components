import type { TreeItemData } from '../tree/tree.js';
import { type SelectTreeFieldProps } from './select-tree-field.js';
import type { OpenStateProps } from '../../core/events.js';
import type { Key } from '../../core/props.js';
import { type FieldInputProps } from '../field/field.js';
import type { SelectFieldOptionRenderer } from './select-option.js';
import { type SelectFieldItem } from './select-options.js';
import type { SelectFieldLoader } from './select-search.js';
export type SelectFieldSelectionMode = 'single' | 'multiple';
/** One key or none for a single select, a list of keys for a multiple select. */
export type SelectFieldValue<M extends SelectFieldSelectionMode = 'single'> = M extends 'multiple' ? Key[] : Key | null;
export interface SelectListFieldProps<M extends SelectFieldSelectionMode = 'single'> extends FieldInputProps<SelectFieldValue<M>>, OpenStateProps {
    /**
     * The choices, in display order, and groups of them shown as headed sections; a multiple value
     * follows this order. Group ids must differ from option ids.
     */
    options: readonly SelectFieldItem[];
    /** Flat choices and headed groups. Defaults to `list`. */
    mode?: 'list' | undefined;
    /** `single` (the default) or `multiple`. */
    selectionMode?: M | undefined;
    /** The trigger's text while nothing is chosen. Defaults to the provider string. */
    placeholder?: string | undefined;
    /** A single select lists a first option with this label that chooses no value. */
    emptyLabel?: string | undefined;
    /** Draws a filter input in the open list. Defaults to on for more than 10 options or a search. */
    filterable?: boolean | undefined;
    /** Searches options as the reader types in the filter, instead of filtering `options`. */
    loadOptions?: SelectFieldLoader | undefined;
    /** Shortest query that runs `loadOptions`. Defaults to 1. */
    minSearchLength?: number | undefined;
    /** Milliseconds to wait after a keystroke before running `loadOptions`. Defaults to 240. */
    searchDelay?: number | undefined;
    /** Draws a button after the trigger that clears the value in one press. */
    isClearable?: boolean | undefined;
    /** The most values a multiple select takes; once reached, the other options are disabled. */
    maxValues?: number | undefined;
    /** Draws each option's content in the list instead of its icon, label and description. */
    renderOption?: SelectFieldOptionRenderer | undefined;
    /** Renders only the options in view, for very long lists. */
    virtualized?: boolean | undefined;
    /** The form name the chosen ids are submitted under. */
    name?: string | undefined;
    /** Focuses the trigger when the field mounts. */
    autoFocus?: boolean | undefined;
}
export type SelectFieldMode = 'list' | 'tree';
export type SelectFieldProps<M extends SelectFieldSelectionMode = 'single', T extends TreeItemData = TreeItemData> = SelectListFieldProps<M> | SelectTreeFieldProps<T, M>;
/** A field choosing one or several values from a list, icon choices or a searchable tree. */
export declare function SelectField<M extends SelectFieldSelectionMode = 'single', T extends TreeItemData = TreeItemData>(props: SelectFieldProps<M, T>): import("react").JSX.Element;
export type { SelectFieldValueDisplay } from './select-tree-field.js';
export { SelectControl } from './select-control.js';
export type { SelectKeysValue } from './select-control.js';
export type { SelectFieldOptionRenderer, SelectFieldOptionState } from './select-option.js';
export type { SelectFieldGroup, SelectFieldItem, SelectFieldOption } from './select-options.js';
export type { SelectFieldLoader, SelectFieldPage } from './select-search.js';
//# sourceMappingURL=select-field.d.ts.map