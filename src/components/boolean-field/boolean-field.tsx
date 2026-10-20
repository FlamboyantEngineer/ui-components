import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Field, useFieldControl, type FieldInputProps } from '../field/field.js';
import { BooleanControl, type BooleanFieldVariant } from './boolean-controls.js';

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
   * unset, true and false, pressing the selected segment again clears it, and the dropdown lists
   * an unset option.
   */
  allowsUnset?: boolean | undefined;
  /** The form name; a form submits `true` or `false`, and no value while unset. */
  name?: string | undefined;
}

const hooks = createHooks('boolean-field');

function serialize(value: boolean | null): string {
  return value === null ? 'unset' : String(value);
}

/**
 * A field for a true-or-false value, drawn as a checkbox, a switch, two named segments, a select or
 * a toggle button. It may also hold no value (`null`): required, it is then invalid; with
 * `allowsUnset`, pressing returns to it.
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
  const { state, field } = useFieldControl(props, {
    initialValue: null,
    emptyValue: allowsUnset ? null : undefined,
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
