export interface ValueSummaryOptions {
    /** The drawn values; those that are not finite numbers are left out. */
    values: readonly number[];
    /** How many series are drawn. */
    series: number;
    format: Intl.NumberFormat;
}
/** The text that describes drawn values: how many series and values, and the lowest and highest. */
export declare function useValueSummary({ values, series, format }: ValueSummaryOptions): string;
//# sourceMappingURL=chart-summary.d.ts.map