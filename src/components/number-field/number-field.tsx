import { useId } from 'react';
import {
  Button as AriaButton,
  Group,
  Input,
  NumberField as AriaNumberField,
  useLocale,
  type NumberFieldProps as AriaNumberFieldProps,
} from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import {
  Field,
  toAriaControlProps,
  useFieldControl,
  type FieldInputProps,
  type FieldIssue,
} from '../field/field.js';

/** The React Aria number field props a `NumberField` takes; the field supplies the rest. */
type AriaNumberFieldOwnProps = Omit<
  AriaNumberFieldProps,
  | 'className'
  | 'style'
  | 'children'
  | 'render'
  | 'id'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'validate'
  | 'validationBehavior'
  | 'isInvalid'
  | 'isRequired'
  | 'isReadOnly'
  | 'isDisabled'
  | 'aria-label'
  | 'aria-labelledby'
  | 'aria-describedby'
  | 'aria-errormessage'
>;

export interface NumberFieldProps extends AriaNumberFieldOwnProps, FieldInputProps<number | null> {
  /** A hint shown while the control is empty. */
  placeholder?: string | undefined;
  /** Leave out the decrement and increment buttons; the arrow keys still step the value. */
  hideStepper?: boolean | undefined;
}

interface NumberRules {
  minValue?: number | undefined;
  maxValue?: number | undefined;
  step?: number | undefined;
  format: (value: number) => string;
  strings: UiStrings;
}

const hooks = createHooks('number-field', ['box', 'group', 'decrement', 'input', 'increment']);

// Tolerates the binary rounding of decimal steps (0.1 + 0.2).
const STEP_TOLERANCE = 1e-9;

function isOnStep(value: number, step: number, origin: number): boolean {
  const steps = (value - origin) / step;
  return Math.abs(steps - Math.round(steps)) < STEP_TOLERANCE;
}

/** The range and step error of a value, if any. An empty value passes; requiring one is the field's. */
function checkNumber(value: number | null, rules: NumberRules): FieldIssue | null {
  const { minValue, maxValue, step, format, strings } = rules;
  if (value === null) return null;
  if (minValue !== undefined && value < minValue) {
    return { severity: 'error', message: strings.rangeUnderflow(format(minValue)) };
  }
  if (maxValue !== undefined && value > maxValue) {
    return { severity: 'error', message: strings.rangeOverflow(format(maxValue)) };
  }
  if (step !== undefined && step > 0 && !isOnStep(value, step, minValue ?? 0)) {
    return { severity: 'error', message: strings.stepMismatch(format(step)) };
  }
  return null;
}

/** A step button, named by its action and the field label (`Decrease Weight`). */
function Stepper({ slot, labelledBy }: { slot: 'decrement' | 'increment'; labelledBy?: string }) {
  const id = useId();
  return (
    <AriaButton
      slot={slot}
      {...hooks.slot(slot)}
      id={id}
      aria-labelledby={labelledBy ? `${id} ${labelledBy}` : undefined}
    >
      <Glyph name={slot === 'decrement' ? 'minus' : 'plus'} />
    </AriaButton>
  );
}

/**
 * A field for a number, parsed and formatted for the locale, with steppers. It commits on blur, on
 * Enter and on each step, and reports a value outside its range or off its step.
 */
export function NumberField({ placeholder, hideStepper = false, ...props }: NumberFieldProps) {
  const strings = useUiStrings();
  const { locale } = useLocale();
  const { minValue, maxValue, step, formatOptions } = props;
  const formatter = new Intl.NumberFormat(locale, formatOptions);
  const { state, field, rest } = useFieldControl(props, {
    initialValue: null,
    emptyValue: null,
    check: (value) =>
      checkNumber(value, { minValue, maxValue, step, format: formatter.format, strings }),
  });
  const commit = (value: number) => {
    state.setValue(Number.isNaN(value) ? null : value);
    state.commit();
  };
  const data = { hideStepper };
  return (
    <Field {...field} {...hooks.root({ className: field.className, data })} state={state}>
      {(control) => (
        <AriaNumberField
          {...rest}
          {...toAriaControlProps(control)}
          {...hooks.slot('box')}
          value={state.value ?? Number.NaN}
          onChange={commit}
        >
          <Group {...hooks.slot('group')}>
            {hideStepper ? null : (
              <Stepper slot="decrement" labelledBy={control['aria-labelledby']} />
            )}
            <Input {...hooks.slot('input')} ref={control.ref} placeholder={placeholder} />
            {hideStepper ? null : (
              <Stepper slot="increment" labelledBy={control['aria-labelledby']} />
            )}
          </Group>
        </AriaNumberField>
      )}
    </Field>
  );
}
