import type { FocusEvent, Ref, RefObject } from 'react';
import type { AriaLabellingProps, KeyboardEventProps } from '../../core/events.js';
import { type CodeEditorModel } from './use-code-editor.js';
/** The caller's props the text area takes as they are. */
export interface CodeTextAreaProps extends AriaLabellingProps, KeyboardEventProps {
    /** Shown while the source is empty. */
    placeholder?: string | undefined;
    /** The form name: a form submits the source under it. */
    name?: string | undefined;
    /** The id of the element holding the message for an invalid source. */
    'aria-errormessage'?: string | undefined;
    onFocus?: ((event: FocusEvent<HTMLTextAreaElement>) => void) | undefined;
    onBlur?: ((event: FocusEvent<HTMLTextAreaElement>) => void) | undefined;
}
/** What locks the text area and whether it reports a required source. */
export interface CodeAreaLocks {
    isReadOnly: boolean;
    isDisabled: boolean;
    isRequired: boolean | undefined;
}
export interface CodeAreaProps {
    model: CodeEditorModel;
    value: string;
    onChange: ((value: string) => void) | undefined;
    wrap: 'soft' | 'off';
    /** `false` turns typed and pasted line breaks into spaces. */
    multiline: boolean;
    id: string | undefined;
    /** The caller's text area props, without data attributes. */
    props: CodeTextAreaProps;
    locks: CodeAreaLocks;
    inputRef: Ref<HTMLTextAreaElement>;
    caretRef: RefObject<HTMLSpanElement | null>;
    isInvalid: boolean;
    describedBy: string | undefined;
    /** The completion list's id, when the editor offers completions. */
    listId: string | undefined;
}
/** The highlighted copy and the text area over it. */
export declare function CodeArea({ model, props, locks, onChange, ...area }: CodeAreaProps): import("react").JSX.Element;
//# sourceMappingURL=code-area.d.ts.map