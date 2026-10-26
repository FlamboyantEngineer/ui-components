import { type CalendarDate, type CalendarDateTime, type Time, type ZonedDateTime } from '@internationalized/date';
/** A `YYYY-MM-DD` text as a calendar date, or `null` when it is not a real date. */
export declare function parseIsoDate(text: string | null | undefined): CalendarDate | null;
/** An `HH:mm` or `HH:mm:ss` text (fractions of a second ignored) as a time of day, or `null`. */
export declare function parseIsoTime(text: string | null | undefined): Time | null;
/**
 * A date and time text as the wall time it edits as. Without `timeZone` the result is a floating
 * local date and time: a floating text reads as written, and a text with an offset or a zone reads
 * as the local wall time of its instant. With `timeZone` the result is zoned there: a zoned or
 * offset text converts to the zone, and a floating text reads as wall time in it. `null` when the
 * text is not a date and time.
 */
export declare function parseIsoDateTime(text: string | null | undefined, timeZone?: string): CalendarDateTime | ZonedDateTime | null;
/**
 * A date object as its ISO 8601 text: `YYYY-MM-DD` for a date, `HH:mm` (`HH:mm:ss` at the `second`
 * granularity) for a time, `YYYY-MM-DDTHH:mm` (or with seconds) for a floating date and time, and
 * `YYYY-MM-DDTHH:mm:ss±HH:MM[Zone]` for a zoned one. Finer parts than the granularity are dropped.
 */
export declare function formatIsoDate(value: CalendarDate | CalendarDateTime | ZonedDateTime | Time, granularity?: 'hour' | 'minute' | 'second'): string;
//# sourceMappingURL=date-values.d.ts.map