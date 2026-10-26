/** Entries that fall on one day, in the order they were given. */
export interface DayGroup<T> {
    /** The day as an ISO 8601 date (`YYYY-MM-DD`), or empty text for entries without a readable date. */
    day: string;
    /** The day as a heading: `Today`, `Yesterday`, the date, or `unknownLabel`. */
    label: string;
    items: T[];
}
export interface GroupByDayOptions<T> {
    /** The entry's ISO 8601 date or date and time. */
    getDate: (item: T) => string;
    /** The moment `Today` is read against. */
    now: Date;
    locale: string;
    /** Labels the group of entries whose date cannot be read. */
    unknownLabel: string;
}
/**
 * Groups entries by the local calendar day of their date, keeping the groups in the order their
 * first entry appears and the entries in their given order. Entries without a readable date share
 * one group labelled `unknownLabel`.
 */
export declare function groupByDay<T>(items: readonly T[], options: GroupByDayOptions<T>): DayGroup<T>[];
//# sourceMappingURL=group-by-day.d.ts.map