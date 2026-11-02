'use client';

import type { Ref } from 'react';
import type { TreeItemData } from '../tree/tree.js';
import { SelectTreeField, type SelectTreeFieldProps } from './select-tree-field.js';
import type { OpenStateProps } from '../../core/events.js';
import type { BaseProps, Key } from '../../core/props.js';
import {
  Field,
  useFieldControl,
  type FieldInputProps,
  type FieldTextInputProps,
} from '../field/field.js';
import { SelectControl } from './select-control.js';
import type { SelectFieldOptionRenderer } from './select-option.js';
import { flattenPickerItems } from '../field/field.js';
import { isNoSelection, type SelectFieldItem } from './select-options.js';
import type { SelectFieldLoader } from './select-search.js';
import { selectFieldHooks as hooks } from './select-field-hooks.js';

export type SelectFieldSelectionMode = 'single' | 'multiple';

/** Where a multiple select draws its chips: on a row `below` its trigger, or `inside` its frame. */
export type SelectFieldChipPlacement = 'below' | 'inside';

/** One key or none for a single select, a list of keys for a multiple select. */
export type SelectFieldValue<M extends SelectFieldSelectionMode = 'single'> = M extends 'multiple'
  ? Key[]
  : Key | null;

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
  loadOptions?: SelectFieldLoader | undefined;
  /** Shortest query that runs `loadOptions`. Defaults to 1. */
  minSearchLength?: number | undefined;
  /** Milliseconds to wait after a keystroke before running `loadOptions`. Defaults to 240. */
  searchDelay?: number | undefined;
  /** Draws a button after the trigger that clears the value in one press. */
  isClearable?: boolean | undefined;
  /**
   * Where a multiple select draws its chips: `below` the trigger (the default), or `inside` its
   * frame before the trigger, like a token field.
   */
  chipPlacement?: SelectFieldChipPlacement | undefined;
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
function SelectListField<M extends SelectFieldSelectionMode = 'single'>(
  props: SelectListFieldProps<M>,
) {
  const isMultiple = props.selectionMode === 'multiple';
  const empty = (isMultiple ? [] : null) as SelectFieldValue<M>;
  const { state, field, rest } = useFieldControl<SelectFieldValue<M>, SelectListFieldProps<M>>(
    props,
    {
      initialValue: empty,
      emptyValue: empty,
      isEmpty: (value) =>
        isNoSelection(
          value,
          flattenPickerItems(props.options).some((option) => option.id === ''),
        ),
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
          icons: flattenPickerItems(config.options).some((option) => Boolean(option.icon)),
        },
      })}
      state={state}
    >
      {(control) => (
        <SelectControl
          {...config}
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

export type SelectFieldMode = 'list' | 'tree';
export type SelectFieldProps<
  M extends SelectFieldSelectionMode = 'single',
  T extends TreeItemData = TreeItemData,
> = SelectListFieldProps<M> | SelectTreeFieldProps<T, M>;

/** A field choosing one or several values from a list, icon choices or a searchable tree. */
export function SelectField<
  M extends SelectFieldSelectionMode = 'single',
  T extends TreeItemData = TreeItemData,
>(props: SelectFieldProps<M, T>) {
  return props.mode === 'tree' ? <SelectTreeField {...props} /> : <SelectListField {...props} />;
}

export type { SelectFieldValueDisplay } from './select-tree-field.js';

export { SelectControl } from './select-control.js';
export type { SelectKeysValue } from './select-control.js';
export type { SelectFieldOptionRenderer } from './select-option.js';
export type { SelectFieldGroup, SelectFieldItem, SelectFieldOption } from './select-options.js';
export type { SelectFieldLoader, SelectFieldPage } from './select-search.js';
