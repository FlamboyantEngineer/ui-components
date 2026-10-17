import type { ReactNode } from 'react';
import {
  Group,
  Input,
  NumberField as AriaNumberField,
  useLocale,
  type NumberFieldProps as AriaNumberFieldProps,
} from 'react-aria-components';
import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import {
  Field,
  toAriaControlProps,
  useFieldControl,
  type FieldInputProps,
  type FieldIssue,
} from '../field/field.js';
import {
  NumberScrubber,
  Stepper,
  createModifierStepHandler,
  numberFieldHooks as hooks,
  type NumberSteps,
} from './number-field-parts.js';

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
  /** Content inside the frame before the number, such as a literal prefix (`$`). */
  startAdornment?: ReactNode;
  /** Content inside the frame after the number, such as a literal suffix (`/mo`). */
  endAdornment?: ReactNode;
  /** The step of Alt with Arrow Up or Arrow Down, and of a scrub with Alt held. */
  smallStep?: number | undefined;
  /** The step of Shift with Arrow Up or Arrow Down, and of a scrub with Shift held. */
  largeStep?: number | undefined;
  /** Draws a scrub handle before the number: dragging it sideways steps the value. */
  showScrubber?: boolean | undefined;
}

interface NumberRules {
  minValue?: number | undefined;
  maxValue?: number | undefined;
  step?: number | undefined;
  format: (value: number) => string;
  strings: UiStrings;
}

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
    const message = strings.rangeUnderflow(format(minValue));
    return { severity: 'error', message, validity: 'rangeUnderflow' };
  }
  if (maxValue !== undefined && value > maxValue) {
    const message = strings.rangeOverflow(format(maxValue));
    return { severity: 'error', message, validity: 'rangeOverflow' };
  }
  if (step !== undefined && step > 0 && !isOnStep(value, step, minValue ?? 0)) {
    return {
      severity: 'error',
      message: strings.stepMismatch(format(step)),
      validity: 'stepMismatch',
    };
  }
  return null;
}

/**
 * A field for a number, parsed and formatted for the locale, with steppers. It commits on blur, on
 * Enter and on each step, and reports a value outside its range or off its step. Adornments sit
 * inside its frame; Shift and Alt step by larger and smaller amounts, and a scrub handle steps by
 * dragging.
 */
export function NumberField({
  placeholder,
  hideStepper = false,
  startAdornment,
  endAdornment,
  smallStep,
  largeStep,
  showScrubber = false,
  ...props
}: NumberFieldProps) {
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
  const steps: NumberSteps = { step: step ?? 1, smallStep, largeStep, minValue, maxValue };
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
            {showScrubber ? <NumberScrubber state={state} steps={steps} /> : null}
            {startAdornment ? <span {...hooks.slot('start')}>{startAdornment}</span> : null}
            <Input
              {...hooks.slot('input')}
              ref={control.ref}
              placeholder={placeholder}
              onKeyDown={createModifierStepHandler(state, steps)}
            />
            {endAdornment ? <span {...hooks.slot('end')}>{endAdornment}</span> : null}
            {hideStepper ? null : (
              <Stepper slot="increment" labelledBy={control['aria-labelledby']} />
            )}
          </Group>
        </AriaNumberField>
      )}
    </Field>
  );
}
