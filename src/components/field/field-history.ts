import { isFieldValueEqual } from './field-value.js';

/** The values a field has shown, oldest first, and the one it shows now. */
export interface FieldHistory<T> {
  readonly entries: readonly T[];
  readonly index: number;
}

/** How many values a field remembers for undo. */
const historyLimit = 100;

export function createFieldHistory<T>(value: T): FieldHistory<T> {
  return { entries: [value], index: 0 };
}

/** Adds `value` after the current entry, dropping redo entries; an unchanged value adds nothing. */
export function recordFieldHistory<T>(history: FieldHistory<T>, value: T): FieldHistory<T> {
  if (isFieldValueEqual(history.entries[history.index], value)) return history;
  const entries = [...history.entries.slice(0, history.index + 1), value].slice(-historyLimit);
  return { entries, index: entries.length - 1 };
}

/** Moves one entry back (`-1`) or forward (`1`); at either end the history is unchanged. */
export function stepFieldHistory<T>(history: FieldHistory<T>, step: -1 | 1): FieldHistory<T> {
  const index = history.index + step;
  if (index < 0 || index >= history.entries.length) return history;
  return { entries: history.entries, index };
}

export function canStepFieldHistory(history: FieldHistory<unknown>, step: -1 | 1): boolean {
  return stepFieldHistory(history, step) !== history;
}
