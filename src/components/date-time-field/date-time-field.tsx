'use client';

import { useLocale } from '../../primitives/index.js';
import type { Tone } from '../../core/props.js';
import type { OpenStateProps } from '../../core/events.js';
import { useUiStrings } from '../../core/provider.js';
import { useTimeZone } from '../../core/clock.js';
import {
  Field,
  useFieldControl,
  type FieldInputProps,
  type FieldIssue,
  type FieldState,
} from '../field/field.js';
import type { DateTimeFieldCalendarHeading, DateTimeFieldPreset } from './date-time-calendar.js';
import { createDateUnavailableCheck } from './date-states.js';
import { DateFormInputs, toEndpointErrorSources } from './date-time-form.js';
import {
  DateControl,
  DateRangeControl,
  TimeControl,
  type DateControlSettings,
} from './date-time-pickers.js';
import {
  findBoundIssue,
  isReadableValue,
  formatDateValue,
  isUnavailableValue,
  normalizeDateValue,
  type DateFieldValue,
  type DateRangeValue,
  type DateTimeFieldGranularity,
  type DateTimeFieldMode,
  type DateValueOptions,
} from './date-values.js';
import { dateTimeFieldHooks as hooks } from './date-time-field-hooks.js';

/**
 * An ISO 8601 text for a single mode (`YYYY-MM-DD`, `HH:mm`, `YYYY-MM-DDTHH:mm` or a zoned date and
 * time), a `{ start, end }` range of them for a range mode.
 */
export type DateTimeFieldValue<M extends DateTimeFieldMode = 'date'> = M extends
  | 'date-range'
  | 'date-time-range'
  ? DateRangeValue | null
  : string | null;

export interface DateTimeFieldDateState {
  /** Semantic highlight, styled by the host stylesheet. */
  tone?: Tone | undefined;
  /** Accessible explanation of the date's status. */
  description?: string | undefined;
  /** Unavailable date, shown faded. */
  isDisabled?: boolean | undefined;
  /** Unavailable appointment, shown struck through. */
  isTaken?: boolean | undefined;
}

export interface DateTimeFieldProps<M extends DateTimeFieldMode = 'date'>
  extends FieldInputProps<DateTimeFieldValue<M>>, OpenStateProps {
  /** `date` (the default), `time`, `date-time`, `date-range` or `date-time-range`. */
  mode?: M | undefined;
  /** The earliest value allowed, as one end of the mode's value (a date for a date range). */
  minValue?: string | undefined;
  /** The latest value allowed, as one end of the mode's value (a date for a date range). */
  maxValue?: string | undefined;
  /** The smallest part of a time the segments edit. Defaults to `minute`. */
  granularity?: DateTimeFieldGranularity | undefined;
  /** An IANA time zone: the date-time modes edit zoned values in it instead of floating ones. */
  timeZone?: string | undefined;
  /** Shows the hours of a day in a 12 or 24 hour cycle, whatever the locale's. */
  hourCycle?: 12 | 24 | undefined;
  /** Leaves the time zone segment out of a zoned value. */
  hideTimeZone?: boolean | undefined;
  /** Refuses a `YYYY-MM-DD` date, such as a weekend: the calendar skips it and a typed one is invalid. */
  isDateUnavailable?: ((date: string) => boolean) | undefined;
  /** Highlights or restricts each ISO calendar date. Disabled and taken dates cannot be selected. */
  getDateState?: ((date: string) => DateTimeFieldDateState | undefined) | undefined;
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

const controls = {
  date: DateControl,
  'date-time': DateControl,
  'date-range': DateRangeControl,
  'date-time-range': DateRangeControl,
  time: TimeControl,
};

/**
 * The field's own check: a value the mode cannot read, outside the bounds, or on a date
 * `isDateUnavailable` refuses, is invalid with a message naming the reason.
 */
function useDateCheck(
  props: AnyDateTimeFieldProps,
  mode: DateTimeFieldMode,
  options: DateValueOptions,
) {
  const strings = useUiStrings();
  const { locale } = useLocale();
  return (value: DateFieldValue): FieldIssue | null => {
    if (!isReadableValue(value, mode, options)) {
      return { severity: 'error', message: strings.dateUnreadable };
    }
    const issue = findBoundIssue(value, mode, { ...props, ...options });
    if (issue) {
      const limit = formatDateValue(issue.limit, mode, { ...options, locale });
      const message =
        issue.bound === 'min' ? strings.dateTooEarly(limit) : strings.dateTooLate(limit);
      return { severity: 'error', message };
    }
    const isDateUnavailable = createDateUnavailableCheck(props);
    if (isUnavailableValue(value, mode, { ...options, isDateUnavailable })) {
      return { severity: 'error', message: strings.dateUnavailable };
    }
    return null;
  };
}

function toSettings(
  props: AnyDateTimeFieldProps,
  options: DateValueOptions & Pick<DateControlSettings, 'isPickable'>,
  state: Pick<FieldState<unknown>, 'isRequired' | 'canClear'>,
): DateControlSettings {
  return {
    isRequired: state.isRequired,
    canClear: state.canClear,
    ...options,
    hourCycle: props.hourCycle,
    hideTimeZone: props.hideTimeZone,
    getDateState: props.getDateState,
    isDateUnavailable: createDateUnavailableCheck(props),
    presets: props.presets ?? [],
    calendarHeading: props.calendarHeading ?? 'text',
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
  // Offset and zoned texts read in the provider's hydration-stable zone, so the server and the
  // first client render agree; the browser's zone applies once the clock may be read.
  const options = {
    timeZone: all.timeZone,
    localZone: useTimeZone(),
    granularity: all.granularity,
  };
  const check = useDateCheck(all, mode, options);
  const empty = null as DateTimeFieldValue<M>;
  const { state, field } = useFieldControl<DateTimeFieldValue<M>, DateTimeFieldProps<M>>(props, {
    initialValue: empty,
    emptyValue: empty,
    check,
    errorSources: toEndpointErrorSources(props),
  });
  const committed = state.committedValue;
  const previous =
    state.isDirty && committed
      ? formatDateValue(committed, mode, { ...options, locale, hourCycle: all.hourCycle })
      : null;
  const Control = controls[mode];
  const normalize = (value: DateFieldValue) => normalizeDateValue(value, mode, options);
  const pick = (picked: DateFieldValue) => {
    const value = normalize(picked);
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
            state={state}
            mode={mode}
            bounds={props}
            settings={toSettings(
              all,
              { ...options, isPickable: (value) => !check(normalize(value)) },
              state,
            )}
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
export { DateFormInputs, toEndpointErrorSources } from './date-time-form.js';
export { formatDateValue } from './date-values.js';
export type { DateTimeFieldCalendarHeading, DateTimeFieldPreset } from './date-time-calendar.js';
export type { DateRangeValue, DateTimeFieldGranularity, DateTimeFieldMode } from './date-values.js';
