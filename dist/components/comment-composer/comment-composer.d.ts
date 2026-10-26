import type { BaseProps } from '../../core/props.js';
export interface CommentComposerProps extends BaseProps {
    /** The draft, controlled. */
    value?: string | undefined;
    /** The draft a new composer starts with, uncontrolled. Defaults to empty. */
    defaultValue?: string | undefined;
    /** Called with the draft as it changes. */
    onChange?: ((value: string) => void) | undefined;
    /**
     * Called with the trimmed text when the reader submits, then the draft clears. A returned promise
     * keeps the composer pending until it settles, and keeps the draft if it rejects.
     */
    onSubmit: (text: string) => void | Promise<unknown>;
    /** Called when the reader cancels, after the draft clears. Shows Cancel even while the draft is empty. */
    onCancel?: (() => void) | undefined;
    /** Names the text box. Defaults to the provider's `addComment` string. */
    label?: string | undefined;
    /** A hint shown while the draft is empty. Defaults to `label`. */
    placeholder?: string | undefined;
    /** The submit button's label. Defaults to the provider's `comment` string. */
    submitLabel?: string | undefined;
    /** Keeps an uncontrolled draft in the provider storage under this key, across remounts. */
    persistKey?: string | undefined;
    /** Refuses typing, submitting and cancelling. */
    isDisabled?: boolean | undefined;
    /** Focuses the text box when the composer mounts. */
    autoFocus?: boolean | undefined;
}
/**
 * A plain-text comment box: a multi-line `TextField` with submit and cancel buttons. Ctrl+Enter or
 * Command+Enter submits and Escape cancels. A host with mentions or rich text passes its own
 * composer where this one is the default.
 */
export declare function CommentComposer({ value, defaultValue, onChange, onSubmit, onCancel, label, placeholder, submitLabel, persistKey, isDisabled, autoFocus, className, ...rest }: CommentComposerProps): import("react").JSX.Element;
//# sourceMappingURL=comment-composer.d.ts.map