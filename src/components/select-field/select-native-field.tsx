'use client';

import { type ChangeEvent, Fragment, type KeyboardEvent, type MouseEvent, type Ref } from 'react';
import { ChevronDownGlyph } from '../../core/glyphs.js';
import type { Key } from '../../core/props.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { useMergedRefs } from '../../utils/use-merged-refs.js';
import {
  Field,
  type FieldControlProps,
  type FieldInputProps,
  FieldPreviousValue,
  type FieldState,
  type FieldTextInputProps,
  flattenPickerItems,
  isPickerSection,
  useFieldControl,
  useFieldFormOwner,
} from '../field/field.js';
import { selectFieldHooks as hooks } from './select-field-hooks.js';
import type { SelectFieldItem, SelectFieldOption } from './select-options.js';

export interface SelectNativeFieldProps
  extends
    FieldInputProps<Key | null>,
    /**
     * `placeholder` is the empty option's text while nothing usable is chosen; it defaults to the
     * provider string. `autoComplete` is the browser's autofill hint.
     */
    Pick<FieldTextInputProps, 'placeholder' | 'autoComplete'> {
  mode: 'native';
  /** The choices, in display order; a group with a label is an `<optgroup>`. */
  options: readonly SelectFieldItem[];
  /** Lists a first option with this label that chooses no value. */
  emptyLabel?: string | undefined;
  /** The form name the chosen id is submitted under. */
  name?: string | undefined;
  /** Receives the native `<select>`, the field's focusable control, while it is on the page. */
  selectRef?: Ref<HTMLSelectElement> | undefined;
}

/** The option `value` names, or none for no value or an id no option has. */
function findOption(
  options: readonly SelectFieldOption[],
  value: Key | null,
): SelectFieldOption | null {
  if (value === null) return null;
  return options.find((option) => option.id === value) ?? null;
}

// The keys that open a native picker or change its choice; a read-only select refuses them.
const changingKeys = new Set([
  'Enter',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
  'PageUp',
  'PageDown',
  'F4',
]);

function refuseChangingKey(event: KeyboardEvent<HTMLSelectElement>) {
  if (event.ctrlKey || event.metaKey) return;
  if (event.key.length === 1 || changingKeys.has(event.key)) event.preventDefault();
}

/** A read-only select keeps focus from a press but never opens its picker. */
function refusePicker(event: MouseEvent<HTMLSelectElement>) {
  event.preventDefault();
  event.currentTarget.focus();
}

function NativeOptions({ items }: { items: readonly SelectFieldItem[] }) {
  return items.map((item) => {
    if (!isPickerSection(item)) {
      return (
        <option key={item.id} value={String(item.id)} disabled={item.isDisabled}>
          {item.label}
        </option>
      );
    }
    const options = <NativeOptions items={item.options} />;
    // An optgroup needs a text label; any other group lists its options in place.
    return typeof item.label === 'string' && item.label ? (
      <optgroup key={item.id} label={item.label}>
        {options}
      </optgroup>
    ) : (
      <Fragment key={item.id}>{options}</Fragment>
    );
  });
}

interface NativeSelectProps extends Omit<SelectNativeFieldProps, 'mode' | 'label'> {
  control: FieldControlProps;
  state: FieldState<Key | null>;
}

/**
 * The native `<select>` of a select field, after the previous value while it is dirty. The browser
 * draws the picker, disables the select inside a disabled fieldset and submits the chosen id.
 */
function NativeSelect({
  control,
  state,
  options,
  emptyLabel,
  placeholder,
  autoComplete,
  name,
  selectRef,
}: NativeSelectProps) {
  const strings = useUiStrings();
  const form = useFieldFormOwner();
  const ref = useMergedRefs(control.ref, selectRef);
  const flat = flattenPickerItems(options);
  const chosen = findOption(flat, state.value);
  const previous = state.isDirty ? findOption(flat, state.committedValue) : null;
  const hasEmptyOption = emptyLabel !== undefined || !chosen;
  const isMissing = !chosen && state.value !== null && state.value !== '';
  const onChange = (event: ChangeEvent<HTMLSelectElement>) => {
    // A refused change leaves the value, and React puts the select back on it.
    if (state.isReadOnly || state.isDisabled) return;
    const option = flat[event.currentTarget.selectedIndex - (hasEmptyOption ? 1 : 0)];
    state.setValue(option ? option.id : null);
    state.commit();
  };
  return (
    <div {...hooks.slot('frame')}>
      {previous ? (
        <FieldPreviousValue className={hooks.slotClass('previous')}>
          {previous.label}
        </FieldPreviousValue>
      ) : null}
      <select
        {...hooks.slot('native', { placeholder: !chosen, missing: isMissing })}
        ref={ref}
        id={control.id}
        aria-label={control['aria-label']}
        aria-labelledby={control['aria-labelledby']}
        aria-describedby={control['aria-describedby']}
        aria-errormessage={control['aria-errormessage']}
        aria-invalid={control['aria-invalid']}
        aria-required={control['aria-required']}
        aria-readonly={control.readOnly || undefined}
        required={state.isRequired && state.validationBehavior === 'native'}
        disabled={control.disabled}
        name={name}
        form={form}
        autoComplete={autoComplete}
        value={chosen ? String(chosen.id) : ''}
        onChange={onChange}
        onKeyDown={control.readOnly ? refuseChangingKey : undefined}
        onMouseDown={control.readOnly ? refusePicker : undefined}
      >
        {hasEmptyOption ? (
          <option value="" disabled={emptyLabel === undefined}>
            {emptyLabel ?? placeholder ?? strings.selectPlaceholder}
          </option>
        ) : null}
        <NativeOptions items={options} />
      </select>
      <Glyph icon={ChevronDownGlyph} className={hooks.slotClass('native-icon')} />
    </div>
  );
}

/**
 * A select field drawn as the platform's own `<select>`: the browser's picker, keyboard, required
 * check and fieldset locking, with the field base's label, validation, dirty state, restore, undo
 * and menu. It chooses one value.
 */
export function SelectNativeField(props: SelectNativeFieldProps) {
  const { state, field, rest } = useFieldControl<Key | null, SelectNativeFieldProps>(props, {
    initialValue: null,
    emptyValue: null,
    // An id no option has cannot be shown, so it fills nothing.
    isEmpty: (value) => !findOption(flattenPickerItems(props.options), value),
  });
  const { mode, ...config } = rest;
  return (
    <Field
      {...field}
      {...hooks.root({
        className: field.className,
        props: field,
        data: { mode, selectionMode: 'single' },
      })}
      state={state}
    >
      {(control) => <NativeSelect {...config} control={control} state={state} />}
    </Field>
  );
}
