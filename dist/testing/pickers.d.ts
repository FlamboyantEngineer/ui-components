import type { NameMatch, TestUser } from './test-user.js';
export interface ComboboxPick {
    /** The text typed into the input, after clearing it. */
    text: string;
    /** The option to press; defaults to `text`. */
    option?: NameMatch | undefined;
}
/**
 * Opens the list of a `SelectField` or `Combobox` from its button, unless it is already open, and
 * presses the option named `option`. `field` is the field's root or the button itself. A multiple
 * selection stays open, so the next call picks another option from the same list.
 */
export declare function selectOption(user: TestUser, field: Element, option: NameMatch): Promise<void>;
/** Clears a combobox input, types `pick.text` and presses the suggested option. */
export declare function pickComboboxOption(user: TestUser, input: Element, pick: ComboboxPick): Promise<void>;
/**
 * Types an ISO 8601 date (`2026-05-14`) into the year, month and day segments of a date field, in
 * the order the locale draws them. `field` holds one run of segments: the field's root, or one input
 * (`ui-date-time-field__input`) of a range.
 */
export declare function pickDate(user: TestUser, field: Element, isoDate: string): Promise<void>;
//# sourceMappingURL=pickers.d.ts.map