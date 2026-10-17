import { useCallback, useRef, useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { useAsyncCheck, type FieldAsyncValidate } from './field-async.js';
import {
  canStepFieldHistory,
  createFieldHistory,
  recordFieldHistory,
  stepFieldHistory,
  type FieldHistory,
} from './field-history.js';
import {
  useFieldScope,
  type FieldScope,
  type FieldValidationBehavior,
  type FieldValidationMode,
} from './field-scope.js';
import {
  checkFieldValue,
  resolveFieldValidation,
  selectShownValidation,
  useExternalIssues,
  useFieldReveal,
  type FieldIssue,
  type FieldIssues,
  type FieldValidation,
} from './field-validation.js';
import { isFieldValueEqual } from './field-value.js';

export type { FieldAsyncValidate } from './field-async.js';
export type {
  FieldValidationBehavior,
  FieldValidationErrors,
  FieldValidationMode,
} from './field-scope.js';
export type {
  FieldIssue,
  FieldIssues,
  FieldSeverity,
  FieldStatus,
  FieldValidation,
  FieldValidity,
} from './field-validation.js';

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

function firstDefined<T>(...values: Array<T | undefined>): T {
  return values.find((value) => value !== undefined) as T;
}

/** Whether a menu action has something to do: the field is editable and the target differs. */
function canApply<T>(value: T, target: T | undefined, isLocked: boolean): boolean {
  return !isLocked && target !== undefined && !isFieldValueEqual(value, target);
}

/**
 * The uncontrolled value and committed value (starting from the first of the committed value, the
 * controlled value and the default), and the history, which records every value the field shows.
 */
function useOwnValues<T>({ value, committedValue, defaultValue }: FieldStateOptions<T>) {
  const [draft, setDraft] = useState(() => firstDefined(committedValue, defaultValue));
  const [committed, setCommitted] = useState(() =>
    firstDefined(committedValue, value, defaultValue),
  );
  const [history, setHistory] = useState<FieldHistory<T>>(() =>
    createFieldHistory(firstDefined(value, committedValue, defaultValue)),
  );
  return { draft, setDraft, committed, setCommitted, history, setHistory };
}

/** The latest value, committed value, options and lock, so actions in one event see each other. */
function useLatest<T>(snapshot: {
  value: T;
  committedValue: T;
  options: FieldStateOptions<T>;
  isLocked: boolean;
}) {
  const latest = useRef(snapshot);
  latest.current = snapshot;
  return latest;
}

/**
 * The validation of the value: external errors for the field's name, the required check, `validate`
 * and the debounced `validateAsync`, shown as the validation mode allows.
 */
function useFieldValidation<T>(value: T, options: FieldStateOptions<T>, scope: FieldScope) {
  const strings = useUiStrings();
  const reveal = useFieldReveal(options.validationMode ?? scope.validationMode ?? 'immediate');
  const external = useExternalIssues(scope.validationErrors, options.name, value);
  const own = [...external, ...checkFieldValue(value, options, strings)];
  const check = useAsyncCheck(value, {
    validateAsync: options.validateAsync,
    debounce: options.validationDebounce ?? 0,
    isSkipped: own.some((issue) => issue.severity === 'error'),
  });
  const isPending = Boolean(options.isPending) || check.isRunning;
  const realtime = resolveFieldValidation([...own, ...check.issues], isPending, strings);
  const shown = selectShownValidation(
    realtime,
    { external, isRevealed: reveal.isRevealed },
    strings,
  );
  return { reveal, realtime, shown };
}

/**
 * The controller every field is built on: it holds or relays the value, knows the committed value,
 * validates, tracks dirty state and keeps a per-field undo history of every value the field shows.
 * A read-only or disabled field refuses every change.
 */
export function useFieldState<T>(options: FieldStateOptions<T>): FieldState<T> {
  const scope = useFieldScope();
  const { draft, setDraft, committed, setCommitted, ...own } = useOwnValues(options);
  const value = options.value !== undefined ? options.value : draft;
  const committedValue = options.committedValue !== undefined ? options.committedValue : committed;
  const isDisabled = Boolean(options.isDisabled || scope.isDisabled);
  const isReadOnly = Boolean(options.isReadOnly || scope.isReadOnly);
  const isLocked = isReadOnly || isDisabled;
  const latest = useLatest({ value, committedValue, options, isLocked });
  const { reveal, realtime, shown } = useFieldValidation(value, options, scope);
  const { markChanged } = reveal;

  let history = own.history;
  if (!isFieldValueEqual(history.entries[history.index], value)) {
    history = recordFieldHistory(history, value);
    own.setHistory(history);
  }

  const setValue = useCallback(
    (next: T) => {
      const current = latest.current;
      if (current.isLocked) return;
      current.value = next;
      markChanged();
      if (current.options.value === undefined) setDraft(next);
      current.options.onChange?.(next);
    },
    [latest, setDraft, markChanged],
  );
  const commit = useCallback(() => {
    const current = latest.current;
    if (current.isLocked) return;
    if (isFieldValueEqual(current.value, current.committedValue)) return;
    current.committedValue = current.value;
    if (current.options.committedValue === undefined) setCommitted(current.value);
    current.options.onCommit?.(current.value);
  }, [latest, setCommitted]);

  const apply = (target: T | undefined) => {
    if (!canApply(latest.current.value, target, isLocked)) return;
    setValue(target as T);
    commit();
  };
  const step = (direction: -1 | 1) => {
    if (isLocked || !canStepFieldHistory(history, direction)) return;
    const next = stepFieldHistory(history, direction);
    own.setHistory(next);
    apply(next.entries[next.index]);
  };
  const canClear = !options.isRequired && canApply(value, options.emptyValue, isLocked);

  return {
    value,
    committedValue,
    validation: shown.validation,
    realtimeValidation: realtime.validation,
    issues: shown.issues,
    isDirty: canApply(value, committedValue, isLocked),
    isTouched: reveal.isTouched,
    isRequired: Boolean(options.isRequired),
    isReadOnly,
    isDisabled,
    validationBehavior: options.validationBehavior ?? scope.validationBehavior ?? 'aria',
    canUndo: !isLocked && canStepFieldHistory(history, -1),
    canRedo: !isLocked && canStepFieldHistory(history, 1),
    canClear,
    canSetDefault: canApply(value, options.defaultValue, isLocked),
    setValue,
    commit,
    restore: () => apply(committedValue),
    clear: () => (canClear ? apply(options.emptyValue) : undefined),
    setToDefault: () => apply(options.defaultValue),
    undo: () => step(-1),
    redo: () => step(1),
    touch: reveal.touch,
    revealValidation: reveal.revealValidation,
  };
}
