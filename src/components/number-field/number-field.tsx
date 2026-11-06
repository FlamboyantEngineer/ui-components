'use client';

import type { ReactElement, ReactNode } from 'react';
import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import { useLocale, useNumberFormatter } from '../../primitives/index.js';
import {
  Field,
  type FieldControlProps,
  type FieldInputProps,
  type FieldIssue,
  type FieldState,
  type FieldTextInputProps,
  useFieldControl,
} from '../field/field.js';
import { DecimalControl } from './decimal-control.js';
import { createQuantityCodec, createRadixCodec } from './number-codecs.js';
import { numberFieldHooks as hooks, type NumberSteps } from './number-field-parts.js';
import {
  NumberRangeField,
  type NumberRangeFieldProps,
  NumberSliderField,
  type NumberSliderFieldProps,
} from './number-slider.js';
import { formatRadixNumber, type NumberFieldRadix } from './radix-number.js';
import { TextNumberControl } from './text-number-control.js';
import { type NumberFieldUnits, toQuantityFormatOptions } from './unit-number.js';

/**
 * What a commit does with a value outside the range or off the step: `snap` clamps it into the
 * range and snaps it to the nearest step; `validate` keeps it and reports an error.
 */
export type NumberFieldCommitBehavior = 'snap' | 'validate';

/** Where the end adornment sits: at the frame's trailing edge or right after the number. */
export type NumberFieldAdornmentPlacement = 'edge' | 'value';

/**
 * The text-entry attributes a number field hands its input: its keyboard and spelling follow from
 * the number's format, so it takes the hint, autofill and the Enter key's label.
 */
export type NumberFieldTextInputProps = Pick<
  FieldTextInputProps,
  'placeholder' | 'autoComplete' | 'enterKeyHint'
>;

/** The props of a `NumberField` that holds one number in a number input. */
export interface NumberEntryFieldProps
  extends FieldInputProps<number | null>, NumberFieldTextInputProps {
  /** Holds a range with `true` (`NumberRangeFieldProps`); a single number otherwise. */
  range?: false | undefined;
  /** A number input (`field`, the default); `slider` draws a track (`NumberSliderFieldProps`). */
  display?: 'field' | undefined;
  /** Number base. Nondecimal bases edit integers and show 0b, 0o or 0x prefixes. Defaults to 10. */
  radix?: NumberFieldRadix | undefined;
  /** The smallest value. */
  minValue?: number | undefined;
  /** The largest value. */
  maxValue?: number | undefined;
  /** The step of the buttons and the arrow keys, counted from `minValue` (or zero). Defaults to 1. */
  step?: number | undefined;
  /**
   * How the value is formatted and parsed in the locale: decimals, grouping, currency, percent,
   * units. With `units`, compact notation (`1K`) is not taken: the field writes and reads the
   * number in standard notation.
   */
  formatOptions?: Intl.NumberFormatOptions | undefined;
  /** What a commit does with a value outside the rules. Defaults to `snap`. */
  commitBehavior?: NumberFieldCommitBehavior | undefined;
  /** Leave out the decrement and increment buttons; the arrow keys still step the value. */
  hideStepper?: boolean | undefined;
  /** Content inside the frame before the number, such as a literal prefix (`$`). */
  startAdornment?: ReactNode;
  /** Content inside the frame after the number, such as a literal suffix (`/mo`) or a unit. */
  endAdornment?: ReactNode;
  /**
   * Where `endAdornment` sits: at the frame's trailing edge (`edge`, the default) or right after
   * the number (`value`), following it as it is typed and as its width changes.
   */
  endAdornmentPlacement?: NumberFieldAdornmentPlacement | undefined;
  /** The step of Alt with Arrow Up or Arrow Down, a step button or a scrub. */
  smallStep?: number | undefined;
  /** The step of Shift with Arrow Up or Arrow Down, a step button or a scrub. */
  largeStep?: number | undefined;
  /** Draws a scrub handle before the number: dragging it sideways steps the value. */
  showScrubber?: boolean | undefined;
  /**
   * Reads quantities typed with a unit (`5cm`) in the field's unit (`50` with `mm`), which is the
   * end adornment unless one is given. Decimal fields only.
   */
  units?: NumberFieldUnits | undefined;
}

/**
 * The props of any `NumberField`: a number input, a slider (`display="slider"`) or a range
 * (`range`), told apart by `range` and `display`. A wrapper typed with it forwards every mode.
 */
export type NumberFieldProps =
  NumberEntryFieldProps | NumberSliderFieldProps | NumberRangeFieldProps;

export type NumberControlConfig = Pick<
  NumberEntryFieldProps,
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
  | 'endAdornmentPlacement'
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

interface NumberControlProps {
  state: FieldState<number | null>;
  control: FieldControlProps;
  steps: NumberSteps;
  config: NumberControlConfig;
  radix: NumberFieldRadix;
  units: NumberFieldUnits | undefined;
}

/**
 * The field's control: React Aria's number field for plain decimal numbers, or a text input with a
 * codec for a nondecimal base or quantities with units.
 */
function NumberControl({ state, control, steps, config, radix, units }: NumberControlProps) {
  const strings = useUiStrings();
  const { locale } = useLocale();
  const formatter = useNumberFormatter(config.formatOptions);
  if (radix === 10 && !units) {
    return <DecimalControl state={state} control={control} steps={steps} config={config} />;
  }
  const codec =
    radix === 10 && units
      ? createQuantityCodec({
          units,
          locale,
          formatOptions: config.formatOptions,
          format: (value) => formatter.format(value),
          strings,
        })
      : createRadixCodec(radix);
  return (
    <TextNumberControl
      state={state}
      control={control}
      codec={codec}
      steps={steps}
      config={config}
    />
  );
}

/**
 * The number input display: a number parsed and formatted for the locale, with steppers. It commits
 * when focus leaves the field, on Enter and on each step, and reports a value outside its range or
 * off its step. Adornments sit inside its frame; Shift and Alt step by larger and smaller amounts,
 * and a scrub handle steps by dragging. A non-finite value reaches the controls as empty, as the
 * field judges it.
 */
function NumberEntryField({
  radix = 10,
  placeholder,
  autoComplete,
  enterKeyHint,
  hideStepper = false,
  startAdornment,
  endAdornment,
  endAdornmentPlacement = 'edge',
  smallStep,
  largeStep,
  showScrubber = false,
  commitBehavior = 'snap',
  units,
  ...props
}: NumberEntryFieldProps) {
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
  const state = isReadableNumber(held.value) ? held : { ...held, value: null };
  const steps: NumberSteps = { step: step ?? 1, smallStep, largeStep, minValue, maxValue };
  const data = {
    hideStepper,
    radix,
    adornmentPlacement: endAdornmentPlacement === 'value' ? 'value' : undefined,
  };
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
          endAdornment: endAdornment === undefined && units ? units.unit : endAdornment,
          endAdornmentPlacement,
          showScrubber,
          commitBehavior,
        };
        return (
          <NumberControl
            state={state}
            control={control}
            steps={steps}
            config={config}
            radix={radix}
            units={units}
          />
        );
      }}
    </Field>
  );
}

export type { NumberFieldRadix } from './radix-number.js';

/**
 * A field for a number or, with `range`, a range (a start and an end), drawn as number inputs or,
 * with `display="slider"`, as a track with a thumb per value.
 */
export function NumberField(props: NumberRangeFieldProps): ReactElement;
export function NumberField(props: NumberSliderFieldProps): ReactElement;
export function NumberField(props: NumberEntryFieldProps): ReactElement;
// Last, so `ComponentProps<typeof NumberField>` holds every mode and a wrapper can forward any.
export function NumberField(props: NumberFieldProps): ReactElement;
export function NumberField(props: NumberFieldProps): ReactElement {
  if (props.range) return <NumberRangeField {...props} />;
  if (props.display === 'slider') return <NumberSliderField {...props} />;
  const { range: _range, display: _display, ...entry } = props;
  // A quantity's compact notation would not read back, so it is written in standard notation.
  const formatOptions = entry.units
    ? toQuantityFormatOptions(entry.formatOptions)
    : entry.formatOptions;
  return <NumberEntryField {...entry} formatOptions={formatOptions} />;
}

export type {
  NumberFieldDisplay,
  NumberRange,
  NumberRangeFieldProps,
  NumberSliderFieldProps,
} from './number-slider.js';
export type { NumberFieldMark, NumberFieldValueLabel } from './number-slider-parts.js';
