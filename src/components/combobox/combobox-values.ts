import { useMemo } from 'react';
import type { Key } from '../../core/props.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { isPickerSection } from '../field/field-picker-items.js';
import type { ComboboxItem } from './combobox-options.js';

type Value = Key | Key[] | null | undefined;

function encodeComboboxValue(value: Value): Value {
  if (value === null || value === undefined) return value;
  return Array.isArray(value) ? value.map(toCollectionKey) : toCollectionKey(value);
}

/** Retains selection identity while the input and remote search rerender independently. */
export function useComboboxValues(value: Value, defaultValue: Value) {
  return {
    value: useMemo(() => encodeComboboxValue(value), [value]),
    defaultValue: useMemo(() => encodeComboboxValue(defaultValue), [defaultValue]),
  };
}

export function decodeComboboxValue(value: Exclude<Value, undefined>): Exclude<Value, undefined> {
  if (value === null) return value;
  return Array.isArray(value) ? value.map(fromCollectionKey) : fromCollectionKey(value);
}

export function encodeComboboxItems(items: Iterable<ComboboxItem>): ComboboxItem[] {
  return Array.from(items, (item) =>
    isPickerSection(item)
      ? {
          ...item,
          id: toCollectionKey(item.id),
          options: item.options.map((option) => ({ ...option, id: toCollectionKey(option.id) })),
        }
      : { ...item, id: toCollectionKey(item.id) },
  );
}
