// A picker's options and sections, and the pure helpers on them, which run on the server too.

import type { ReactNode } from 'react';
import type { Key } from '../../core/props.js';
import type { IconSource } from '../icon/icon.js';

/** One option of a picker: `Combobox`, `SelectField` and the pickers built on them. */
export interface PickerOption {
  /** The stored value. */
  id: Key;
  /** The visible text, matched while typing or filtering, and announced. */
  label: string;
  /** Secondary text on the option's row; plain text is also matched by a select field's filter. */
  description?: ReactNode;
  /** An imported icon component or rendered element, shown on the row (and the chip). */
  icon?: IconSource;
  isDisabled?: boolean | undefined;
}

/** A section of a picker's options, led by its `label` when it has one. */
export interface PickerSection {
  id: Key;
  /** The section's heading, which names its options' group. */
  label?: ReactNode;
  options: readonly PickerOption[];
}

/** An entry of a picker's options: one option or a section of them. */
export type PickerItem = PickerOption | PickerSection;

/** Estimates a virtualized picker list starts from; it measures each row as it renders. */
export const pickerListLayout = { estimatedRowSize: 32, estimatedHeadingSize: 26, loaderSize: 32 };

/** Whether an entry of a picker's options is a section. */
export function isPickerSection(item: PickerItem): item is PickerSection {
  return 'options' in item && Array.isArray(item.options);
}

/** Every option, in display order, sections opened. */
export function flattenPickerItems(items: Iterable<PickerItem> | undefined): PickerOption[] {
  return [...(items ?? [])].flatMap((item) => (isPickerSection(item) ? [...item.options] : [item]));
}
