export interface NumberSummary {
    count: number;
    sum: number;
    min: number;
    max: number;
}
/** Finite numeric values in one pass, without spreading an unbounded input into a function call. */
export declare function summarizeNumbers(values: Iterable<unknown>): NumberSummary;
//# sourceMappingURL=summarize-numbers.d.ts.map