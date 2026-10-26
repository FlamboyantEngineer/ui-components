interface NumberBounds {
    minValue?: number | undefined;
    maxValue?: number | undefined;
    step?: number | undefined;
}
/** Snaps an edited value while external values remain visible for validation. */
export declare function snapNumberValue(value: number, bounds: NumberBounds): number;
export {};
//# sourceMappingURL=snap-number-value.d.ts.map