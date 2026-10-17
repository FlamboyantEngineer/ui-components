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
import type { DateTimeFieldCalendarHeading, DateTimeFieldPreset } from './date-time-calendar.js';
import { DateFormInputs } from './date-time-form.js';
import {
  DateControl,
  DateRangeControl,
  TimeControl,
  type DateControlSettings,
} from './date-time-pickers.js';
import {
  findBoundIssue,
  formatDateValue,
  isUnavailableValue,
  type DateFieldValue,
  type DateRangeValue,
  type DateTimeFieldGranularity,
  type DateTimeFieldMode,
} from './date-values.js';

/** A `YYYY-MM-DD`, `HH:mm` or UTC ISO text for a single mode, a `{ start, end }` range for a range. */
export type DateTimeFieldValue<M extends DateTimeFieldMode = 'date'> = M extends
  | 'date-range'
  | 'date-time-range'
  ? DateRangeValue | null
  : string | null;

export interface DateTimeFieldProps<M extends DateTimeFieldMode = 'date'>
  extends
    FieldInputProps<DateTimeFieldValue<M>>,
    Pick<
      AriaDatePickerProps<DateValue>,
      'isOpen' | 'defaultOpen' | 'onOpenChange' | 'isDateUnavailable' | 'hourCycle' | 'hideTimeZone'
    > {
  /** `date` (the default), `time`, `date-time`, `date-range` or `date-time-range`. */
  mode?: M | undefined;
  /** The earliest value allowed, in the mode's format (a date or an instant for a range). */
  minValue?: string | undefined;
  /** The latest value allowed, in the mode's format (a date or an instant for a range). */
  maxValue?: string | undefined;
  /** The smallest part of a time the segments edit. Defaults to `minute`. */
  granularity?: DateTimeFieldGranularity | undefined;
  /** The IANA time zone the date and time modes edit instants in, instead of the local one. */
  timeZone?: string | undefined;
  /** Named values offered beside the calendar, such as `Last 7 days`. */
  presets?: readonly DateTimeFieldPreset<NonNullable<DateTimeFieldValue<M>>>[] | undefined;
  /** How the calendar heading shows its month. Defaults to `text`; `select` jumps by month and year. */
  calendarHeading?: DateTimeFieldCalendarHeading | undefined;
  /** The form name of a single value, submitted as its canonical text. */
  name?: string | undefined;
  /** The form name of a range's start. */
  startName?: string | undefined;
  /** The form name of a range's end. */
  endName?: string | undefined;
}

type AnyDateTimeFieldProps = DateTimeFieldProps<DateTimeFieldMode>;

const hooks = createHooks('date-time-field');

const controls = {
  date: DateControl,
  'date-time': DateControl,
  'date-range': DateRangeControl,
  'date-time-range': DateRangeControl,
  time: TimeControl,
};

/**
 * The field's own check: a value outside the bounds, or on a date `isDateUnavailable` refuses, is
 * invalid with a message naming the reason.
 */
function useDateCheck(props: AnyDateTimeFieldProps, mode: DateTimeFieldMode) {
  const strings = useUiStrings();
  const { locale } = useLocale();
  const options = { timeZone: props.timeZone, granularity: props.granularity };
  return (value: DateFieldValue): FieldIssue | null => {
    const issue = findBoundIssue(value, mode, props);
    if (issue) {
      const limit = formatDateValue(issue.limit, mode, { ...options, locale });
      const message =
        issue.bound === 'min' ? strings.dateTooEarly(limit) : strings.dateTooLate(limit);
      return { severity: 'error', message };
    }
    const isDateUnavailable = props.isDateUnavailable;
    if (isUnavailableValue(value, mode, { ...options, isDateUnavailable })) {
      return { severity: 'error', message: strings.dateUnavailable };
    }
    return null;
  };
}

function toSettings(
  props: AnyDateTimeFieldProps,
  isPickable: (value: DateFieldValue) => boolean,
): DateControlSettings {
  return {
    timeZone: props.timeZone,
    granularity: props.granularity,
    hourCycle: props.hourCycle,
    hideTimeZone: props.hideTimeZone,
    isDateUnavailable: props.isDateUnavailable,
    presets: props.presets ?? [],
    calendarHeading: props.calendarHeading ?? 'text',
    isPickable,
  };
}

/**
 * A field for a date, a time of day, a date and time, or a range of dates or of dates and times
 * (React Aria `DatePicker`, `TimeField` and `DateRangePicker`), with the field base's label,
 * validation, dirty state, restore, undo and menu. A value outside `minValue` and `maxValue`, or on
 * an unavailable date, stays on screen, invalid and uncommitted, until it is corrected.
 */
export function DateTimeField<M extends DateTimeFieldMode = 'date'>(props: DateTimeFieldProps<M>) {
  const { locale } = useLocale();
  const all = props as AnyDateTimeFieldProps;
  const mode: DateTimeFieldMode = props.mode ?? 'date';
  const check = useDateCheck(all, mode);
  const empty = null as DateTimeFieldValue<M>;
  const { state, field } = useFieldControl<DateTimeFieldValue<M>, DateTimeFieldProps<M>>(props, {
    initialValue: empty,
    emptyValue: empty,
    check,
  });
  const committed = state.committedValue;
  const previous =
    state.isDirty && committed
      ? formatDateValue(committed, mode, { locale, timeZone: props.timeZone })
      : null;
  const Control = controls[mode];
  const pick = (value: DateFieldValue) => {
    state.setValue(value as DateTimeFieldValue<M>);
    if (!check(value)) state.commit();
  };
  return (
    <Field
      {...field}
      {...hooks.root({ className: field.className, props: field, data: { mode } })}
      state={state}
    >
      {(control) => (
        <>
          <Control
            isOpen={props.isOpen}
            defaultOpen={props.defaultOpen}
            onOpenChange={props.onOpenChange}
            control={control}
            state={state as unknown as FieldState<DateFieldValue>}
            mode={mode}
            bounds={props}
            settings={toSettings(all, (value) => !check(value))}
            previous={previous}
            onPick={pick}
          />
          <DateFormInputs value={state.value} names={props} isDisabled={state.isDisabled} />
        </>
      )}
    </Field>
  );
}

export { CalendarBody } from './date-time-calendar.js';
export type { DateTimeFieldCalendarHeading, DateTimeFieldPreset } from './date-time-calendar.js';
export type { DateRangeValue, DateTimeFieldGranularity, DateTimeFieldMode } from './date-values.js';
