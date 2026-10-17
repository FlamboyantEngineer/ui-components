import { useCallback, useRef, useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import {
  canStepFieldHistory,
  createFieldHistory,
  recordFieldHistory,
  stepFieldHistory,
  type FieldHistory,
} from './field-history.js';
import { isFieldValueEmpty, isFieldValueEqual } from './field-value.js';

export type FieldSeverity = 'error' | 'warning';

export type FieldStatus = 'valid' | 'invalid' | 'warning' | 'pending';

/** A problem with a field's value: an `error` makes the field invalid, a `warning` only advises. */
export interface FieldIssue {
  severity: FieldSeverity;
  message: string;
}

/** A field's validation result: its status and the message it shows (none while valid). */
export interface FieldValidation {
  status: FieldStatus;
  message?: string | undefined;
}

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
  validate?: ((value: T) => FieldIssue | null | undefined) | undefined;
  /** An empty value is an error, and the field cannot be cleared. */
  isRequired?: boolean | undefined;
  isReadOnly?: boolean | undefined;
  isDisabled?: boolean | undefined;
  /** A check of the value is in progress: `pending` status unless the value has an error. */
  isPending?: boolean | undefined;
}

/** A field's value, committed value, validation and history, with the actions that change them. */
export interface FieldState<T> {
  value: T;
  committedValue: T;
  validation: FieldValidation;
  /** The value differs from the committed value (never while read-only or disabled). */
  isDirty: boolean;
  isRequired: boolean;
  isReadOnly: boolean;
  isDisabled: boolean;
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
}

function firstDefined<T>(...values: Array<T | undefined>): T {
  return values.find((value) => value !== undefined) as T;
}

function resolveValidation<T>(
  value: T,
  options: FieldStateOptions<T>,
  strings: UiStrings,
): FieldValidation {
  if (options.isRequired && isFieldValueEmpty(value)) {
    return { status: 'invalid', message: strings.valueRequired };
  }
  const issue = options.validate?.(value);
  if (issue?.severity === 'error') return { status: 'invalid', message: issue.message };
  if (options.isPending) return { status: 'pending', message: strings.validating };
  if (issue) return { status: 'warning', message: issue.message };
  return { status: 'valid' };
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

/** The latest value, committed value and options, so actions in one event see each other. */
function useLatest<T>(snapshot: { value: T; committedValue: T; options: FieldStateOptions<T> }) {
  const latest = useRef(snapshot);
  latest.current = snapshot;
  return latest;
}

/**
 * The controller every field is built on: it holds or relays the value, knows the committed value,
 * validates, tracks dirty state and keeps a per-field undo history of every value the field shows.
 * A read-only or disabled field refuses every change.
 */
export function useFieldState<T>(options: FieldStateOptions<T>): FieldState<T> {
  const strings = useUiStrings();
  const { draft, setDraft, committed, setCommitted, ...own } = useOwnValues(options);
  const value = options.value !== undefined ? options.value : draft;
  const committedValue = options.committedValue !== undefined ? options.committedValue : committed;
  const isLocked = Boolean(options.isReadOnly || options.isDisabled);
  const latest = useLatest({ value, committedValue, options });

  let history = own.history;
  if (!isFieldValueEqual(history.entries[history.index], value)) {
    history = recordFieldHistory(history, value);
    own.setHistory(history);
  }

  const setValue = useCallback(
    (next: T) => {
      const current = latest.current;
      if (current.options.isReadOnly || current.options.isDisabled) return;
      current.value = next;
      if (current.options.value === undefined) setDraft(next);
      current.options.onChange?.(next);
    },
    [latest, setDraft],
  );
  const commit = useCallback(() => {
    const current = latest.current;
    if (current.options.isReadOnly || current.options.isDisabled) return;
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
    validation: resolveValidation(value, options, strings),
    isDirty: canApply(value, committedValue, isLocked),
    isRequired: Boolean(options.isRequired),
    isReadOnly: Boolean(options.isReadOnly),
    isDisabled: Boolean(options.isDisabled),
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
  };
}
