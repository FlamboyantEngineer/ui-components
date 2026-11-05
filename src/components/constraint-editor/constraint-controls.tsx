'use client';

import type { ReactNode } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { DateTimeField } from '../date-time-field/date-time-field.js';
import type { FieldIssue } from '../field/field.js';
import { NumberField } from '../number-field/number-field.js';
import { SelectField, type SelectFieldItem } from '../select-field/select-field.js';
import { TextField } from '../text-field/text-field.js';
import { constraintEditorHooks as hooks } from './constraint-editor-hooks.js';
import type { ConstraintEditorKind, ConstraintName, ConstraintSet } from './constraint-model.js';

/** One constraint's value, as the editor hands it to a control. */
export type ConstraintValue = ConstraintSet[ConstraintName];

/** What a control for one constraint gets: its value, how to change or unset it, and its problems. */
export interface ConstraintControl {
  name: ConstraintName;
  label: string;
  /** The constraint's value, or `undefined` while it is not set. */
  value: ConstraintValue;
  /** Sets the constraint; `undefined` unsets it. */
  onChange: (value: ConstraintValue) => void;
  isReadOnly: boolean;
  /** The problems shown on the control: the editor's own, then the host's error for it. */
  issues: readonly FieldIssue[];
}

interface BuiltInControlOptions {
  kind: ConstraintEditorKind;
  control: ConstraintControl;
  options: readonly SelectFieldItem[];
}

const toText = (value: ConstraintValue) => (typeof value === 'string' ? value : '');
const toCount = (value: ConstraintValue) => (typeof value === 'number' ? value : null);

/** The Required control: required, optional, or not set. */
function RequiredControl({ control }: { control: ConstraintControl }) {
  const strings = useUiStrings();
  const { value, onChange } = control;
  return (
    <SelectField
      label={control.label}
      options={(['required', 'optional'] as const).map((choice) => ({
        id: choice,
        label: strings.constraintRequiredChoice(choice),
      }))}
      emptyLabel={strings.constraintNotSet}
      placeholder={strings.constraintNotSet}
      value={value === undefined ? null : value ? 'required' : 'optional'}
      onChange={(key) => onChange(key === null || key === '' ? undefined : key === 'required')}
      isReadOnly={control.isReadOnly}
      validate={() => control.issues}
    />
  );
}

/**
 * A text-valued constraint: a date for date fields, an option for options fields, else text. An
 * emptied text unsets the constraint, except a text field's default, where empty text is a value.
 */
function ValueControl({ kind, control, options }: BuiltInControlOptions) {
  const strings = useUiStrings();
  const { name, label, value, onChange, isReadOnly, issues } = control;
  const common = {
    label,
    isReadOnly,
    validate: () => issues,
    validationMode: 'immediate' as const,
  };
  if (kind === 'date') {
    return (
      <DateTimeField
        {...common}
        value={typeof value === 'string' ? value : null}
        onChange={(date) => onChange(date ?? undefined)}
      />
    );
  }
  if (kind === 'options' && name === 'default') {
    return (
      <SelectField
        {...common}
        options={options}
        emptyLabel={strings.constraintNotSet}
        placeholder={strings.constraintNotSet}
        value={typeof value === 'string' ? value : null}
        onChange={(key) => onChange(key === null || key === '' ? undefined : String(key))}
      />
    );
  }
  const keepsEmpty = kind === 'text' && name === 'default';
  return (
    <TextField
      {...common}
      placeholder={strings.constraintNotSet}
      inputMode={kind === 'number' ? 'decimal' : undefined}
      spellCheck={false}
      value={toText(value)}
      onChange={(text) => onChange(text === '' && !keepsEmpty ? undefined : text)}
    />
  );
}

/** A length or count: a whole number from 0, or not set. */
function CountControl({ control }: { control: ConstraintControl }) {
  const strings = useUiStrings();
  return (
    <NumberField
      label={control.label}
      placeholder={strings.constraintNotSet}
      minValue={0}
      step={1}
      value={toCount(control.value)}
      onChange={(count) => control.onChange(count ?? undefined)}
      isReadOnly={control.isReadOnly}
      validate={() => control.issues}
      validationMode="immediate"
    />
  );
}

/** The library's control for a constraint. */
export function BuiltInConstraintControl(props: BuiltInControlOptions): ReactNode {
  switch (props.control.name) {
    case 'required':
      return <RequiredControl control={props.control} />;
    case 'minLength':
    case 'maxLength':
    case 'minCount':
    case 'maxCount':
      return <CountControl control={props.control} />;
    case 'default':
    case 'minimum':
    case 'maximum':
    case 'pattern':
      return <ValueControl {...props} />;
  }
}

/** The Unset button after a set constraint's control. */
export function ConstraintUnsetButton({ control }: { control: ConstraintControl }) {
  const strings = useUiStrings();
  if (control.value === undefined || control.isReadOnly) return null;
  return (
    <Button
      className={hooks.slotClass('unset')}
      size="sm"
      variant="ghost"
      onPress={() => control.onChange(undefined)}
    >
      {strings.constraintUnset(control.label)}
    </Button>
  );
}
