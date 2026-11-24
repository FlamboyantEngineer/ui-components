'use client';

import {
  type ChangeEvent,
  Fragment,
  type KeyboardEvent,
  type MouseEvent,
  type Ref,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { ChevronDownGlyph } from '../../core/glyphs.js';
import type { Key } from '../../core/props.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
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
import { isNoSelection, type SelectFieldItem, type SelectFieldOption } from './select-options.js';

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
    const key = toKeyIdentity(item.id);
    if (!isPickerSection(item)) {
      return (
        <option key={key} value={String(item.id)} disabled={item.isDisabled}>
          {item.label}
        </option>
      );
    }
    const options = <NativeOptions items={item.options} />;
    // An optgroup needs a text label; any other group lists its options in place.
    return typeof item.label === 'string' && item.label ? (
      <optgroup key={key} label={item.label}>
        {options}
      </optgroup>
    ) : (
      <Fragment key={key}>{options}</Fragment>
    );
  });
}

function findOptionPosition(
  options: readonly SelectFieldOption[],
  option: SelectFieldOption | null,
  hasPlaceholder: boolean,
): number {
  if (!option) return hasPlaceholder ? 0 : -1;
  const index = options.findIndex(({ id }) => String(id) === String(option.id));
  return index + Number(hasPlaceholder);
}

/** A real empty-string choice and the placeholder submit the same text but have different validity. */
function useNativeSelection(position: { chosen: number; initial: number } | null) {
  const selectPositionRef = useRef<HTMLSelectElement>(null);
  const currentPositionRef = useRef<number | null>(null);
  useLayoutEffect(() => {
    currentPositionRef.current = position?.chosen ?? null;
    const select = selectPositionRef.current;
    if (!position || !select) return;
    for (const option of select.options) {
      const isDefault = option.index === position.initial;
      if (option.defaultSelected !== isDefault) option.defaultSelected = isDefault;
    }
    if (select.selectedIndex !== position.chosen) select.selectedIndex = position.chosen;
  });
  return { selectPositionRef, currentPositionRef };
}

function useNativeSelectValue(
  options: readonly SelectFieldOption[],
  {
    state,
    chosen,
    hasPlaceholder,
  }: { state: FieldState<Key | null>; chosen: SelectFieldOption | null; hasPlaceholder: boolean },
) {
  const [initialValue] = useState(state.value);
  const usesPosition = options.some(({ id }) => id === '');
  const { selectPositionRef, currentPositionRef } = useNativeSelection(
    usesPosition
      ? {
          chosen: findOptionPosition(options, chosen, hasPlaceholder),
          initial: findOptionPosition(options, findOption(options, initialValue), hasPlaceholder),
        }
      : null,
  );
  const onChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const select = event.currentTarget;
    if (!state.isReadOnly && !state.isDisabled) {
      const option = options[select.selectedIndex - Number(hasPlaceholder)];
      state.setValue(option ? option.id : null);
      state.commit();
    }
    // React restores controlled values. Restore by index when two options share the empty value.
    const position = currentPositionRef.current;
    if (position !== null) select.selectedIndex = position;
  };
  const nativeValue = chosen ? String(chosen.id) : '';
  return {
    selectPositionRef,
    selection: {
      onChange,
      value: usesPosition ? undefined : nativeValue,
      defaultValue: usesPosition ? nativeValue : undefined,
    },
  };
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
  const flat = flattenPickerItems(options);
  const chosen = findOption(flat, state.value);
  const previous = state.isDirty ? findOption(flat, state.committedValue) : null;
  const isRequired = state.isRequired && state.validationBehavior === 'native';
  const showsPlaceholder = emptyLabel !== undefined || !chosen;
  // A required select treats its first direct option as the placeholder when its value is empty.
  const hasPlaceholder = showsPlaceholder || (isRequired && flat[0]?.id === '');
  const { selectPositionRef, selection } = useNativeSelectValue(flat, {
    state,
    chosen,
    hasPlaceholder,
  });
  const ref = useMergedRefs(control.ref, selectRef, selectPositionRef);
  const isMissing = !chosen && !isNoSelection(state.value, false);
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
        required={isRequired}
        disabled={control.disabled}
        name={name}
        form={form}
        autoComplete={autoComplete}
        {...selection}
        onKeyDown={control.readOnly ? refuseChangingKey : undefined}
        onMouseDown={control.readOnly ? refusePicker : undefined}
      >
        {hasPlaceholder ? (
          <option value="" disabled={emptyLabel === undefined} hidden={!showsPlaceholder}>
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
