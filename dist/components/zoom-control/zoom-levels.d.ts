/** Finite zoom percentages in ascending order, without duplicates. */
export declare function sortZoomLevels(levels: readonly number[]): number[];
/** The nearest index and both step targets of an already normalised ladder. */
export declare function resolveZoomLevels(levels: readonly number[], value: number): {
    index: number;
    previous: number | undefined;
    next: number | undefined;
};
//# sourceMappingURL=zoom-levels.d.ts.map