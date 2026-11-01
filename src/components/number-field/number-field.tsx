'use client';

import type { ReactNode } from 'react';
import { useNumberFormatter } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import {
  Field,
  useFieldControl,
  type FieldInputProps,
  type FieldIssue,
  type FieldTextInputProps,
} from '../field/field.js';
import { RadixControl } from './radix-control.js';
import { formatRadixNumber, type NumberFieldRadix } from './radix-number.js';
import { DecimalControl } from './decimal-control.js';
import { numberFieldHooks as hooks, type NumberSteps } from './number-field-parts.js';

/**
 * What a commit does with a value outside the range or off the step: `snap` clamps it into the
 * range and snaps it to the nearest step; `validate` keeps it and reports an error.
 */
export type NumberFieldCommitBehavior = 'snap' | 'validate';

/**
 * The text-entry attributes a number field hands its input: its keyboard and spelling follow from
 * the number's format, so it takes the hint, autofill and the Enter key's label.
 */
export type NumberFieldTextInputProps = Pick<
  FieldTextInputProps,
  'placeholder' | 'autoComplete' | 'enterKeyHint'
>;

export interface NumberFieldProps
  extends FieldInputProps<number | null>, NumberFieldTextInputProps {
  /** Number base. Nondecimal bases edit integers and show 0b, 0o or 0x prefixes. Defaults to 10. */
  radix?: NumberFieldRadix | undefined;
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

export type NumberControlConfig = Pick<
  NumberFieldProps,
  | 'name'
  | 'minValue'
  | 'maxValue'
  | 'step'
  | 'formatOptions'
  | 'placeholder'
  | 'autoComplete'
  | 'enterKeyHint'
  | 'hideStepper'
  | 'startAdornment'
  | 'endAdornment'
  | 'showScrubber'
  | 'commitBehavior'
>;

interface NumberRules {
  radix: NumberFieldRadix;
  minValue?: number | undefined;
  maxValue?: number | undefined;
  step?: number | undefined;
  format: (value: number) => string;
  strings: UiStrings;
}

// Tolerates the binary rounding of decimal steps (0.1 + 0.2).
const stepTolerance = 1e-9;

function isOnStep(value: number, step: number, origin: number): boolean {
  const steps = (value - origin) / step;
  return Math.abs(steps - Math.round(steps)) < stepTolerance;
}

/** A finite number: NaN and the infinities read as no value, shown and submitted empty. */
function isReadableNumber(value: number | null): value is number {
  return value !== null && Number.isFinite(value);
}

/** The range and step error of a value, if any. An empty value passes; requiring one is the field's. */
function checkNumber(value: number | null, rules: NumberRules): FieldIssue | null {
  const { minValue, maxValue, step, format, strings } = rules;
  if (!isReadableNumber(value)) return null;
  if (rules.radix !== 10 && !Number.isSafeInteger(value))
    return {
      severity: 'error',
      message: strings.stepMismatch(format(1)),
      validity: 'stepMismatch',
    };
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
 * A field for a number, parsed and formatted for the locale, with steppers. It commits when focus
 * leaves the field, on Enter and on each step, and reports a value outside its range or off its
 * step. Adornments sit inside its frame; Shift and Alt step by larger and smaller amounts, and a
 * scrub handle steps by dragging.
 */
export function NumberField({
  radix = 10,
  placeholder,
  autoComplete,
  enterKeyHint,
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
  const {
    state: held,
    field,
    rest,
  } = useFieldControl(props, {
    initialValue: null,
    emptyValue: null,
    isEmpty: (value) => !isReadableNumber(value),
    check: (value) =>
      checkNumber(value, {
        radix,
        minValue,
        maxValue,
        step,
        format: (number) =>
          radix === 10 ? formatter.format(number) : formatRadixNumber(number, radix),
        strings,
      }),
  });
  // A non-finite value reaches the controls as empty, as the field judges it.
  const state = isReadableNumber(held.value) ? held : { ...held, value: null };
  const steps: NumberSteps = { step: step ?? 1, smallStep, largeStep, minValue, maxValue };
  const data = { hideStepper, radix };
  return (
    <Field
      {...field}
      {...hooks.root({ className: field.className, data })}
      state={held}
      commitOnBlur
    >
      {(control) => {
        const config = {
          ...rest,
          placeholder,
          autoComplete,
          enterKeyHint,
          hideStepper,
          startAdornment,
          endAdornment,
          showScrubber,
          commitBehavior,
        };
        return radix === 10 ? (
          <DecimalControl state={state} control={control} steps={steps} config={config} />
        ) : (
          <RadixControl
            state={state}
            control={control}
            radix={radix}
            steps={steps}
            config={config}
          />
        );
      }}
    </Field>
  );
}

export type { NumberFieldRadix } from './radix-number.js';
