import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import {
  Group,
  Input,
  NumberField as AriaNumberField,
  useNumberFormatter,
} from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import {
  Field,
  toAriaControlProps,
  useFieldControl,
  type FieldInputProps,
  type FieldIssue,
  type FieldState,
} from '../field/field.js';
import { snapNumberValue } from './snap-number-value.js';
import {
  NumberScrubber,
  Stepper,
  createModifierStepHandler,
  numberFieldHooks as hooks,
  type NumberSteps,
} from './number-field-parts.js';

/**
 * What a commit does with a value outside the range or off the step: `snap` clamps it into the
 * range and snaps it to the nearest step; `validate` keeps it and reports an error.
 */
export type NumberFieldCommitBehavior = 'snap' | 'validate';

export interface NumberFieldProps extends FieldInputProps<number | null> {
  /** The smallest value. */
  minValue?: number | undefined;
  /** The largest value. */
  maxValue?: number | undefined;
  /** The step of the buttons and the arrow keys, counted from `minValue` (or zero). Defaults to 1. */
  step?: number | undefined;
  /** How the value is formatted and parsed in the locale: decimals, grouping, currency, percent, units. */
  formatOptions?: Intl.NumberFormatOptions | undefined;
  /** What a commit does with a value outside the rules. Defaults to `snap`. */
  commitBehavior?: NumberFieldCommitBehavior | undefined;
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

/** What the input reads from React Aria's number field state: the parsed number and its commit. */
interface NumberInputState {
  numberValue: number;
  commit(): void;
}

interface NumberEntryOptions {
  commitBehavior: NumberFieldCommitBehavior;
  bounds: Pick<NumberFieldProps, 'minValue' | 'maxValue' | 'step'>;
  steps: NumberSteps;
}

/**
 * Takes React Aria's commits into the field, snapped or kept, and commits them, except while the
 * typed text is read on its way out of the input (Tab or blur): the field then commits once focus
 * leaves it, so Tab reaches the restore button. Blur and Enter still snap a value React Aria saw
 * as unchanged, and Shift or Alt with an arrow steps by the larger or smaller step.
 */
function useNumberEntry(state: FieldState<number | null>, options: NumberEntryOptions) {
  const { commitBehavior, bounds, steps } = options;
  const isLeaving = useRef(false);
  const commit = (value: number) => {
    const next = commitBehavior === 'snap' ? snapNumberValue(value, bounds) : value;
    state.setValue(Number.isNaN(next) ? null : next);
    if (!isLeaving.current) state.commit();
  };
  const finishUnchanged = (value: number) => {
    if (commitBehavior !== 'snap' || value !== state.value) return;
    if (snapNumberValue(value, bounds) !== value) commit(value);
  };
  const modifiedStep = createModifierStepHandler(state, steps);
  const toInputProps = (input: NumberInputState) => ({
    onBlurCapture: () => {
      isLeaving.current = true;
    },
    onBlur: () => {
      finishUnchanged(input.numberValue);
      isLeaving.current = false;
    },
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
      modifiedStep(event);
      if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
        finishUnchanged(input.numberValue);
      }
      // The typed number becomes the value before Tab moves focus, so dirty state is current.
      if (event.key === 'Tab') {
        isLeaving.current = true;
        input.commit();
        isLeaving.current = false;
      }
    },
  });
  return { commit, toInputProps };
}

/**
 * A field for a number, parsed and formatted for the locale, with steppers. It commits when focus
 * leaves the field, on Enter and on each step, and reports a value outside its range or off its
 * step. Adornments sit inside its frame; Shift and Alt step by larger and smaller amounts, and a
 * scrub handle steps by dragging.
 */
export function NumberField({
  placeholder,
  hideStepper = false,
  startAdornment,
  endAdornment,
  smallStep,
  largeStep,
  showScrubber = false,
  commitBehavior = 'snap',
  ...props
}: NumberFieldProps) {
  const strings = useUiStrings();
  const { minValue, maxValue, step, formatOptions } = props;
  const formatter = useNumberFormatter(formatOptions);
  const { state, field, rest } = useFieldControl(props, {
    initialValue: null,
    emptyValue: null,
    check: (value) =>
      checkNumber(value, {
        minValue,
        maxValue,
        step,
        format: (number) => formatter.format(number),
        strings,
      }),
  });
  const steps: NumberSteps = { step: step ?? 1, smallStep, largeStep, minValue, maxValue };
  const bounds = { minValue, maxValue, step };
  const entry = useNumberEntry(state, { commitBehavior, bounds, steps });
  const data = { hideStepper };
  return (
    <Field
      {...field}
      {...hooks.root({ className: field.className, data })}
      state={state}
      commitOnBlur
    >
      {(control) => (
        <AriaNumberField
          {...rest}
          {...toAriaControlProps(control)}
          {...hooks.slot('box')}
          commitBehavior="validate"
          value={state.value ?? Number.NaN}
          onChange={entry.commit}
        >
          {({ state: inputState }) => (
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
                {...entry.toInputProps(inputState)}
              />
              {endAdornment ? <span {...hooks.slot('end')}>{endAdornment}</span> : null}
              {hideStepper ? null : (
                <Stepper slot="increment" labelledBy={control['aria-labelledby']} />
              )}
            </Group>
          )}
        </AriaNumberField>
      )}
    </Field>
  );
}
