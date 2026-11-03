// The option model of a select field: chosen keys, their order, their options and what changed.

import type { Key } from '../../core/props.js';
import type { PickerOption, PickerSection } from '../field/field.js';

/** One choice of a select field. */
export interface SelectFieldOption extends PickerOption {
  /** In a multiple list, marks an unchosen option as selected for some records. */
  isIndeterminate?: boolean | undefined;
}

/** A section of a select field's options; a section without a label only sets them apart. */
export interface SelectFieldGroup extends PickerSection {
  options: readonly SelectFieldOption[];
}

/** An entry of a select field's options: one option or a group of them. */
export type SelectFieldItem = SelectFieldOption | SelectFieldGroup;

/** The option the field shows for a chosen key; a key no option names is shown as itself. */
export interface ChosenSelectOption extends SelectFieldOption {
  isMissing: boolean;
}

/** The chosen keys of a single (`Key | null`) or multiple (`Key[]`) value, without repeats. */
export function toSelectKeys(value: Key | readonly Key[] | null | undefined): Key[] {
  if (value === null || value === undefined || value === '') return [];
  const keys = Array.isArray(value) ? value : [value as Key];
  return [...new Set(keys)];
}

/**
 * Whether a value chooses nothing: `null`, an empty list, or `''` when no option has that id (as a
 * native select's empty value).
 */
export function isNoSelection(value: Key | readonly Key[] | null, hasEmptyId: boolean): boolean {
  if (value === '') return !hasEmptyId;
  return toSelectKeys(value).length === 0;
}

/** Options without repeated keys, the first of each key winning, in the order given. */
export function mergeSelectOptions(
  ...lists: ReadonlyArray<readonly SelectFieldOption[]>
): SelectFieldOption[] {
  const byKey = new Map<Key, SelectFieldOption>();
  for (const option of lists.flat()) {
    if (!byKey.has(option.id)) byKey.set(option.id, option);
  }
  return [...byKey.values()];
}

/** Orders chosen keys by the options' order; keys no option names keep their order after them. */
export function orderSelectKeys(
  keys: readonly Key[],
  options: readonly SelectFieldOption[],
): Key[] {
  const chosen = new Set(keys);
  const ordered = options.map((option) => option.id).filter((key) => chosen.has(key));
  const known = new Set(ordered);
  return [...ordered, ...keys.filter((key) => !known.has(key))];
}

/** The option of each chosen key, or a stand-in labelled with the key when no option names it. */
export function resolveSelectOptions(
  keys: readonly Key[],
  options: readonly SelectFieldOption[],
): ChosenSelectOption[] {
  const byKey = new Map(options.map((option) => [option.id, option]));
  return keys.map((key) => {
    const option = byKey.get(key);
    return option
      ? { ...option, isMissing: false }
      : { id: key, label: String(key), isMissing: true };
  });
}

/** The keys a value added to, and removed from, the committed value. */
export function diffSelectKeys(
  keys: readonly Key[],
  committedKeys: readonly Key[],
): { added: Set<Key>; removed: Key[] } {
  const current = new Set(keys);
  const committed = new Set(committedKeys);
  return {
    added: new Set(keys.filter((key) => !committed.has(key))),
    removed: committedKeys.filter((key) => !current.has(key)),
  };
}
