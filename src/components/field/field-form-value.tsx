'use client';

import { useFieldFormOwner } from './field-form-owner.js';

/**
 * What a field control submits with its form under `name`, through hidden inputs: one value (`null`
 * or `undefined` submits an empty string) or one input per value of a list (an empty list submits
 * nothing). Without a `name` it renders nothing; a disabled field submits nothing. The inputs name
 * the field's `form`, when it has one.
 */
export function FieldFormValue({
  name,
  value,
  isDisabled = false,
  form: givenForm,
  className,
}: {
  name: string | undefined;
  value: string | readonly string[] | null | undefined;
  isDisabled?: boolean | undefined;
  /** The form the inputs belong to, for inputs outside the field. Defaults to the field's `form`. */
  form?: string | undefined;
  /** A slot class for the inputs, for a control that names them in its hooks. */
  className?: string | undefined;
}) {
  const fieldForm = useFieldFormOwner();
  const form = givenForm ?? fieldForm;
  if (!name) return null;
  const values = typeof value === 'string' || value == null ? [value ?? ''] : value;
  return values.map((entry, index) => (
    <input
      // Several entries may repeat a value, so their place keys them.
      key={index}
      className={className}
      type="hidden"
      name={name}
      value={entry}
      disabled={isDisabled}
      form={form}
    />
  ));
}
