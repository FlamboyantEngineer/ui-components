/**
 * `date` (`YYYY-MM-DD`), `time` (`HH:mm`), `date-time` (`YYYY-MM-DDTHH:mm`, or zoned with
 * `timeZone`), or a `{ start, end }` range of dates (`date-range`) or of dates and times
 * (`date-time-range`).
 */
export type DateTimeFieldMode = 'date' | 'time' | 'date-time' | 'date-range' | 'date-time-range';
/** The smallest part of a time the segments edit. */
export type DateTimeFieldGranularity = 'hour' | 'minute' | 'second';
/** A complete range of ISO 8601 dates, or of dates and times in `date-time-range` mode. */
export interface DateRangeValue {
    start: string;
    end: string;
}
/** A date-time field's value with its mode erased. */
export type DateFieldValue = string | DateRangeValue | null;
/** A single value's mode. */
export type SingleDateMode = 'date' | 'time' | 'date-time';
/** The settings that decide how a value's text reads and is written. */
export interface DateValueOptions {
    /** Edits dates and times in this IANA time zone, as zoned values, instead of floating ones. */
    timeZone?: string | undefined;
    granularity?: DateTimeFieldGranularity | undefined;
}
export interface DateBounds {
    minValue?: string | undefined;
    maxValue?: string | undefined;
}
/** The mode of each end of a range, or of a single value. */
export declare function toSingleMode(mode: DateTimeFieldMode): SingleDateMode;
/** The current date, or the current date and time to the granularity, as a value's text. */
export declare function currentDateValue(mode: 'date' | 'date-time', options?: DateValueOptions): string;
/** Which bound a value breaks, with that bound's value; a range's end may not precede its start. */
export declare function findBoundIssue(value: DateFieldValue, mode: DateTimeFieldMode, { minValue, maxValue, ...options }: DateBounds & DateValueOptions): {
    bound: 'min' | 'max';
    limit: string;
} | null;
/** Whether a value, or any calendar day in its inclusive range, falls on a date `isDateUnavailable` refuses. */
export declare function isUnavailableValue(value: DateFieldValue, mode: DateTimeFieldMode, options: DateValueOptions & {
    isDateUnavailable?: ((date: string) => boolean) | undefined;
}): boolean;
/** A value as localized text: a date, a time, both, or a range. Unreadable text is kept. */
export declare function formatDateValue(value: Exclude<DateFieldValue, null>, mode: DateTimeFieldMode, options: DateValueOptions & {
    locale: string;
}): string;
//# sourceMappingURL=date-values.d.ts.map