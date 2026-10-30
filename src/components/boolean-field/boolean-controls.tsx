'use client';

import { useId, useRef, type CSSProperties } from 'react';
import { Switch, ToggleButton, type Key } from '../../primitives/index.js';
import { createHooks, measuredProperty } from '../../core/hooks.js';
import type { ControlSize } from '../../core/props.js';
import { useWidestTextWidth } from '../../utils/use-widest-text-width.js';
import { Checkbox, cycleCheckState } from '../checkbox/checkbox.js';
import {
  FieldPreviousValue,
  toAriaControlProps,
  type FieldControlProps,
  type FieldState,
} from '../field/field.js';
import { SegmentedChoice } from '../segmented-choice/segmented-choice.js';
import { SelectControl, type SelectKeysValue } from '../select-field/select-field.js';

/**
 * How a boolean is drawn: a tick box, a switch, a pair of named segments, a select of the named
 * values, or a toggle button showing the current value's name.
 */
export type BooleanFieldVariant =
  | 'checkbox'
  | 'switch'
  | 'segmented'
  | 'dropdown'
  | 'toggle-button';

/** The names of the three states, and whether the caller named true or false. */
interface BooleanLabels {
  true: string;
  false: string;
  unset: string;
  hasCustom: boolean;
}

interface BooleanControlProps {
  control: FieldControlProps;
  state: FieldState<boolean | null>;
  variant: BooleanFieldVariant;
  /** The field's label. */
  label: string;
  labels: BooleanLabels;
  allowsUnset: boolean;
  name: string | undefined;
  /** The field's size, which the checkbox and segments take. */
  size: ControlSize;
}

const hooks = createHooks('boolean-field', [
  'switch',
  'track',
  'thumb',
  'caption',
  'form-value',
  'toggle-button',
  'previous',
]);

const controls = {
  checkbox: CheckControl,
  switch: CheckControl,
  segmented: SegmentedControl,
  dropdown: DropdownControl,
  'toggle-button': ToggleButtonControl,
} satisfies Record<BooleanFieldVariant, (props: BooleanControlProps) => unknown>;

function labelOf(value: boolean | null, labels: BooleanLabels): string {
  if (value === null) return labels.unset;
  return value ? labels.true : labels.false;
}

/** A switch shows its state by position, so only the caller's labels or the unset state caption it. */
function switchCaptionOf(value: boolean | null, labels: BooleanLabels): string | null {
  if (value === null || labels.hasCustom) return labelOf(value, labels);
  return null;
}

/** Sets and commits a picked value. */
function pick(state: FieldState<boolean | null>, value: boolean | null) {
  state.setValue(value);
  state.commit();
}

/** What a press gives: the other value, or with `allowsUnset` the next of unset, true and false. */
function pressedValue({ state, allowsUnset }: BooleanControlProps): boolean | null {
  return allowsUnset ? cycleCheckState(state.value) : state.value !== true;
}

function toKey(value: boolean | null): Key | null {
  return value === null ? null : String(value);
}

/** The boolean state seen as a select's keys: `'true'`, `'false'`, or `null` while unset. */
function toKeyState(state: FieldState<boolean | null>): FieldState<SelectKeysValue> {
  return {
    ...state,
    value: toKey(state.value),
    committedValue: toKey(state.committedValue),
    setValue: (key) => state.setValue(key === null ? null : key === 'true'),
  };
}

/** A hidden input that submits `true` or `false`, and nothing while unset or disabled. */
function FormValue({
  name,
  state,
}: {
  name: string | undefined;
  state: FieldState<boolean | null>;
}) {
  if (!name) return null;
  return (
    <input
      {...hooks.slot('form-value')}
      type="hidden"
      name={name}
      value={String(state.value)}
      disabled={state.value === null || state.isDisabled}
    />
  );
}

function SegmentedControl({
  control,
  state,
  labels,
  allowsUnset,
  name,
  size,
}: BooleanControlProps) {
  const aria = toAriaControlProps(control);
  return (
    <>
      <SegmentedChoice
        id={aria.id}
        aria-label={aria['aria-label']}
        aria-labelledby={aria['aria-labelledby']}
        aria-describedby={aria['aria-describedby']}
        isInvalid={aria.isInvalid}
        isReadOnly={aria.isReadOnly}
        isDisabled={aria.isDisabled}
        size={size}
        options={[
          ...(allowsUnset ? [{ value: 'unset', label: labels.unset }] : []),
          { value: 'false', label: labels.false },
          { value: 'true', label: labels.true },
        ]}
        value={
          state.value === null && allowsUnset ? 'unset' : (toKey(state.value) as string | null)
        }
        onChange={(next) => pick(state, next === null || next === 'unset' ? null : next === 'true')}
      />
      <FormValue name={name} state={state} />
    </>
  );
}

// The select's own form value would name its unset option by a generated key, so the field submits
// through its hidden input instead.
function DropdownControl({
  control,
  state,
  label,
  labels,
  allowsUnset,
  name,
}: BooleanControlProps) {
  return (
    <>
      <SelectControl
        control={control}
        state={toKeyState(state)}
        label={label}
        isMultiple={false}
        options={[
          { id: 'true', label: labels.true },
          { id: 'false', label: labels.false },
        ]}
        placeholder={labels.unset}
        emptyLabel={allowsUnset ? labels.unset : undefined}
        filterable={false}
      />
      <FormValue name={name} state={state} />
    </>
  );
}

/**
 * A toggle button pressed while true, named like the dropdown's trigger by its caption (the current
 * value's name) and the field's label. The caption keeps the width of the widest name, so the
 * button never resizes.
 */
function ToggleButtonControl(props: BooleanControlProps) {
  const { control, state, labels } = props;
  const captionId = useId();
  const captionRef = useRef<HTMLSpanElement | null>(null);
  const width = useWidestTextWidth(captionRef, [labels.true, labels.false, labels.unset]);
  const style =
    width === null
      ? undefined
      : (measuredProperty('boolean-field-caption-width', width) as CSSProperties);
  // In the control-only layout the button names itself by `aria-label`, read after the caption.
  const labelledBy = `${captionId} ${control['aria-labelledby'] ?? control.id}`;
  return (
    <>
      {state.isDirty ? (
        <FieldPreviousValue className={hooks.slotClass('previous')}>
          {labelOf(state.committedValue, labels)}
        </FieldPreviousValue>
      ) : null}
      <ToggleButton
        {...hooks.slot('toggle-button', { indeterminate: state.value === null })}
        ref={control.ref}
        id={control.id}
        aria-label={control['aria-label']}
        aria-labelledby={labelledBy}
        aria-describedby={control['aria-describedby']}
        isSelected={state.value === true}
        isDisabled={control.disabled}
        onChange={() => pick(state, pressedValue(props))}
      >
        <span {...hooks.slot('caption')} id={captionId} ref={captionRef} style={style}>
          {labelOf(state.value, labels)}
        </span>
      </ToggleButton>
      <FormValue name={props.name} state={state} />
    </>
  );
}

function CheckControl(props: BooleanControlProps) {
  const { control, state, variant, labels, name, size } = props;
  const shared = {
    ...toAriaControlProps(control),
    inputRef: control.ref,
    isSelected: state.value === true,
    onChange: () => pick(state, pressedValue(props)),
    name,
    value: 'true',
  };
  if (variant === 'checkbox')
    return <Checkbox {...shared} size={size} isIndeterminate={state.value === null} />;
  const caption = switchCaptionOf(state.value, labels);
  return (
    <Switch {...shared} {...hooks.slot('switch', { indeterminate: state.value === null })}>
      <span {...hooks.slot('track')} aria-hidden="true">
        <span {...hooks.slot('thumb')} />
      </span>
      {caption ? <span {...hooks.slot('caption')}>{caption}</span> : null}
    </Switch>
  );
}

/** The control the variant draws, bound to the field state. Every pick commits at once. */
export function BooleanControl(props: BooleanControlProps) {
  const Control = controls[props.variant];
  return <Control {...props} />;
}
