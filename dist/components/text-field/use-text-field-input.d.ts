import { type KeyboardEvent, type RefObject } from 'react';
import { type Completion, type CompletionSource, type TextCompletions } from '../completion-list/completion-list.js';
import type { FieldState } from '../field/field.js';
import { type TextFieldInputProps } from './text-field-parts.js';
import { type InputTransform } from './use-input-transform.js';
export interface TextFieldInputOptions {
    state: FieldState<string>;
    multiline: boolean;
    placeholder: string | undefined;
    transformInput: ((text: string) => string) | undefined;
    displayValue: string | undefined;
    /** A vocabulary or a source of completions for the text before the caret. */
    completions: readonly Completion[] | CompletionSource | undefined;
    /** The caller's key handler, which runs after the field's for keys the completion list did not use. */
    onKeyDown: ((event: KeyboardEvent) => void) | undefined;
}
export interface TextFieldInput {
    /** The input's or text area's own props. */
    input: TextFieldInputProps;
    /** The text the control shows: the display value at rest, else the value. */
    text: string;
    /** The control shows the display value. */
    showsDisplayValue: boolean;
    /** Takes each edit, through the input transform. */
    transform: InputTransform;
    /** Takes the control's text after each edit: the transform, then the completion lookup. */
    onChange: (text: string) => void;
    /** The input or text area, for completions. */
    controlRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
    /** The text field element, which the completion list opens under. */
    boxRef: RefObject<HTMLDivElement | null>;
    /** The control's completions, when the field offers any. */
    completion: TextCompletions | null;
}
/**
 * The text field's control: its edit handlers, the input transform, the completion list's
 * attributes, and the text it shows, which is the display value while the control does not have
 * focus.
 */
export declare function useTextFieldInput(options: TextFieldInputOptions): TextFieldInput;
//# sourceMappingURL=use-text-field-input.d.ts.map