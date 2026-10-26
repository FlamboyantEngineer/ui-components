export interface AmountShare<T> {
    item: T;
    value: number;
    /** The item's share of the whole, from 0 to 1. */
    share: number;
}
/** Positive amounts and their shares, retaining proportions when their sum overflows. */
export declare function resolveAmountShares<T>(items: readonly T[], getValue: (item: T) => number, total?: number): {
    amounts: Array<AmountShare<T>>;
    total: number;
};
//# sourceMappingURL=resolve-amount-shares.d.ts.map