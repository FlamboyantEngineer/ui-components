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
 * A further form name whose external errors belong to the field, such as one end of a range: they
 * clear once the part of the value `select` reads changes.
 */
export interface FieldErrorSource<T> {
  name: string | undefined;
  select: (value: T) => unknown;
}

/** One name's errors: the value they were given for, and whether a change since cleared them. */
interface NamedErrorState<T> {
  value: T;
  isCleared: boolean;
}

interface ShownErrors<T> {
  errors: FieldValidationErrors | undefined;
  /** Each name the field has had since the errors were given. */
  names: ReadonlyMap<string, NamedErrorState<T>>;
}

/** A name's own entry in an error map, never an inherited member such as `constructor`. */
function getOwnErrors(errors: FieldValidationErrors, name: string) {
  return Object.hasOwn(errors, name) ? errors[name] : undefined;
}

/**
 * The next state of each name's errors: a name seen for the first time keeps the current value as
 * the one its errors were given for, and a seen name clears once its part of the value changes.
 */
function trackNames<T>(
  names: ReadonlyMap<string, NamedErrorState<T>>,
  named: readonly { name: string | undefined; hasChanged: (given: T) => boolean }[],
  value: T,
): ReadonlyMap<string, NamedErrorState<T>> {
  let next: Map<string, NamedErrorState<T>> | null = null;
  for (const { name, hasChanged } of named) {
    if (!name) continue;
    const state = names.get(name);
    if (state && (state.isCleared || !hasChanged(state.value))) continue;
    next ??= new Map(names);
    next.set(name, state ? { ...state, isCleared: true } : { value, isCleared: false });
  }
  return next ?? names;
}

/**
 * The external errors given for the field's name and its further names. A new errors object shows
 * them again; each name's errors clear once its part of the value (the whole value for the field's
 * own name) changes from the value it had when the field first had that name for those errors.
 */
export function useExternalIssues<T>(
  value: T,
  {
    errors,
    name,
    sources = [],
    isEqual,
  }: {
    errors: FieldValidationErrors | undefined;
    name: string | undefined;
    sources?: readonly FieldErrorSource<T>[] | undefined;
    /** Whether the value is still the one the errors were given for. */
    isEqual: (left: T, right: T) => boolean;
  },
): FieldIssue[] {
  const [shown, setShown] = useState<ShownErrors<T>>({ errors, names: new Map() });
  const named = [{ name, hasChanged: (given: T) => !isEqual(value, given) }].concat(
    sources.map((source) => ({
      name: source.name,
      hasChanged: (given: T) => !isFieldValueEqual(source.select(value), source.select(given)),
    })),
  );
  const base = errors === shown.errors ? shown.names : new Map<string, NamedErrorState<T>>();
  const names = trackNames(base, named, value);
  if (errors !== shown.errors || names !== shown.names) setShown({ errors, names });
  if (!errors) return [];
  return named.flatMap((entry) =>
    entry.name && !names.get(entry.name)?.isCleared
      ? toErrorList(getOwnErrors(errors, entry.name))
      : [],
  );
}
