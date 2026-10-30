'use client';

import { isEmptyValue } from '../../utils/is-empty-value.js';
// How a field decides its validation: its issues, its status and message, and when it shows them.

import { useCallback, useState } from 'react';
import type { UiStrings } from '../../core/strings.js';
import type { FieldValidationErrors, FieldValidationMode } from './field-scope.js';
import { isFieldValueEqual } from './field-value.js';

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
interface FieldValidationResult {
  validation: FieldValidation;
  issues: readonly FieldIssue[];
}

/** When a field shows its validation, and the actions that let it. */
interface FieldReveal {
  isRevealed: boolean;
  isTouched: boolean;
  /** Focus has left the field. */
  touch(): void;
  /** The value changed through the field. */
  markChanged(): void;
  /** Shows the validation now, whatever the mode. */
  revealValidation(): void;
}

const valid: FieldValidationResult = { validation: { status: 'valid' }, issues: [] };

/** The issues of a check's result as a list. */
export function toIssueList(issues: FieldIssues): FieldIssue[] {
  if (!issues) return [];
  return Array.isArray(issues) ? [...(issues as readonly FieldIssue[])] : [issues as FieldIssue];
}

/**
 * The value's own issues: a required field left empty has only `valueMissing`; otherwise the
 * caller's `validate` decides.
 */
export function checkFieldValue<T>(
  value: T,
  rules: { isRequired?: boolean | undefined; validate?: ((value: T) => FieldIssues) | undefined },
  strings: UiStrings,
): FieldIssue[] {
  if (rules.isRequired && isEmptyValue(value)) {
    return [{ severity: 'error', message: strings.valueRequired, validity: 'valueMissing' }];
  }
  return toIssueList(rules.validate?.(value));
}

/**
 * The status and message of a set of issues: an error makes the field invalid, then a check in
 * progress makes it pending, then a warning; otherwise it is valid.
 */
export function resolveFieldValidation(
  issues: readonly FieldIssue[],
  isPending: boolean,
  strings: UiStrings,
): FieldValidationResult {
  const errors = issues.filter((issue) => issue.severity === 'error');
  const warnings = issues.filter((issue) => issue.severity === 'warning');
  const ordered = [...errors, ...warnings];
  const [error] = errors;
  const [warning] = warnings;
  if (error) return { validation: { status: 'invalid', message: error.message }, issues: ordered };
  if (isPending) {
    return { validation: { status: 'pending', message: strings.validating }, issues: ordered };
  }
  if (warning)
    return { validation: { status: 'warning', message: warning.message }, issues: ordered };
  return valid;
}

/** The result a field shows: the full result once revealed, else only external errors. */
export function selectShownValidation(
  realtime: FieldValidationResult,
  shown: { external: readonly FieldIssue[]; isRevealed: boolean },
  strings: UiStrings,
): FieldValidationResult {
  if (shown.isRevealed) return realtime;
  return shown.external.length > 0 ? resolveFieldValidation(shown.external, false, strings) : valid;
}

function isRevealedBy(
  mode: FieldValidationMode,
  flags: { changed: boolean; touched: boolean; revealed: boolean },
): boolean {
  if (mode === 'immediate' || flags.revealed) return true;
  if (mode === 'change') return flags.changed || flags.touched;
  return mode === 'blur' && flags.touched;
}

/** Tracks the edits, focus and submits that let a field show its validation in its mode. */
export function useFieldReveal(mode: FieldValidationMode): FieldReveal {
  const [flags, setFlags] = useState({ changed: false, touched: false, revealed: false });
  const set = useCallback(
    (flag: keyof typeof flags) =>
      setFlags((current) => (current[flag] ? current : { ...current, [flag]: true })),
    [],
  );
  return {
    isRevealed: isRevealedBy(mode, flags),
    isTouched: flags.touched,
    touch: useCallback(() => set('touched'), [set]),
    markChanged: useCallback(() => set('changed'), [set]),
    revealValidation: useCallback(() => set('revealed'), [set]),
  };
}

function toErrorList(entry: string | readonly string[] | undefined): FieldIssue[] {
  const messages = typeof entry === 'string' ? [entry] : [...(entry ?? [])];
  return messages.map((message) => ({ severity: 'error', message, validity: 'customError' }));
}

/**
 * The external errors given for the field's name. A new errors object shows them again; they clear
 * once the value changes from the value they were given for.
 */
export function useExternalIssues<T>(
  errors: FieldValidationErrors | undefined,
  name: string | undefined,
  value: T,
): FieldIssue[] {
  const [shown, setShown] = useState({ errors, value, isCleared: false });
  let current = shown;
  if (errors !== shown.errors) {
    current = { errors, value, isCleared: false };
    setShown(current);
  } else if (!shown.isCleared && !isFieldValueEqual(value, shown.value)) {
    current = { ...shown, isCleared: true };
    setShown(current);
  }
  if (current.isCleared || !name || !errors) return [];
  return toErrorList(errors[name]);
}
