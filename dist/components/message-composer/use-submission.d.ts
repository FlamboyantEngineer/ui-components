import type { ComposerFormat } from './use-composer-state.js';
export interface SubmissionOptions<T> {
    onSubmit?: ((value: T) => void | Promise<unknown>) | undefined;
    onSubmitError?: ((error: unknown) => void) | undefined;
    persistKey?: string | undefined;
    format: ComposerFormat<T>;
    draft: T;
    setDraft: (next: T) => void;
}
export interface Submission<T> {
    /** A message sent from this draft waits for the host to accept it. */
    isSubmitting: boolean;
    /** Sends the value; with `clearsDraft`, empties the draft once the host has accepted it. */
    send: (value: T, clearsDraft: boolean) => void;
}
/**
 * Sends through `onSubmit`. A promise it returns holds sending from the same draft until it
 * settles: once it resolves the draft empties, unless the reader has changed it since, and where
 * the draft was another key's (the conversation changed) only that key's stored draft empties. A
 * throw or a rejection keeps the draft and goes to `onSubmitError`, or is rethrown without it.
 */
export declare function useSubmission<T>(options: SubmissionOptions<T>): Submission<T>;
//# sourceMappingURL=use-submission.d.ts.map