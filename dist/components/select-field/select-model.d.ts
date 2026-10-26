import { type KeyboardEvent } from 'react';
import type { Key } from '../../core/props.js';
import type { FieldState } from '../field/field.js';
import type { SelectFieldOptionRenderer } from './select-option.js';
import { type ChosenSelectOption, type SelectFieldItem } from './select-options.js';
import { type SelectFieldLoader } from './select-search.js';
/** A select field's value with its selection mode erased. */
export type SelectKeysValue = Key | Key[] | null;
export interface SelectConfig {
    options: readonly SelectFieldItem[];
    placeholder?: string | undefined;
    emptyLabel?: string | undefined;
    filterable?: boolean | undefined;
    loadOptions?: SelectFieldLoader | undefined;
    minSearchLength?: number | undefined;
    searchDelay?: number | undefined;
    isClearable?: boolean | undefined;
    maxValues?: number | undefined;
    renderOption?: SelectFieldOptionRenderer | undefined;
    virtualized?: boolean | undefined;
    isOpen?: boolean | undefined;
    defaultOpen?: boolean | undefined;
    onOpenChange?: ((isOpen: boolean) => void) | undefined;
    name?: string | undefined;
    autoFocus?: boolean | undefined;
}
export interface SelectModelProps extends SelectConfig {
    state: FieldState<SelectKeysValue>;
    isMultiple: boolean;
}
/**
 * The chosen, committed, listed and known options. A single select with an `emptyLabel` lists an
 * extra first option, under a generated key, that stands for no value.
 */
export declare function useSelectModel({ state, isMultiple, ...config }: SelectModelProps): {
    search: import("./select-search.js").SelectSearch | null;
    known: import("./select-options.js").SelectFieldOption[];
    keys: Key[];
    chosen: ChosenSelectOption[];
    empty: ChosenSelectOption | null;
    added: Set<Key>;
    removed: ChosenSelectOption[];
    blockedKeys: ReadonlySet<Key>;
    isFull: boolean;
    listed: readonly SelectFieldItem[];
    /** A single select's chosen option, the empty option standing for no value. */
    single: ChosenSelectOption | null;
    /** The committed option a single select's edit replaced. */
    previous: ChosenSelectOption | null;
};
export type SelectModel = ReturnType<typeof useSelectModel>;
/** Open state (controlled or held here), the filter text and the actions that commit keys. */
export declare function useSelectActions({ state, isMultiple, ...config }: SelectModelProps, model: SelectModel, isFilterable: boolean): {
    isOpen: boolean;
    filterText: string;
    changeFilter: (text: string) => void;
    commitKeys: (next: readonly Key[]) => void;
    changeOpen(next: boolean): void;
    seedFilter(event: KeyboardEvent<HTMLElement>): void;
};
//# sourceMappingURL=select-model.d.ts.map