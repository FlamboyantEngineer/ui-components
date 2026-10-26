import type { FieldControlProps, FieldState } from '../field/field.js';
/** What the input does with text: type it, enter it as tags, or split a paste. */
export interface TagsInputEntry {
    /** The text in the input. */
    text: string;
    /** Takes the input's new text; a delimiter in it adds the text before it as tags. */
    type(text: string): void;
    /** Adds the whole text as tags. */
    enter(text: string): void;
    /** Whether pasted text splits into tags; otherwise it pastes as typed text. */
    splits(text: string): boolean;
    /** Adds the typed text as tags when focus leaves the input for anything but the tags. */
    addOnBlur: boolean;
}
export interface TagsInputControlProps {
    control: FieldControlProps;
    state: FieldState<string[]>;
    /** The field's label, which names the tags. */
    label: string;
    entry: TagsInputEntry;
    placeholder: string | undefined;
    /** The form name each tag submits under. */
    name: string | undefined;
}
export declare const tagsInputHooks: import("../../core/hooks.js").ComponentHooks<"input" | "group" | "tags">;
/**
 * The field's control: the tags in the library's `TagGroup`, then the text input, framed as one
 * box, and a hidden input per tag for the form. Removing a tag returns focus to the input.
 */
export declare function TagsInputControl({ control, state, label, entry, placeholder, name, }: TagsInputControlProps): import("react").JSX.Element;
//# sourceMappingURL=tags-input-parts.d.ts.map