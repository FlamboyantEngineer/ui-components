'use client';

import { useCallback, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { useLatest } from '../../utils/use-latest.js';
import type { FieldAsyncValidate } from './field-async.js';
import {
  canStepFieldHistory,
  createFieldHistory,
  type FieldHistory,
  recordFieldHistory,
  stepFieldHistory,
} from './field-history.js';
import {
  type FieldValidationBehavior,
  type FieldValidationMode,
  useFieldScope,
} from './field-scope.js';
import { useFieldValidation } from './field-state-validation.js';
import type {
  FieldErrorSource,
  FieldIssue,
  FieldIssues,
  FieldValidation,
} from './field-validation.js';
import { isFieldValueEqual } from './field-value.js';

export type { FieldAsyncValidate } from './field-async.js';
export type {
  FieldValidationBehavior,
  FieldValidationErrors,
  FieldValidationMode,
} from './field-scope.js';
export type {
  FieldErrorSource,
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
  /**
   * Whether the field tracks changes: dirty state, Restore and commits. `false` makes it a plain
   * input, as a control embedded in a larger editor is: the committed value is the value, so it is
   * never dirty and shows no Restore, and it never calls `onCommit`. Undo and redo still step through
   * the values it showed. Defaults to `true`.
   */
  tracksChanges?: boolean | undefined;
  /** The value the Clear action sets. Without it the field cannot be cleared. */
  emptyValue?: T | undefined;
  onChange?: ((value: T) => void) | undefined;
  /** Called when the field commits a value that differs from its committed value. */
  onCommit?: ((value: T) => void) | undefined;
  /** Checks a value during render, after the required check. It must be pure. */
  validate?: ((value: T) => FieldIssues) | undefined;
  /**
   * A check that may wait (for a server). It runs once the value settles; the field is pending
   * meanwhile. Keep it stable: a new function is a new validator, which checks the value again.
   */
  validateAsync?: FieldAsyncValidate<T> | undefined;
  /** How long the value must stay unchanged before `validateAsync` runs, in milliseconds. Defaults to 0. */
  validationDebounce?: number | undefined;
  /** When the field shows its validation. Defaults to the enclosing form's mode, else `immediate`. */
  validationMode?: FieldValidationMode | undefined;
  /** How the field reports validation to the browser. Defaults to the enclosing form's, else `aria`. */
  validationBehavior?: FieldValidationBehavior | undefined;
  /** The form name. Errors an enclosing form gives for it show until the value changes. */
  name?: string | undefined;
  /**
   * Further form names the field submits under, such as a range's ends: errors an enclosing form
   * gives for each show until the part of the value it reads changes.
   */
  errorSources?: readonly FieldErrorSource<T>[] | undefined;
  /** An empty value is an error, and the field cannot be cleared. */
  isRequired?: boolean | undefined;
  isReadOnly?: boolean | undefined;
  /** Refuses every change. An enclosing disabled fieldset disables the field too. */
  isDisabled?: boolean | undefined;
  /** A check of the value is in progress: `pending` status unless the value has an error. */
  isPending?: boolean | undefined;
}

/**
 * How a control's values behave, which the control decides rather than its caller: how two values
 * compare, and whether the control keeps the undo history itself.
 */
export interface FieldValueContract<T> {
  /**
   * Whether two values are the same value: for dirty state, history, actions, commits and checks.
   * Defaults to `isFieldValueEqual`, which compares by structure. A control with large values gives
   * a comparison that stops at shared parts, such as a document's unchanged blocks.
   */
  isEqual?: ((left: T, right: T) => boolean) | undefined;
  /**
   * The control keeps the history of its values (as a document editor does), so the field records
   * none: `canUndo` and `canRedo` stay false and `undo` and `redo` do nothing until the control
   * puts its own in their place.
   */
  hasOwnHistory?: boolean | undefined;
  /**
   * Whether a value holds nothing, for the required check and the field's `filled` state. Defaults
   * to `isEmptyValue`: `null`, `undefined`, blank text and an empty list. A choice whose options
   * may have the id `""` says what absence is for it instead.
   */
  isEmpty?: ((value: T) => boolean) | undefined;
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
  /** The value holds nothing, by the control's own `isEmpty`. */
  isEmpty: boolean;
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
  /** The field may ever be cleared: it has an empty value and is not required. */
  isClearable: boolean;
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
  /**
   * Reports what the control shows that has not become a value, such as an incomplete date or
   * unreadable text, while the value stays the last one accepted; `null` once the shown text is the
   * value again. It comes first in the field's validation and blocks its form like any error.
   */
  setDraftIssue(issue: FieldIssue | null): void;
}

/**
 * Holds a field's changes while a native form reset goes through its listeners, so a building block
 * that resets itself (as React Aria's controls do) changes nothing until the reset is known not to
 * be cancelled (UIC-FIELD-2.6). The form binding reads it, with the field's value equality, from the
 * state under this key.
 */
export const fieldReset = Symbol('fieldReset');

/** Whether the field's changes are held; `setValue` ignores changes while they are. */
interface FieldChangeHold {
  isHeld: boolean;
}

/** What a native reset needs from the field: its change hold and its value equality. */
export interface FieldResetContract<T> {
  hold: FieldChangeHold;
  isEqual: (left: T, right: T) => boolean;
}

function firstDefined<T>(...values: Array<T | undefined>): T {
  return values.find((value) => value !== undefined) as T;
}

type ValueEquality<T> = (left: T, right: T) => boolean;

/** Whether a menu action has something to do: the field is editable and the target differs. */
function canApply<T>(
  value: T,
  target: T | undefined,
  { isLocked, isEqual }: { isLocked: boolean; isEqual: ValueEquality<T> },
): boolean {
  return !isLocked && target !== undefined && !isEqual(value, target);
}

/**
 * The uncontrolled value and committed value (starting from the first of the committed value, the
 * controlled value and the default).
 */
function useOwnValues<T>({ value, committedValue, defaultValue }: FieldStateOptions<T>) {
  const [draft, setDraft] = useState(() => firstDefined(committedValue, defaultValue));
  const [committed, setCommitted] = useState(() =>
    firstDefined(committedValue, value, defaultValue),
  );
  return { draft, setDraft, committed, setCommitted };
}

/** The committed value: the caller's, else the field's own, else the value when it tracks no changes. */
function toCommittedValue<T>(
  options: FieldStateOptions<T>,
  { committed, value, tracksChanges }: { committed: T; value: T; tracksChanges: boolean },
): T {
  if (!tracksChanges) return value;
  return options.committedValue !== undefined ? options.committedValue : committed;
}

/**
 * The history of the values the field shows, recording the value during render when it is new,
 * unless the control keeps its own history.
 */
function useShownHistory<T>(
  value: T,
  { value: controlled, committedValue, defaultValue }: FieldStateOptions<T>,
  { isEqual, hasOwnHistory }: { isEqual: ValueEquality<T>; hasOwnHistory: boolean },
) {
  const [recorded, setHistory] = useState<FieldHistory<T>>(() =>
    createFieldHistory(firstDefined(controlled, committedValue, defaultValue)),
  );
  let history = recorded;
  if (!hasOwnHistory && !isEqual(history.entries[history.index] as T, value)) {
    history = recordFieldHistory(history, value, isEqual);
    setHistory(history);
  }
  return [history, setHistory] as const;
}

/**
 * The committed render's value, committed value, options and lock. Actions in one event update it so
 * they see each other; a render that has not committed (a suspended transition) never replaces it.
 */
interface LatestSnapshot<T> {
  value: T;
  committedValue: T;
  options: FieldStateOptions<T>;
  isLocked: boolean;
  isEqual: ValueEquality<T>;
  /** A controlled value changed in this event: the value to commit is the one the caller renders. */
  isUnsettled?: boolean;
}

/**
 * Sets the value being edited, unless the field is locked or a native reset holds its changes. The
 * hold is the same object for the field's whole life.
 */
function useSetValue<T>(
  latestRef: { current: LatestSnapshot<T> },
  { setDraft, markChanged }: { setDraft: (value: T) => void; markChanged: () => void },
) {
  const [hold] = useState<FieldChangeHold>(() => ({ isHeld: false }));
  const setValue = useCallback(
    (next: T) => {
      const current = latestRef.current;
      if (current.isLocked || hold.isHeld) return;
      current.value = next;
      current.isUnsettled = current.options.value !== undefined;
      markChanged();
      if (current.options.value === undefined) setDraft(next);
      current.options.onChange?.(next);
    },
    [latestRef, hold, setDraft, markChanged],
  );
  return { setValue, hold };
}

/**
 * Commits the value: right away, or, after a controlled value changed in the same event, once the
 * caller's value has rendered (a caller may change what it was given, or ignore it), so the
 * committed value is always one the field shows.
 */
function useCommit<T>(
  latestRef: { current: LatestSnapshot<T> },
  setCommitted: (value: T) => void,
): () => void {
  const pending = useRef(false);
  const [, rerender] = useReducer((count: number) => count + 1, 0);
  const commit = useCallback(() => {
    const current = latestRef.current;
    if (current.isLocked || current.options.tracksChanges === false) return;
    if (current.isUnsettled) {
      pending.current = true;
      rerender();
      return;
    }
    if (current.isEqual(current.value, current.committedValue)) return;
    current.committedValue = current.value;
    if (current.options.committedValue === undefined) setCommitted(current.value);
    current.options.onCommit?.(current.value);
  }, [latestRef, setCommitted]);
  useLayoutEffect(() => {
    if (!pending.current) return;
    pending.current = false;
    commit();
  });
  return commit;
}

/**
 * The controller every field is built on: it holds or relays the value, knows the committed value,
 * validates, tracks dirty state and keeps a per-field undo history of every value the field shows.
 * A read-only or disabled field refuses every change.
 */
export function useFieldState<T>(
  options: FieldStateOptions<T>,
  contract: FieldValueContract<T> = {},
): FieldState<T> {
  const isEqual = contract.isEqual ?? isFieldValueEqual;
  const scope = useFieldScope();
  const { draft, setDraft, committed, setCommitted } = useOwnValues(options);
  const value = options.value !== undefined ? options.value : draft;
  const tracksChanges = options.tracksChanges !== false;
  const committedValue = toCommittedValue(options, { committed, value, tracksChanges });
  const isDisabled = Boolean(options.isDisabled || scope.isDisabled);
  const isReadOnly = Boolean(options.isReadOnly || scope.isReadOnly);
  const isLocked = isReadOnly || isDisabled;
  const snapshot = { value, committedValue, options, isLocked, isEqual };
  const latestRef = useLatest<LatestSnapshot<T>>(snapshot);
  const checked = useFieldValidation(value, options, { scope, isEqual, isEmpty: contract.isEmpty });
  const { reveal, realtime, shown, isEmpty, setDraftIssue } = checked;
  const { markChanged } = reveal;
  const hasOwnHistory = Boolean(contract.hasOwnHistory);
  const [history, setHistory] = useShownHistory(value, options, { isEqual, hasOwnHistory });

  const { setValue, hold } = useSetValue(latestRef, { setDraft, markChanged });
  const commit = useCommit(latestRef, setCommitted);

  const lock = { isLocked, isEqual };
  const apply = (target: T | undefined) => {
    if (!canApply(latestRef.current.value, target, lock)) return;
    setValue(target as T);
    commit();
  };
  // A history entry is a value the field showed, `undefined` included.
  const step = (direction: -1 | 1) => {
    if (isLocked || !canStepFieldHistory(history, direction)) return;
    const next = stepFieldHistory(history, direction);
    setHistory(next);
    const target = next.entries[next.index] as T;
    if (isEqual(latestRef.current.value, target)) return;
    setValue(target);
    commit();
  };
  const isClearable = !options.isRequired && options.emptyValue !== undefined;
  const canClear = isClearable && canApply(value, options.emptyValue, lock);

  const state = {
    value,
    committedValue,
    validation: shown.validation,
    realtimeValidation: realtime.validation,
    issues: shown.issues,
    isEmpty,
    isDirty: canApply(value, committedValue, lock),
    isTouched: reveal.isTouched,
    isRequired: Boolean(options.isRequired),
    isReadOnly,
    isDisabled,
    validationBehavior: options.validationBehavior ?? scope.validationBehavior ?? 'aria',
    canUndo: !isLocked && canStepFieldHistory(history, -1),
    canRedo: !isLocked && canStepFieldHistory(history, 1),
    isClearable,
    canClear,
    canSetDefault: canApply(value, options.defaultValue, lock),
    setValue,
    commit,
    restore: () => apply(committedValue),
    clear: () => (canClear ? apply(options.emptyValue) : undefined),
    setToDefault: () => apply(options.defaultValue),
    undo: () => step(-1),
    redo: () => step(1),
    touch: reveal.touch,
    revealValidation: reveal.revealValidation,
    setDraftIssue,
    [fieldReset]: { hold, isEqual } satisfies FieldResetContract<T>,
  };
  return state;
}
