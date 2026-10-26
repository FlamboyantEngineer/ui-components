import { type PersistCodec } from '../../core/provider.js';
/** How a composer reads its value as text and turns text back into its value. */
export interface ComposerFormat<T> {
    empty: T;
    toText: (value: T) => string;
    fromText: (text: string) => T;
    /** How the draft is stored under `persistKey`. */
    codec: PersistCodec<T>;
}
export interface ComposerStateOptions<T> {
    value?: T | undefined;
    defaultValue?: T | undefined;
    onChange?: ((value: T) => void) | undefined;
    onSubmit?: ((value: T) => void | Promise<unknown>) | undefined;
    onSubmitError?: ((error: unknown) => void) | undefined;
    persistKey?: string | undefined;
    editValue?: T | undefined;
    history?: readonly string[] | undefined;
    onEditLast?: (() => void) | undefined;
    /** Sending waits, as while disabled or pending. */
    isBlocked: boolean;
    allowsEmptySubmit?: boolean | undefined;
    format: ComposerFormat<T>;
}
/** Which way the arrows step through earlier messages. */
export type RecallDirection = 'older' | 'newer';
export interface ComposerState<T> {
    /** What the input shows: the message being edited, else the draft. */
    value: T;
    /** The draft, also while another message is being edited. */
    draft: T;
    setValue: (next: T) => void;
    isEditing: boolean;
    /** The value can be sent now. */
    canSubmit: boolean;
    /** A sent message waits for the host to accept it. */
    isSubmitting: boolean;
    /** Sends the value when it can be sent, then empties the draft (an edit stays for the host). */
    submit: () => void;
    /** Steps through the history, or asks to edit the last message; whether the key was used. */
    recall: (direction: RecallDirection) => boolean;
}
/**
 * A composer's text: the draft (controlled, own or persisted), the message being edited, the
 * recall of earlier messages with the arrows, and sending. The arrows recall only while the
 * composer is empty or shows a recalled message the reader has not changed.
 */
export declare function useComposerState<T>(options: ComposerStateOptions<T>): ComposerState<T>;
//# sourceMappingURL=use-composer-state.d.ts.map