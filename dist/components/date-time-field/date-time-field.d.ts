import type { Tone } from '../../core/props.js';
import type { OpenStateProps } from '../../core/events.js';
import { type FieldInputProps } from '../field/field.js';
import type { DateTimeFieldCalendarHeading, DateTimeFieldPreset } from './date-time-calendar.js';
import { type DateRangeValue, type DateTimeFieldGranularity, type DateTimeFieldMode } from './date-values.js';
/**
 * An ISO 8601 text for a single mode (`YYYY-MM-DD`, `HH:mm`, `YYYY-MM-DDTHH:mm` or a zoned date and
 * time), a `{ start, end }` range of them for a range mode.
 */
export type DateTimeFieldValue<M extends DateTimeFieldMode = 'date'> = M extends 'date-range' | 'date-time-range' ? DateRangeValue | null : string | null;
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
export interface DateTimeFieldProps<M extends DateTimeFieldMode = 'date'> extends FieldInputProps<DateTimeFieldValue<M>>, OpenStateProps {
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
/**
 * A field for a date, a time of day, a date and time, or a range of dates or of dates and times
 * (React Aria `DatePicker`, `TimeField` and `DateRangePicker`), with the field base's label,
 * validation, dirty state, restore, undo and menu. A value outside `minValue` and `maxValue`, or on
 * an unavailable date, stays on screen, invalid and uncommitted, until it is corrected.
 */
export declare function DateTimeField<M extends DateTimeFieldMode = 'date'>(props: DateTimeFieldProps<M>): import("react").JSX.Element;
export { CalendarBody } from './date-time-calendar.js';
export { formatDateValue } from './date-values.js';
export type { DateTimeFieldCalendarHeading, DateTimeFieldPreset } from './date-time-calendar.js';
export type { DateRangeValue, DateTimeFieldGranularity, DateTimeFieldMode } from './date-values.js';
//# sourceMappingURL=date-time-field.d.ts.map