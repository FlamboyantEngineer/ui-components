import { type ScaleInterval, type ScaleTick } from './linear-scale.js';
/** The calendar unit between a time scale's ticks. */
export type TimeScaleUnit = 'day' | 'week' | 'month' | 'quarter' | 'year';
export interface TimeScaleOptions {
    /** The first and last instants, as ISO 8601 dates (`2026-03-01`) or date-times. */
    domain: readonly [string, string];
    /** The positions they map to, such as pixels; reversed ends flip the scale. */
    range: ScaleInterval;
    /** The IANA time zone whose calendar places ticks and reads dates. Defaults to the runtime's. */
    timeZone?: string | undefined;
    /** BCP 47 locale of the labels and the first day of the week. Defaults to the runtime's. */
    locale?: string | undefined;
}
export interface TimeTickOptions {
    /** The unit between ticks. Defaults to the smallest whose ticks number at most `count`. */
    unit?: TimeScaleUnit | undefined;
    /** The most ticks a chosen unit makes. Defaults to 8. */
    count?: number | undefined;
}
export interface TimeScale {
    readonly domain: readonly [string, string];
    readonly range: ScaleInterval;
    /** The position of an ISO 8601 date or date-time; `NaN` for text that is not one. */
    map(value: string): number;
    /** The instant at a position, as an ISO 8601 date-time in UTC; empty for a non-finite position. */
    invert(position: number): string;
    /** The starts of calendar units inside the domain, as `YYYY-MM-DD` dates in increasing order. */
    ticks(options?: TimeTickOptions): Array<ScaleTick<string>>;
    /** An ISO 8601 date or date-time as the label of a tick of `unit`. */
    format(value: string, unit: TimeScaleUnit): string;
}
/**
 * The first day of the calendar `unit` holding a `YYYY-MM-DD` date, as a `YYYY-MM-DD` date; weeks
 * start on the first day of the week of `locale` (the runtime's by default). Empty for a text that
 * is not a date.
 */
export declare function floorToTimeUnit(date: string, unit: TimeScaleUnit, locale?: string): string;
/**
 * A `YYYY-MM-DD` date moved by `count` calendar units (negative counts move back), as a
 * `YYYY-MM-DD` date. A day past the end of the target month clamps to its last day. Empty for a
 * text that is not a date.
 */
export declare function addTimeUnits(date: string, unit: TimeScaleUnit, count: number): string;
/**
 * A time scale from a domain of ISO 8601 instants to a range of positions, linear in elapsed time,
 * with ticks at the starts of calendar days, weeks, months, quarters or years in its time zone.
 */
export declare function createTimeScale(options: TimeScaleOptions): TimeScale;
//# sourceMappingURL=time-scale.d.ts.map