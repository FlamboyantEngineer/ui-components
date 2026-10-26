/** A whole, nonnegative count, or `undefined` when `value` is not a finite number. */
export declare function normalizeCount(value: number | null | undefined): number | undefined;
export interface FormatCountOptions {
    /** Counts above this cap read as `max+`. A cap that is not a finite, nonnegative number is ignored. */
    max?: number | undefined;
    /** More entries exist beyond the counted ones: the count reads as `count+`. */
    more?: boolean | undefined;
}
/**
 * The visible text of a count: `"12"`, `"9+"` above a cap of 9, or `"12+"` when more entries exist.
 * A count that is not a finite number has no text (`""`).
 */
export declare function formatCount(count: number, { max, more }?: FormatCountOptions): string;
//# sourceMappingURL=count.d.ts.map