import { type FieldAsyncValidate } from './field-async.js';
import { type FieldValidationBehavior, type FieldValidationMode } from './field-scope.js';
import { type FieldIssue, type FieldIssues, type FieldValidation } from './field-validation.js';
export type { FieldAsyncValidate } from './field-async.js';
export type { FieldValidationBehavior, FieldValidationErrors, FieldValidationMode, } from './field-scope.js';
export type { FieldIssue, FieldIssues, FieldSeverity, FieldStatus, FieldValidation, FieldValidity, } from './field-validation.js';
export interface FieldStateOptions<T> {
    /** The current value, controlled. */
    value?: T | undefined;
    /** The field's default: the value of a new field and the target of the Set to default action. */
    defaultValue?: T | undefined;
    /** The value last committed (saved), controlled. Dirty state and Restore compare against it. */
    committedValue?: T | undefined;
    /** The value the Clear action sets. Without it the field cannot be cleared. */
    emptyValue?: T | undefined;
    onChange?: ((value: T) => void) | undefined;
    /** Called when the field commits a value that differs from its committed value. */
    onCommit?: ((value: T) => void) | undefined;
    /** Checks a value during render, after the required check. It must be pure. */
    validate?: ((value: T) => FieldIssues) | undefined;
    /** A check that may wait (for a server). It runs once the value settles; the field is pending meanwhile. */
    validateAsync?: FieldAsyncValidate<T> | undefined;
    /** How long the value must stay unchanged before `validateAsync` runs, in milliseconds. Defaults to 0. */
    validationDebounce?: number | undefined;
    /** When the field shows its validation. Defaults to the enclosing form's mode, else `immediate`. */
    validationMode?: FieldValidationMode | undefined;
    /** How the field reports validation to the browser. Defaults to the enclosing form's, else `aria`. */
    validationBehavior?: FieldValidationBehavior | undefined;
    /** The form name. Errors an enclosing form gives for it show until the value changes. */
    name?: string | undefined;
    /** An empty value is an error, and the field cannot be cleared. */
    isRequired?: boolean | undefined;
    isReadOnly?: boolean | undefined;
    /** Refuses every change. An enclosing disabled fieldset disables the field too. */
    isDisabled?: boolean | undefined;
    /** A check of the value is in progress: `pending` status unless the value has an error. */
    isPending?: boolean | undefined;
}
/** A field's value, committed value, validation and history, with the actions that change them. */
export interface FieldState<T> {
    value: T;
    committedValue: T;
    /** The validation the field shows, which waits for its validation mode. */
    validation: FieldValidation;
    /** The validation of the current value, shown or not: what a form checks before it submits. */
    realtimeValidation: FieldValidation;
    /** Every issue the field shows, errors first. */
    issues: readonly FieldIssue[];
    /** The value differs from the committed value (never while read-only or disabled). */
    isDirty: boolean;
    /** Focus has left the field at least once. */
    isTouched: boolean;
    isRequired: boolean;
    isReadOnly: boolean;
    isDisabled: boolean;
    validationBehavior: FieldValidationBehavior;
    canUndo: boolean;
    canRedo: boolean;
    canClear: boolean;
    canSetDefault: boolean;
    /** Changes the value while editing. */
    setValue(value: T): void;
    /** Finishes an edit: the current value becomes the committed value and `onCommit` runs. */
    commit(): void;
    /** Puts the committed value back. */
    restore(): void;
    clear(): void;
    setToDefault(): void;
    undo(): void;
    redo(): void;
    /** Records that focus left the field, which shows a `blur` mode field's validation. */
    touch(): void;
    /** Shows the validation now, whatever the validation mode. */
    revealValidation(): void;
}
/**
 * The controller every field is built on: it holds or relays the value, knows the committed value,
 * validates, tracks dirty state and keeps a per-field undo history of every value the field shows.
 * A read-only or disabled field refuses every change.
 */
export declare function useFieldState<T>(options: FieldStateOptions<T>): FieldState<T>;
//# sourceMappingURL=field-state.d.ts.map