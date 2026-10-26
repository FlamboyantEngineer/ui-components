import { type RelativeTimeRelation } from '../../utils/relative-time.js';
/**
 * `date` values are `YYYY-MM-DD` texts, `date-time` values local `YYYY-MM-DDTHH:mm` texts and
 * `date-range` values `{ start, end }` ranges of dates.
 */
export type RelativeDateKind = 'date' | 'date-time' | 'date-range';
export type RelativeDateUnit = 'day' | 'week' | 'month' | 'year';
/** A range of `YYYY-MM-DD` dates. */
export interface RelativeDateRange {
    start: string;
    end: string;
}
/** A relative date field's value with its kind erased. */
export type RelativeDateValue = string | RelativeDateRange;
/**
 * A value relative to now: `{ amount: 1, unit: 'day' }` is tomorrow, a negative amount is past. For a
 * range it runs from now to that point (`{ amount: -7, unit: 'day' }` is the last 7 days).
 */
export interface RelativeDatePreset {
    amount: number;
    unit: RelativeDateUnit;
    /** Names the preset instead of the text generated from its amount and unit. */
    label?: string | undefined;
}
/** A named preset whose value the caller computes from now, such as the end of the quarter. */
export interface RelativeDateComputedPreset<V> {
    label: string;
    getValue: (now: Date) => V;
}
export type RelativeDateRelation = RelativeTimeRelation;
export interface RelativeDateText {
    /** The value relative to now, such as `Tomorrow` or `3 days ago`. */
    relative: string;
    /** The value as a localized date, or date and time. */
    absolute: string;
    relation: RelativeDateRelation;
}
/** The earliest and latest `YYYY-MM-DD` dates a value may fall on. */
export interface RelativeDateBounds {
    minValue?: string | undefined;
    maxValue?: string | undefined;
}
/** The local calendar day of a moment, as `YYYY-MM-DD`. */
export declare function toLocalDay(now: Date): string;
/**
 * Describes a value relative to `now` through the shared relative time formatter, with the relative
 * text capitalized as a label. `null` when the value is not a date.
 */
export declare function describeRelativeDate(value: string, options: {
    now: Date;
    locale: string;
    fallbackAfterDays: number;
}): RelativeDateText | null;
/**
 * Describes a range relative to `now`: each end in relative words (`7 days ago – Today`), the
 * localized range, and whether it lies before, around or after today. `null` unless both ends are
 * dates.
 */
export declare function describeRelativeRange(range: RelativeDateRange, options: {
    now: Date;
    locale: string;
    fallbackAfterDays: number;
}): RelativeDateText | null;
/** A preset's label: its own, or one such as `Today`, `Next week` or `In 3 days`. */
export declare function formatRelativePreset(preset: RelativeDatePreset, locale: string): string;
/** A range preset's count of units, such as `7 days`, for the `Last …` and `Next …` labels. */
export declare function formatRelativePeriod(preset: RelativeDatePreset, locale: string): string;
/** The value a preset stands for, counted from `now`, as a date or a local date and time. */
export declare function resolveRelativePreset(preset: RelativeDatePreset, options: {
    now: Date;
    kind: 'date' | 'date-time';
}): string;
/** The range a preset stands for: from the point it names to today, or from today to it. */
export declare function resolveRelativeRange(preset: RelativeDatePreset, now: Date): RelativeDateRange;
/** A picked `YYYY-MM-DD` day as a value: the date, or that day at the current time of day. */
export declare function resolvePickedDate(date: string, options: {
    now: Date;
    kind: 'date' | 'date-time';
}): string;
/** The `YYYY-MM-DD` date a value falls on, for a date or a date and time. */
export declare function toValueDate(value: string): string | null;
/** Which bound a value, or either end of a range, breaks, with that bound's date. */
export declare function findRelativeBoundIssue(value: RelativeDateValue | null, { minValue, maxValue }: RelativeDateBounds): {
    bound: 'min' | 'max';
    limit: string;
} | null;
//# sourceMappingURL=relative-date.d.ts.map