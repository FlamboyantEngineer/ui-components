'use client';

import { type Ref, useMemo } from 'react';
import type { OpenStateProps } from '../../core/events.js';
import type {
  BaseProps,
  Key,
  SelectionValue,
  ValueSelectionMode,
  ValueSelectionModeProps,
} from '../../core/props.js';
import {
  Field,
  type FieldInputProps,
  type FieldTextInputProps,
  flattenPickerItems,
  useFieldControl,
} from '../field/field.js';
import type { TreeItemData } from '../tree/tree.js';
import { SelectControl } from './select-control.js';
import { selectFieldHooks as hooks } from './select-field-hooks.js';
import { SelectNativeField, type SelectNativeFieldProps } from './select-native-field.js';
import type { SelectFieldOptionRenderer } from './select-option.js';
import { isNoSelection, type SelectFieldItem } from './select-options.js';
import { type SelectFieldLoader, useSelectSearch } from './select-search.js';
import { SelectTreeField, type SelectTreeFieldProps } from './select-tree-field.js';

export type SelectFieldSelectionMode = ValueSelectionMode;

/** Where a multiple select draws its chips: on a row `below` its trigger, or `inside` its frame. */
type SelectFieldChipPlacement = 'below' | 'inside';

/** One key or none for a single select, a list of keys for a multiple select. */
export type SelectFieldValue<M extends SelectFieldSelectionMode = 'single'> = SelectionValue<
  Key,
  M
>;

interface SelectListFieldProps<M extends SelectFieldSelectionMode = 'single'>
  extends
    FieldInputProps<SelectFieldValue<M>>,
    OpenStateProps,
    /** `placeholder` is the trigger's text while nothing is chosen; it defaults to the provider string. */
    Pick<FieldTextInputProps, 'placeholder'> {
  /**
   * The choices, in display order, and groups of them shown as headed sections; a multiple value
   * follows this order. Group ids must differ from option ids.
   */
  options: readonly SelectFieldItem[];
  /** Flat choices and headed groups. Defaults to `list`. */
  mode?: 'list' | undefined;
  /** `single` (the default) or `multiple`. */
  selectionMode?: M | undefined;
  /** A single select lists a first option with this label that chooses no value. */
  emptyLabel?: string | undefined;
  /** Draws a filter input in the open list. Defaults to on for more than 10 options or a search. */
  filterable?: boolean | undefined;
  /** Searches options as the reader types in the filter, instead of filtering `options`. */
  loadItems?: SelectFieldLoader | undefined;
  /** Shortest query that runs `loadItems`. Defaults to 1. */
  minSearchLength?: number | undefined;
  /** Milliseconds to wait after a keystroke before running `loadItems`. Defaults to 240. */
  searchDelay?: number | undefined;
  /** Draws a button after the trigger that clears the value in one press. */
  isClearable?: boolean | undefined;
  /**
   * Where a multiple select draws its chips: `below` the trigger (the default), or `inside` its
   * frame before the trigger, like a token field.
   */
  chipPlacement?: SelectFieldChipPlacement | undefined;
  /** A multiple value differs across records: show the placeholder instead of chips and a count. */
  isMixed?: boolean | undefined;
  /** The most values a multiple select takes; once reached, the other options are disabled. */
  maxValues?: number | undefined;
  /** Draws each option's content in the list instead of its icon, label and description. */
  renderOption?: SelectFieldOptionRenderer | undefined;
  /** Renders only the options in view, for very long lists. */
  virtualized?: boolean | undefined;
  /** The form name the chosen ids are submitted under. */
  name?: string | undefined;
  /** Receives the trigger button, the field's focusable control, while it is on the page. */
  triggerRef?: Ref<HTMLButtonElement> | undefined;
  /** Attributes and hook classes for the portalled popover, independent of the field. */
  popoverProps?: BaseProps | undefined;
}

/**
 * A field that chooses one value or several from a list (React Aria `Select`), with the field
 * base's label, validation, dirty state, restore, undo and menu. A multiple select shows its
 * choices as removable chips; a long list or a searched one filters inside the open list.
 */
function SelectListField<M extends SelectFieldSelectionMode = 'single'>({
  loadItems,
  minSearchLength,
  searchDelay,
  ...props
}: SelectListFieldProps<M>) {
  const isMultiple = props.selectionMode === 'multiple';
  const empty = (isMultiple ? [] : null) as SelectFieldValue<M>;
  const search = useSelectSearch({ loadItems, minSearchLength, searchDelay });
  const options = useMemo(() => flattenPickerItems(props.options), [props.options]);
  const hasEmptyId =
    options.some((option) => option.id === '') || search.seen.some((option) => option.id === '');
  const { state, field, rest } = useFieldControl<SelectFieldValue<M>, SelectListFieldProps<M>>(
    props,
    {
      initialValue: empty,
      emptyValue: empty,
      isEmpty: (value) => isNoSelection(value, hasEmptyId),
    },
  );
  const { mode = 'list', selectionMode = 'single', chipPlacement = 'below', ...config } = rest;
  return (
    <Field
      {...field}
      {...hooks.root({
        className: field.className,
        props: field,
        data: {
          mode,
          selectionMode,
          chipPlacement: isMultiple ? chipPlacement : null,
          icons: options.some((option) => Boolean(option.icon)),
        },
      })}
      state={state}
    >
      {(control) => (
        <SelectControl
          {...config}
          search={search}
          control={control}
          state={state}
          label={field.label}
          isMultiple={isMultiple}
          hasChipsInside={isMultiple && chipPlacement === 'inside'}
        />
      )}
    </Field>
  );
}

export type SelectFieldMode = 'list' | 'tree' | 'native';

type SelectFieldChoices<T extends TreeItemData, M extends SelectFieldSelectionMode> = {
  [Mode in M]: (SelectListFieldProps<Mode> | SelectTreeFieldProps<T, Mode>) &
    ValueSelectionModeProps<Mode>;
}[M];

export type SelectFieldProps<
  M extends SelectFieldSelectionMode = 'single',
  T extends TreeItemData = TreeItemData,
> =
  | ({ selectionMode?: M | undefined } & SelectFieldChoices<T, M>)
  | ('single' extends M ? SelectNativeFieldProps & { selectionMode?: undefined } : never);

/**
 * A field choosing one or several values from a list, icon choices or a searchable tree, or one
 * value from the platform's own select.
 */
export function SelectField<
  M extends SelectFieldSelectionMode = 'single',
  T extends TreeItemData = TreeItemData,
>(props: SelectFieldProps<M, T>) {
  if (props.mode === 'tree') return <SelectTreeField<T, M> {...props} />;
  if (props.mode === 'native') return <SelectNativeField {...props} />;
  return <SelectListField<M> {...props} />;
}

export type { SelectKeysValue } from './select-control.js';
export { SelectControl } from './select-control.js';
export type { SelectFieldOptionRenderer } from './select-option.js';
export type { SelectFieldGroup, SelectFieldItem, SelectFieldOption } from './select-options.js';
export type { SelectFieldLoader, SelectFieldPage } from './select-search.js';
export type { SelectFieldValueDisplay } from './select-tree-field.js';
