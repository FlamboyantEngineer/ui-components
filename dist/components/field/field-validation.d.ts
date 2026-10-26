import type { UiStrings } from '../../core/strings.js';
import type { FieldValidationErrors, FieldValidationMode } from './field-scope.js';
export type FieldSeverity = 'error' | 'warning';
export type FieldStatus = 'valid' | 'invalid' | 'warning' | 'pending';
/** The validity states an issue can match, named as the browser's `ValidityState` names them. */
export type FieldValidity = Exclude<keyof ValidityState, 'valid'>;
/** A problem with a field's value: an `error` makes the field invalid, a `warning` only advises. */
export interface FieldIssue {
    severity: FieldSeverity;
    message: string;
    /** The validity state the issue matches (`valueMissing`, `tooLong`, …), so a host can word it. */
    validity?: FieldValidity | undefined;
}
/** What a check returns: no issue, one, or several. */
export type FieldIssues = FieldIssue | readonly FieldIssue[] | null | undefined;
/** A field's validation result: its status and the message it shows (none while valid). */
export interface FieldValidation {
    status: FieldStatus;
    message?: string | undefined;
}
/** A validation result with every issue behind it, errors first. */
export interface FieldValidationResult {
    validation: FieldValidation;
    issues: readonly FieldIssue[];
}
/** When a field shows its validation, and the actions that let it. */
export interface FieldReveal {
    isRevealed: boolean;
    isTouched: boolean;
    /** Focus has left the field. */
    touch(): void;
    /** The value changed through the field. */
    markChanged(): void;
    /** Shows the validation now, whatever the mode. */
    revealValidation(): void;
}
/** The issues of a check's result as a list. */
export declare function toIssueList(issues: FieldIssues): FieldIssue[];
/**
 * The value's own issues: a required field left empty has only `valueMissing`; otherwise the
 * caller's `validate` decides.
 */
export declare function checkFieldValue<T>(value: T, rules: {
    isRequired?: boolean | undefined;
    validate?: ((value: T) => FieldIssues) | undefined;
}, strings: UiStrings): FieldIssue[];
/**
 * The status and message of a set of issues: an error makes the field invalid, then a check in
 * progress makes it pending, then a warning; otherwise it is valid.
 */
export declare function resolveFieldValidation(issues: readonly FieldIssue[], isPending: boolean, strings: UiStrings): FieldValidationResult;
/** The result a field shows: the full result once revealed, else only external errors. */
export declare function selectShownValidation(realtime: FieldValidationResult, shown: {
    external: readonly FieldIssue[];
    isRevealed: boolean;
}, strings: UiStrings): FieldValidationResult;
/** Tracks the edits, focus and submits that let a field show its validation in its mode. */
export declare function useFieldReveal(mode: FieldValidationMode): FieldReveal;
/**
 * The external errors given for the field's name. A new errors object shows them again; they clear
 * once the value changes from the value they were given for.
 */
export declare function useExternalIssues<T>(errors: FieldValidationErrors | undefined, name: string | undefined, value: T): FieldIssue[];
//# sourceMappingURL=field-validation.d.ts.map