/** One value of a facet. */
export interface FacetListOption {
    /** The stored value. */
    value: string;
    /** The visible text, matched by the search. */
    label: string;
    /** How many records hold the value; absent shows no count. */
    count?: number | undefined;
    isDisabled?: boolean | undefined;
}
export interface FacetOptionsQuery {
    options: readonly FacetListOption[];
    /** The search text; the limit does not apply while it is not blank. */
    query: string;
    /** Values listed before the others, in option order; `null` keeps option order. */
    firstValues: readonly string[] | null;
    /** How many options show while folded. */
    limit: number;
    isExpanded: boolean;
}
export interface FacetOptions {
    /** The options to draw, in order. */
    shown: FacetListOption[];
    /** How many options matching the search the fold hides. */
    hiddenCount: number;
    /** How many options match the search. */
    matchCount: number;
}
/** The options a facet list draws, and how many matching ones its fold hides. */
export declare function listFacetOptions({ options, query, firstValues, limit, isExpanded, }: FacetOptionsQuery): FacetOptions;
//# sourceMappingURL=facet-options.d.ts.map