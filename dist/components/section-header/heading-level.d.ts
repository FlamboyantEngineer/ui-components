export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
/** The heading level of the nearest enclosing section, read by the sections nested in it. */
export declare const HeadingLevelContext: import("react").Context<HeadingLevel | undefined>;
/**
 * A heading's level: the explicit `level`, else one below the enclosing section's (down to 6),
 * else 3 outside any section.
 */
export declare function useHeadingLevel(level: HeadingLevel | undefined): HeadingLevel;
//# sourceMappingURL=heading-level.d.ts.map