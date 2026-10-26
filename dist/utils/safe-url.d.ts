/** The schemes `isSafeUrl` accepts by default. */
export declare const defaultUrlSchemes: readonly string[];
/**
 * Whether a URL from authored content is safe to render: relative (a path, `?query`, `#fragment`,
 * `//host`) or using one of `schemes`. Control characters and whitespace are ignored first, as a
 * browser ignores them, so `java\tscript:` reads as `javascript:`.
 */
export declare function isSafeUrl(url: string, schemes?: readonly string[]): boolean;
//# sourceMappingURL=safe-url.d.ts.map