// The state matrix every field control lab shows: label layouts against field states.

import { useState } from 'react';
import type {
  FieldInputProps,
  FieldIssue,
  FieldLabelLayout,
} from '../../src/components/field/field.js';

export const fieldLayouts = [
  'label-control',
  'control-label',
  'label-colon-control',
  'control-only',
] as const satisfies readonly FieldLabelLayout[];

export const fieldStates = [
  'resting',
  'required',
  'dirty',
  'invalid',
  'warning',
  'pending',
  'read-only',
  'disabled',
] as const;

export type FieldStateName = (typeof fieldStates)[number];

/** The sample values of a lab: at rest, after an edit, rejected, warned about and empty. */
export interface SampleValues<T> {
  value: T;
  edited: T;
  invalid: T;
  warning: T;
  empty: T;
}

/**
 * The field props that put a control in a named state. The dirty state holds an edited value
 * against the committed one; the invalid and warning states report their sample value only, so
 * changing it clears the message.
 */
export function useLabFieldState<T>(
  state: FieldStateName,
  values: SampleValues<T>,
): Partial<FieldInputProps<T>> {
  const [held, setHeld] = useState(values.edited);
  const reject =
    (target: T, issue: FieldIssue) =>
    (value: T): FieldIssue | null =>
      Object.is(value, target) ? issue : null;
  const byState: Record<FieldStateName, Partial<FieldInputProps<T>>> = {
    resting: { defaultValue: values.value },
    required: { defaultValue: values.empty, isRequired: true },
    dirty: { value: held, onChange: setHeld, committedValue: values.value },
    invalid: {
      defaultValue: values.invalid,
      validate: reject(values.invalid, {
        severity: 'error',
        message: 'This value is not allowed.',
      }),
    },
    warning: {
      defaultValue: values.warning,
      validate: reject(values.warning, { severity: 'warning', message: 'Check this value.' }),
    },
    pending: { defaultValue: values.value, isPending: true },
    'read-only': { defaultValue: values.value, isReadOnly: true },
    disabled: { defaultValue: values.value, isDisabled: true },
  };
  return byState[state];
}
