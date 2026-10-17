import type { Key, SelectProps as AriaSelectProps } from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import { Field, useFieldControl, type FieldInputProps, type FieldState } from '../field/field.js';
import { SelectControl, type SelectKeysValue } from './select-control.js';
import type { SelectFieldOption } from './select-options.js';
import { DEFAULT_SEARCH_DELAY, type SelectFieldLoader } from './select-search.js';

export type SelectFieldSelectionMode = 'single' | 'multiple';

/** One key or none for a single select, a list of keys for a multiple select. */
export type SelectFieldValue<M extends SelectFieldSelectionMode = 'single'> = M extends 'multiple'
  ? Key[]
  : Key | null;

export interface SelectFieldProps<M extends SelectFieldSelectionMode = 'single'>
  extends
    FieldInputProps<SelectFieldValue<M>>,
    Pick<
      AriaSelectProps<SelectFieldOption, M>,
      'isOpen' | 'defaultOpen' | 'onOpenChange' | 'name' | 'autoFocus'
    > {
  /** The choices, in display order; a multiple value follows this order. */
  options: readonly SelectFieldOption[];
  /** `single` (the default) or `multiple`. */
  selectionMode?: M | undefined;
  /** The trigger's text while nothing is chosen. Defaults to the provider string. */
  placeholder?: string | undefined;
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
}

const hooks = createHooks('select-field');

/**
 * A field that chooses one value or several from a list (React Aria `Select`), with the field
 * base's label, validation, dirty state, restore, undo and menu. A multiple select shows its
 * choices as removable chips; a long list or a searched one filters inside the open list.
 */
export function SelectField<M extends SelectFieldSelectionMode = 'single'>(
  props: SelectFieldProps<M>,
) {
  const isMultiple = props.selectionMode === 'multiple';
  const empty = (isMultiple ? [] : null) as SelectFieldValue<M>;
  const { state, field, rest } = useFieldControl<SelectFieldValue<M>, SelectFieldProps<M>>(props, {
    initialValue: empty,
    emptyValue: empty,
  });
  const {
    selectionMode = 'single',
    minSearchLength = 1,
    searchDelay = DEFAULT_SEARCH_DELAY,
    ...config
  } = rest;
  return (
    <Field
      {...field}
      {...hooks.root({
        className: field.className,
        props: field,
        data: { selectionMode, icons: config.options.some((option) => option.icon) },
      })}
      state={state}
    >
      {(control) => (
        <SelectControl
          {...config}
          control={control}
          state={state as unknown as FieldState<SelectKeysValue>}
          label={field.label}
          isMultiple={isMultiple}
          minSearchLength={minSearchLength}
          searchDelay={searchDelay}
        />
      )}
    </Field>
  );
}

export type { SelectFieldOption } from './select-options.js';
export type { SelectFieldLoader } from './select-search.js';
