import type { ReactNode } from 'react';
import type { Key } from 'react-aria-components';
import type { IconSource } from '../icon/icon.js';

/** One suggestion. */
export interface ComboboxOption {
  id: Key;
  /** The text shown, matched while typing, and written to the input when chosen. */
  label: string;
  description?: ReactNode;
  icon?: IconSource;
  isDisabled?: boolean | undefined;
}

/** A titled group of suggestions. */
export interface ComboboxSection {
  id: Key;
  title: ReactNode;
  options: readonly ComboboxOption[];
}

export type ComboboxItem = ComboboxOption | ComboboxSection;

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

export function isSection(item: ComboboxItem): item is ComboboxSection {
  return 'options' in item;
}

/** Every option, in display order, sections opened. */
export function flattenOptions(items: Iterable<ComboboxItem> | undefined): ComboboxOption[] {
  return [...(items ?? [])].flatMap((item) => (isSection(item) ? [...item.options] : [item]));
}

/** Whether an option's label is `text`, ignoring case and surrounding spaces. */
export function hasOptionLabelled(options: readonly ComboboxOption[], text: string): boolean {
  const wanted = text.trim().toLocaleLowerCase();
  return options.some((option) => option.label.toLocaleLowerCase() === wanted);
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
  const prefix = typed.toLocaleLowerCase();
  const option = options.find(
    (candidate) =>
      !candidate.isDisabled &&
      candidate.label.length > typed.length &&
      candidate.label.toLocaleLowerCase().startsWith(prefix),
  );
  if (!option) return null;
  return { typed, text: typed + option.label.slice(typed.length), key: option.id };
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
