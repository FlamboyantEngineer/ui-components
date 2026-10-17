import type { DatePickerProps as AriaDatePickerProps, DateValue } from 'react-aria-components';
import { useLocale } from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import {
  Field,
  useFieldControl,
  type FieldInputProps,
  type FieldIssue,
  type FieldState,
} from '../field/field.js';
import { DateControl, DateRangeControl, TimeControl } from './date-time-pickers.js';
import {
  findBoundIssue,
  formatDateValue,
  type DateFieldValue,
  type DateRangeValue,
  type DateTimeFieldMode,
} from './date-values.js';

/** A `YYYY-MM-DD`, `HH:mm` or UTC ISO text for a single mode, a date range for `date-range`. */
export type DateTimeFieldValue<M extends DateTimeFieldMode = 'date'> = M extends 'date-range'
  ? DateRangeValue | null
  : string | null;

export interface DateTimeFieldProps<M extends DateTimeFieldMode = 'date'>
  extends
    FieldInputProps<DateTimeFieldValue<M>>,
    Pick<AriaDatePickerProps<DateValue>, 'isOpen' | 'defaultOpen' | 'onOpenChange'> {
  /** `date` (the default), `time`, `date-time` or `date-range`. */
  mode?: M | undefined;
  /** The earliest value allowed, in the mode's format (a date for `date-range`). */
  minValue?: string | undefined;
  /** The latest value allowed, in the mode's format (a date for `date-range`). */
  maxValue?: string | undefined;
}

const hooks = createHooks('date-time-field');

const controls = {
  date: DateControl,
  'date-time': DateControl,
  'date-range': DateRangeControl,
  time: TimeControl,
};

/**
 * A field for a date, a time of day, a date and time, or a date range (React Aria `DatePicker`,
 * `TimeField` and `DateRangePicker`), with the field base's label, validation, dirty state,
 * restore, undo and menu. A value outside `minValue` and `maxValue` stays on screen, invalid and
 * uncommitted, until it is corrected.
 */
export function DateTimeField<M extends DateTimeFieldMode = 'date'>(props: DateTimeFieldProps<M>) {
  const strings = useUiStrings();
  const { locale } = useLocale();
  const mode: DateTimeFieldMode = props.mode ?? 'date';
  const bounds = { minValue: props.minValue, maxValue: props.maxValue };
  const checkBounds = (value: DateTimeFieldValue<M>): FieldIssue | null => {
    const issue = findBoundIssue(value, mode, bounds);
    if (!issue) return null;
    const limit = formatDateValue(issue.limit, mode, locale);
    const message =
      issue.bound === 'min' ? strings.dateTooEarly(limit) : strings.dateTooLate(limit);
    return { severity: 'error', message };
  };
  const empty = null as DateTimeFieldValue<M>;
  const { state, field, rest } = useFieldControl<DateTimeFieldValue<M>, DateTimeFieldProps<M>>(
    props,
    { initialValue: empty, emptyValue: empty, check: checkBounds },
  );
  const { mode: _mode, minValue: _min, maxValue: _max, ...open } = rest;
  const committed = state.committedValue;
  const previous = state.isDirty && committed ? formatDateValue(committed, mode, locale) : null;
  const Control = controls[mode];
  const pick = (value: DateFieldValue) => {
    state.setValue(value as DateTimeFieldValue<M>);
    if (!findBoundIssue(value, mode, bounds)) state.commit();
  };
  return (
    <Field
      {...field}
      {...hooks.root({ className: field.className, props: field, data: { mode } })}
      state={state}
    >
      {(control) => (
        <Control
          {...open}
          control={control}
          state={state as unknown as FieldState<DateFieldValue>}
          mode={mode}
          bounds={bounds}
          previous={previous}
          onPick={pick}
        />
      )}
    </Field>
  );
}

export type { DateRangeValue, DateTimeFieldMode } from './date-values.js';
