import { type KeyboardEvent, type RefObject } from 'react';
import { type Completions, type CompletionsModel } from './use-completions.js';
type TextControl = HTMLInputElement | HTMLTextAreaElement;
export interface TextCompletionsOptions {
    completions: Completions | undefined;
    inputRef: RefObject<TextControl | null>;
    /** A read-only or disabled control offers nothing. */
    isLocked: boolean;
    /** Takes the new text when the browser cannot insert a completion as an edit. */
    setValue: (value: string) => void;
}
/** The text control's attributes that tie it to its list of completions. */
export interface CompletionInputAttributes {
    'aria-autocomplete': 'list';
    'aria-haspopup': 'listbox';
    'aria-controls': string | undefined;
    'aria-activedescendant': string | undefined;
}
export interface TextCompletions {
    model: CompletionsModel;
    /** The list's id. */
    listId: string;
    /** Props for the control: the list relationship, and the pointer and key handlers that follow the caret. */
    inputProps: CompletionInputAttributes & {
        onClick: () => void;
        onKeyUp: (event: KeyboardEvent<HTMLElement>) => void;
    };
}
/**
 * A multiline or single-line text box that autocompletes from a list, with the active option as
 * its active descendant while the list is open. It keeps its text box role.
 */
export declare function toCompletionInputAttributes(model: CompletionsModel, listId: string): CompletionInputAttributes;
/**
 * Completion for a text input or text area: the completions engine with plain insertion. A chosen
 * completion's `insertText` (or label) replaces the text it completes as an edit, and the caret
 * goes after it.
 */
export declare function useTextCompletions(options: TextCompletionsOptions): TextCompletions;
export {};
//# sourceMappingURL=text-completions.d.ts.map