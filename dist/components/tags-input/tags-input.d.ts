import { type FieldInputProps } from '../field/field.js';
export interface TagsInputProps extends FieldInputProps<string[]> {
    /** A hint shown in the input while it is empty. */
    placeholder?: string | undefined;
    /** The text typed in the input and not yet added, controlled. */
    inputValue?: string | undefined;
    /** Called with the input's text as it changes. */
    onInputChange?: ((value: string) => void) | undefined;
    /** Characters that add the typed text as a tag, besides Enter. Defaults to a comma. */
    delimiters?: readonly string[] | undefined;
    /** The most tags the field takes; a tag past it is refused. */
    maxValues?: number | undefined;
    /** Accepts a tag equal to one the field already holds. */
    allowsDuplicates?: boolean | undefined;
    /** Checks a tag before it is added: a returned message refuses it. It must be pure. */
    validateTag?: ((tag: string) => string | null | undefined) | undefined;
    /** Adds the typed text as a tag when focus leaves the input. */
    addOnBlur?: boolean | undefined;
}
/**
 * A field for a list of free-text values: typed text becomes a tag on Enter, on a delimiter or when
 * pasted as a list, and shows in the library's `TagGroup` before the input. A tag the field refuses
 * (past `maxValues`, a duplicate, or refused by `validateTag`) stays in the input and the field
 * shows why. It has the field base's label, validation, dirty state, restore, undo and menu.
 */
export declare function TagsInput({ placeholder, inputValue, onInputChange, delimiters, maxValues, allowsDuplicates, validateTag, addOnBlur, ...props }: TagsInputProps): import("react").JSX.Element;
//# sourceMappingURL=tags-input.d.ts.map