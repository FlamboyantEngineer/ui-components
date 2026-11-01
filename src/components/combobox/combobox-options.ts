import type { Key } from '../../core/props.js';
import type { PickerItem, PickerOption, PickerSection } from '../field/field.js';
import { flattenPickerItems } from '../field/field-picker-items.js';
import { foldMatchCase } from '../text-match/match-ranges.js';

/** One suggestion; its label is written to the input when chosen. */
export type ComboboxOption = PickerOption;

/** A section of suggestions, led by its `label` when it has one. */
export type ComboboxSection = PickerSection;

export type ComboboxItem = PickerItem;

/** The text the reader typed, and the option the input now completes it with. */
export interface ComboboxCompletion {
  /** What the reader typed. */
  typed: string;
  /** The input's text: `typed` followed by the rest of the option's label. */
  text: string;
  /** The completing option. */
  key: Key;
}

/** The nodes of a React Aria collection the combobox reads to find its first option. */
interface OptionCollection {
  [Symbol.iterator](): Iterator<{ key: Key; type: string }>;
  getChildren?(key: Key): Iterable<{ key: Key; type: string }>;
}

/**
 * Whether an option's label is `text`, ignoring case, surrounding spaces and whether letters are
 * written composed or with combining marks.
 */
export function hasOptionLabelled(options: readonly ComboboxOption[], text: string): boolean {
  const wanted = foldMatchCase(text.trim());
  return options.some((option) => foldMatchCase(option.label) === wanted);
}

/**
 * How many code units at the start of `label` read as `prefix` once both are folded, or -1 when
 * the label does not start with it.
 */
function matchPrefixLength(label: string, prefix: string): number {
  const wanted = foldMatchCase(prefix);
  if (!foldMatchCase(label).startsWith(wanted)) return -1;
  for (let end = 1; end <= label.length; end += 1) {
    if (foldMatchCase(label.slice(0, end)) === wanted) return end;
  }
  return -1;
}

/**
 * The completion of `typed`: the first enabled option whose label starts with it, ignoring case and
 * longer than it, with the input's text keeping the typed characters as typed.
 */
export function findCompletion(
  options: readonly ComboboxOption[],
  typed: string,
): ComboboxCompletion | null {
  if (!typed) return null;
  for (const option of options) {
    if (option.isDisabled) continue;
    const length = matchPrefixLength(option.label, typed);
    if (length > 0 && option.label.length > length) {
      return { typed, text: typed + option.label.slice(length), key: option.id };
    }
  }
  return null;
}

/** The key of the first item of a collection that `isDisabled` lets through, inside sections too. */
export function findFirstOptionKey(
  collection: OptionCollection,
  isDisabled: (key: Key) => boolean,
): Key | null {
  for (const node of collection) {
    const nodes =
      node.type === 'section' ? [...(collection.getChildren?.(node.key) ?? [])] : [node];
    const first = nodes.find((child) => child.type === 'item' && !isDisabled(child.key));
    if (first) return first.key;
  }
  return null;
}

/** The items, then each known option no item lists, so a chosen id they leave out keeps its label. */
export function withKnownOptions(
  items: readonly ComboboxItem[],
  known: readonly ComboboxOption[],
): ComboboxItem[] {
  if (known.length === 0) return [...items];
  const listed = new Set(flattenPickerItems(items).map((option) => option.id));
  return [...items, ...known.filter((option) => !listed.has(option.id))];
}
