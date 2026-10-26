import type { ReactNode } from 'react';
import type { Key } from '../../core/props.js';
import type { IconSource } from '../icon/icon.js';
/** One suggestion. */
export interface ComboboxOption {
    id: Key;
    /** The text shown, matched while typing, and written to the input when chosen. */
    label: string;
    description?: ReactNode;
    icon?: IconSource;
    isDisabled?: boolean | undefined;
}
/** A titled group of suggestions. */
export interface ComboboxSection {
    id: Key;
    title: ReactNode;
    options: readonly ComboboxOption[];
}
export type ComboboxItem = ComboboxOption | ComboboxSection;
/** The text the reader typed, and the option the input now completes it with. */
export interface ComboboxCompletion {
    /** What the reader typed. */
    typed: string;
    /** The input's text: `typed` followed by the rest of the option's label. */
    text: string;
    /** The completing option. */
    key: Key;
}
/** The nodes of a React Aria collection the combobox reads to find its first option. */
interface OptionCollection {
    [Symbol.iterator](): Iterator<{
        key: Key;
        type: string;
    }>;
    getChildren?(key: Key): Iterable<{
        key: Key;
        type: string;
    }>;
}
export declare function isSection(item: ComboboxItem): item is ComboboxSection;
/** Every option, in display order, sections opened. */
export declare function flattenOptions(items: Iterable<ComboboxItem> | undefined): ComboboxOption[];
/** Whether an option's label is `text`, ignoring case and surrounding spaces. */
export declare function hasOptionLabelled(options: readonly ComboboxOption[], text: string): boolean;
/**
 * The completion of `typed`: the first enabled option whose label starts with it, ignoring case and
 * longer than it, with the input's text keeping the typed characters as typed.
 */
export declare function findCompletion(options: readonly ComboboxOption[], typed: string): ComboboxCompletion | null;
/** The key of the first item of a collection that `isDisabled` lets through, inside sections too. */
export declare function findFirstOptionKey(collection: OptionCollection, isDisabled: (key: Key) => boolean): Key | null;
export {};
//# sourceMappingURL=combobox-options.d.ts.map