// The option model of a select field: chosen keys, their order, their options and what changed.

import type { Key } from '../../core/props.js';
import type { IconSource } from '../icon/icon.js';

/** One choice of a select field. */
export interface SelectFieldOption {
  /** The stored value. */
  id: Key;
  /** The visible text, matched by the filter and announced. */
  label: string;
  /** Secondary text on the option's row, also matched by the filter. */
  description?: string | undefined;
  /** An imported icon component or rendered element, shown on the row, in the trigger and on the chip. */
  icon?: IconSource;
  isDisabled?: boolean | undefined;
}

/** A headed section of a select field's options; a group without a label only sets them apart. */
export interface SelectFieldGroup {
  id: Key;
  /** The section's heading, which names its options' group. */
  label?: string | undefined;
  options: readonly SelectFieldOption[];
}

/** An entry of a select field's options: one option or a group of them. */
export type SelectFieldItem = SelectFieldOption | SelectFieldGroup;

/** The option the field shows for a chosen key; a key no option names is shown as itself. */
export interface ChosenSelectOption extends SelectFieldOption {
  isMissing: boolean;
}

export function isSelectFieldGroup(item: SelectFieldItem): item is SelectFieldGroup {
  return 'options' in item && Array.isArray(item.options);
}

/** The options of a list of options and groups, in display order. */
export function flattenSelectItems(items: readonly SelectFieldItem[]): SelectFieldOption[] {
  return items.flatMap((item) => (isSelectFieldGroup(item) ? item.options : [item]));
}

/** The chosen keys of a single (`Key | null`) or multiple (`Key[]`) value, without repeats. */
export function toSelectKeys(value: Key | readonly Key[] | null | undefined): Key[] {
  if (value === null || value === undefined || value === '') return [];
  const keys = Array.isArray(value) ? value : [value as Key];
  return [...new Set(keys)];
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
