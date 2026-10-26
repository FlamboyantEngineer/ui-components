import { isEmptyValue } from '../../utils/is-empty-value.js';
// How a field decides its validation: its issues, its status and message, and when it shows them.
import { useCallback, useState } from 'react';
import { isFieldValueEqual } from './field-value.js';
const valid = { validation: { status: 'valid' }, issues: [] };
/** The issues of a check's result as a list. */
export function toIssueList(issues) {
    if (!issues)
        return [];
    return Array.isArray(issues) ? [...issues] : [issues];
}
/**
 * The value's own issues: a required field left empty has only `valueMissing`; otherwise the
 * caller's `validate` decides.
 */
export function checkFieldValue(value, rules, strings) {
    if (rules.isRequired && isEmptyValue(value)) {
        return [{ severity: 'error', message: strings.valueRequired, validity: 'valueMissing' }];
    }
    return toIssueList(rules.validate?.(value));
}
/**
 * The status and message of a set of issues: an error makes the field invalid, then a check in
 * progress makes it pending, then a warning; otherwise it is valid.
 */
export function resolveFieldValidation(issues, isPending, strings) {
    const errors = issues.filter((issue) => issue.severity === 'error');
    const warnings = issues.filter((issue) => issue.severity === 'warning');
    const ordered = [...errors, ...warnings];
    const [error] = errors;
    const [warning] = warnings;
    if (error)
        return { validation: { status: 'invalid', message: error.message }, issues: ordered };
    if (isPending) {
        return { validation: { status: 'pending', message: strings.validating }, issues: ordered };
    }
    if (warning)
        return { validation: { status: 'warning', message: warning.message }, issues: ordered };
    return valid;
}
/** The result a field shows: the full result once revealed, else only external errors. */
export function selectShownValidation(realtime, shown, strings) {
    if (shown.isRevealed)
        return realtime;
    return shown.external.length > 0 ? resolveFieldValidation(shown.external, false, strings) : valid;
}
function isRevealedBy(mode, flags) {
    if (mode === 'immediate' || flags.revealed)
        return true;
    if (mode === 'change')
        return flags.changed || flags.touched;
    return mode === 'blur' && flags.touched;
}
/** Tracks the edits, focus and submits that let a field show its validation in its mode. */
export function useFieldReveal(mode) {
    const [flags, setFlags] = useState({ changed: false, touched: false, revealed: false });
    const set = useCallback((flag) => setFlags((current) => (current[flag] ? current : { ...current, [flag]: true })), []);
    return {
        isRevealed: isRevealedBy(mode, flags),
        isTouched: flags.touched,
        touch: useCallback(() => set('touched'), [set]),
        markChanged: useCallback(() => set('changed'), [set]),
        revealValidation: useCallback(() => set('revealed'), [set]),
    };
}
function toErrorList(entry) {
    const messages = typeof entry === 'string' ? [entry] : [...(entry ?? [])];
    return messages.map((message) => ({ severity: 'error', message, validity: 'customError' }));
}
/**
 * The external errors given for the field's name. A new errors object shows them again; they clear
 * once the value changes from the value they were given for.
 */
export function useExternalIssues(errors, name, value) {
    const [shown, setShown] = useState({ errors, value, isCleared: false });
    let current = shown;
    if (errors !== shown.errors) {
        current = { errors, value, isCleared: false };
        setShown(current);
    }
    else if (!shown.isCleared && !isFieldValueEqual(value, shown.value)) {
        current = { ...shown, isCleared: true };
        setShown(current);
    }
    if (current.isCleared || !name || !errors)
        return [];
    return toErrorList(errors[name]);
}
//# sourceMappingURL=field-validation.js.map