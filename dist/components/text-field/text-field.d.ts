import { type ReactNode } from 'react';
import type { FocusEventProps, KeyboardEventProps } from '../../core/events.js';
import { type Completion, type CompletionListItemState, type CompletionSource } from '../completion-list/completion-list.js';
import { type FieldInputProps, type FieldTextInputProps, type StringRules } from '../field/field.js';
/** The kind of text a single-line field takes: the input's `type`. */
export type TextFieldType = 'text' | 'email' | 'password' | 'search' | 'tel' | 'url';
export interface TextFieldProps extends FieldInputProps<string>, StringRules, FieldTextInputProps, FocusEventProps, KeyboardEventProps {
    /** The kind of text on a single line, which sets the input's `type`. Defaults to `text`. */
    type?: TextFieldType | undefined;
    /** Edit several lines in a text area instead of one line in an input. */
    multiline?: boolean | undefined;
    /** Content inside the input's frame before the text: an icon, a unit or a button. */
    startAdornment?: ReactNode;
    /** Content inside the input's frame after the text. */
    endAdornment?: ReactNode;
    /** With `type="password"`, draws a toggle button after the text that shows it while pressed. */
    allowsReveal?: boolean | undefined;
    /** With `multiline`, the rows the text area shows at least; it grows with its text from there. */
    minRows?: number | undefined;
    /** With `multiline`, the rows the text area grows to at most before it scrolls. */
    maxRows?: number | undefined;
    /** Shows the text's length (counted as `getLength` counts it), against `maxLength` when set. */
    showCount?: boolean | undefined;
    /** Rewrites each typed, pasted or dropped edit before it becomes the value; the caret stays after the same accepted characters. */
    transformInput?: ((text: string) => string) | undefined;
    /** What the control shows while it does not have focus, such as a computed result; focus shows the value for editing. */
    displayValue?: string | undefined;
    /** A vocabulary for the word before the caret, or a source that completes the text at the caret. */
    completions?: readonly Completion[] | CompletionSource | undefined;
    /** Draws a completion's content in the list instead of its label and description. */
    renderCompletion?: ((completion: Completion, state: CompletionListItemState) => ReactNode) | undefined;
}
/**
 * A field for a plain string, on one line or several. It validates its length and format, commits
 * when focus leaves the field and on Enter, and reverts an edit on Escape. Adornments and a reveal button sit inside the
 * input's frame; a counter joins the description.
 */
export declare function TextField({ minLength, maxLength, pattern, trim, getLength, multiline, placeholder, startAdornment, endAdornment, allowsReveal, minRows, maxRows, showCount, spellCheck, transformInput, displayValue, completions, renderCompletion, onKeyDown, ...props }: TextFieldProps): import("react").JSX.Element;
//# sourceMappingURL=text-field.d.ts.map