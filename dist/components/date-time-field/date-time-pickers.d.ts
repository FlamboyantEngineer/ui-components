import type { DateTimeFieldDateState } from './date-time-field.js';
import { type FieldControlProps, type FieldState } from '../field/field.js';
import { type DateTimeFieldCalendarHeading, type DateTimeFieldPreset } from './date-time-calendar.js';
import { type DateBounds, type DateFieldValue, type DateTimeFieldMode, type DateValueOptions } from './date-values.js';
/** How the pickers edit and offer values, beyond the value itself. */
export interface DateControlSettings extends DateValueOptions {
    /** Shows the hours of a day in 12 or 24, whatever the locale's. */
    hourCycle?: 12 | 24 | undefined;
    /** Leaves the time zone out of a zoned value's segments. */
    hideTimeZone?: boolean | undefined;
    /** Refuses `YYYY-MM-DD` dates in the calendar and marks typed ones invalid. */
    isDateUnavailable?: ((date: string) => boolean) | undefined;
    getDateState?: ((date: string) => DateTimeFieldDateState | undefined) | undefined;
    presets: readonly DateTimeFieldPreset<DateFieldValue>[];
    calendarHeading: DateTimeFieldCalendarHeading;
    /** Whether the field would take a value, so the presets it refuses are disabled. */
    isPickable: (value: DateFieldValue) => boolean;
    /** A required field offers no Clear action. */
    isRequired: boolean;
    /** Whether Clear has a value to clear. */
    canClear: boolean;
}
/** What every picker of a date-time field receives. */
export interface DatePickerControlProps {
    control: FieldControlProps;
    state: FieldState<DateFieldValue>;
    mode: DateTimeFieldMode;
    bounds: DateBounds;
    settings: DateControlSettings;
    /** The committed value as text, shown before the input while the field is dirty. */
    previous: string | null;
    /** Sets a value the reader picked or typed. */
    onPick: (value: DateFieldValue) => void;
    isOpen?: boolean | undefined;
    defaultOpen?: boolean | undefined;
    onOpenChange?: ((isOpen: boolean) => void) | undefined;
}
/** A date, or a date and time, typed in segments or picked from a calendar. */
export declare function DateControl(props: DatePickerControlProps): import("react").JSX.Element;
/** A range of dates, or of dates and times, typed in two segment groups or picked from a calendar. */
export declare function DateRangeControl(props: DatePickerControlProps): import("react").JSX.Element;
/** A time of day typed in segments, with no picker. */
export declare function TimeControl(props: DatePickerControlProps): import("react").JSX.Element;
//# sourceMappingURL=date-time-pickers.d.ts.map