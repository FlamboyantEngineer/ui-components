/** A run of entries from one calendar day. */
export interface DayGroup<T> {
    /** The day as `YYYY-MM-DD`, or an empty string for entries whose time cannot be read. */
    day: string;
    /** The day's heading: `Today`, `Yesterday`, `Tomorrow`, or the date. */
    label: string;
    items: T[];
}
export interface DayGroupOptions {
    /** The moment `Today` is read against. */
    now: Date;
    locale: string;
    /** The heading of entries whose time cannot be read. */
    unknownLabel: string;
}
/**
 * Splits entries, in the order given, into runs of consecutive entries from the same local calendar
 * day, each with its heading. Entries whose time cannot be read form runs of their own.
 */
export declare function groupByDay<T extends {
    time: string;
}>(items: readonly T[], options: DayGroupOptions): DayGroup<T>[];
//# sourceMappingURL=day-groups.d.ts.map