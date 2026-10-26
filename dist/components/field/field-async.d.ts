import { type FieldIssue, type FieldIssues } from './field-validation.js';
/** A check that may wait (for a server): it receives the value and a signal that aborts it. */
export type FieldAsyncValidate<T> = (value: T, signal: AbortSignal) => Promise<FieldIssues>;
export interface AsyncCheckOptions<T> {
    validateAsync: FieldAsyncValidate<T> | undefined;
    /** How long the value must stay unchanged before the check runs, in milliseconds. */
    debounce: number;
    /** Leaves the check out, as while the value already has an error. */
    isSkipped: boolean;
}
export interface AsyncCheck {
    /** The issues the check found for the current value. */
    issues: FieldIssue[];
    /** The current value waits for its check or is being checked. */
    isRunning: boolean;
}
/**
 * Runs `validateAsync` once the value has stayed unchanged for `debounce` milliseconds. A result
 * counts only for the value it checked: a newer value aborts the older check. A check that rejects
 * reports no issue.
 */
export declare function useAsyncCheck<T>(value: T, options: AsyncCheckOptions<T>): AsyncCheck;
//# sourceMappingURL=field-async.d.ts.map