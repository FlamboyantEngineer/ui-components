/** Whether a value lies before, at or after now. */
export type RelativeTimeRelation = 'past' | 'present' | 'future';
/** An `Intl.DateTimeFormat` date or time style. */
export type RelativeTimeStyle = 'full' | 'long' | 'medium' | 'short';
export interface RelativeTimeOptions {
    /** The moment the value is read against. */
    now: Date;
    locale: string;
    /** Values this many calendar days away or more read as the absolute date. */
    fallbackAfterDays: number;
    /** The absolute date's style. Defaults to `medium`. */
    dateStyle?: RelativeTimeStyle | undefined;
    /** The absolute time's style, for a date and time. Defaults to `short`. */
    timeStyle?: RelativeTimeStyle | undefined;
}
export interface RelativeTimeText {
    /**
     * The value relative to now as Intl words it mid-sentence (`yesterday`, `in 2 hours`), or the
     * absolute text once the value is `fallbackAfterDays` away.
     */
    relative: string;
    /** The value as a localized date, or date and time. */
    absolute: string;
    relation: RelativeTimeRelation;
    /** Whether `relative` reads relative; false once it falls back to the absolute text. */
    isRelative: boolean;
    /** Milliseconds until `relative` may read differently, or `null` when it never will. */
    nextChange: number | null;
}
/** Upper-cases the first letter, for relative text that starts a label or a sentence. */
export declare function capitalizeText(text: string, locale: string): string;
/**
 * Describes an ISO 8601 date (`YYYY-MM-DD`) or date and time relative to `now`: seconds, minutes
 * or hours for an instant within a day, by its rounded count (59.7 seconds reads `1 minute`, 23.6
 * hours reads in days), calendar days within `fallbackAfterDays`, and the absolute date beyond.
 * `null` when the value is not a date.
 */
export declare function describeRelativeTime(value: string, options: RelativeTimeOptions): RelativeTimeText | null;
//# sourceMappingURL=relative-time.d.ts.map