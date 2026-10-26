/** What a part of a property panel reports to the level that holds it. */
export interface PropertyTally {
    /** Properties inside the part. */
    count: number;
    /** Properties that match the active query; all of them while no query is active. */
    matches: number;
    /** Whether a property inside overrides an inherited value. */
    isOverridden: boolean;
}
/** Whether a row's joined texts match the query, in place of holding each of its terms. */
export type PropertyScopeFilter = (text: string, query: string) => boolean;
/** What one level of a property panel hands to the parts inside it. */
export interface PropertyScopeValue {
    /** The active query's normalized terms; empty while nothing filters. */
    terms: readonly string[];
    /** The query as typed. */
    query: string;
    /** The caller's matching, when it replaces the terms'. */
    filter: PropertyScopeFilter | undefined;
    /** The texts of the enclosing section, group and card, joined by spaces. */
    path: string;
    /** Records a part's tally under its key and returns the function that removes it. */
    report: (key: symbol, tally: PropertyTally) => () => void;
}
export interface PropertyScopeLevel {
    /** The enclosing level. */
    parent: PropertyScopeValue;
    /** The value the parts inside this level receive. */
    value: PropertyScopeValue;
    /** The sum of the tallies the parts inside report. */
    total: PropertyTally;
    /** Whether a query is active. */
    isFiltering: boolean;
}
export declare const PropertyScopeContext: import("react").Context<PropertyScopeValue>;
/** Collects the tallies the parts inside one level report, and their sum. */
export declare function usePropertyTallies(): Pick<PropertyScopeValue, 'report'> & {
    total: PropertyTally;
};
/** Reports a part's tally to its enclosing level while the part is mounted. */
export declare function useReportPropertyTally(scope: PropertyScopeValue, tally: PropertyTally): void;
/** One level of the scope: a section, group or card that adds `text` to the path. */
export declare function usePropertyScopeLevel(text: string | undefined): PropertyScopeLevel;
/**
 * Whether the scope's path followed by `texts` matches the query: holds every active term, or
 * passes the caller's filter. True without a query.
 */
export declare function matchesPropertyScope(scope: PropertyScopeValue, texts: ReadonlyArray<string | undefined>): boolean;
//# sourceMappingURL=scope-tally.d.ts.map