'use client';

import { useUiStrings } from '../../core/provider.js';
import { Field, type FieldInputProps, useFieldControl } from '../field/field.js';
import { BooleanControl, type BooleanFieldVariant } from './boolean-controls.js';
import { booleanFieldHooks as hooks } from './boolean-field-hooks.js';

export interface BooleanFieldProps extends FieldInputProps<boolean | null> {
  /** How the value is drawn. Defaults to `checkbox`. */
  variant?: BooleanFieldVariant | undefined;
  /**
   * Names the true value: a segment, an option, the toggle button's caption and the switch caption.
   * Defaults to the provider's `valueTrue`.
   */
  trueLabel?: string | undefined;
  /** Names the false value. Defaults to the provider's `valueFalse`. */
  falseLabel?: string | undefined;
  /** Names the unset value where a variant shows it. Defaults to the provider's `valueUnset`. */
  unsetLabel?: string | undefined;
  /**
   * Pressing can return the value to unset (`null`): the checkbox, switch and toggle button cycle
   * unset, true and false, the segmented variant offers an explicit unset segment, and the dropdown lists
   * an unset option.
   */
  allowsUnset?: boolean | undefined;
  /** The form name: every variant submits `true` or `false` from a hidden input, and nothing while unset or disabled. */
  name?: string | undefined;
}

/** The variants that show only on and off unless `allowsUnset` adds the unset state. */
const twoStateVariants = new Set<BooleanFieldVariant>(['checkbox', 'switch', 'toggle-button']);

function isNotTrue(value: boolean | null): boolean {
  return value !== true;
}

function serialize(value: boolean | null): string {
  return value === null ? 'unset' : String(value);
}

/**
 * A field for a true-or-false value, drawn as a checkbox, a switch, two named segments, a select or
 * a toggle button. A checkbox, switch or toggle button starts false and, required, asks for true
 * (consent). The segmented and dropdown variants, and any variant with `allowsUnset`, start unset
 * (`null`) and, required, ask for a value, false included; with `allowsUnset`, pressing returns to
 * unset.
 */
export function BooleanField({
  variant = 'checkbox',
  trueLabel,
  falseLabel,
  unsetLabel,
  allowsUnset = false,
  ...props
}: BooleanFieldProps) {
  const strings = useUiStrings();
  const isTwoState = !allowsUnset && twoStateVariants.has(variant);
  const { state, field } = useFieldControl(props, {
    initialValue: isTwoState ? false : null,
    emptyValue: allowsUnset ? null : undefined,
    // A two-state control asks for consent when required: only true fills it.
    isEmpty: isTwoState ? isNotTrue : undefined,
  });
  const labels = {
    true: trueLabel ?? strings.valueTrue,
    false: falseLabel ?? strings.valueFalse,
    unset: unsetLabel ?? strings.valueUnset,
    hasCustom: trueLabel !== undefined || falseLabel !== undefined,
  };
  const data = { variant, value: serialize(state.value) };
  return (
    <Field {...field} {...hooks.root({ className: field.className, data })} state={state}>
      {(control) => (
        <BooleanControl
          control={control}
          state={state}
          variant={variant}
          label={field.label}
          labels={labels}
          allowsUnset={allowsUnset}
          name={props.name}
          size={field.size ?? 'md'}
        />
      )}
    </Field>
  );
}

export type { BooleanFieldVariant } from './boolean-controls.js';
