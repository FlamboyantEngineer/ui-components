/** How one level of an outline number is written. */
export type OutlineNumberStyle = 'decimal' | 'lower-alpha' | 'upper-alpha' | 'lower-roman' | 'upper-roman';
export interface FormatOutlineNumberOptions {
    /** The style of each level from the top; the last one repeats for deeper levels. Defaults to `['decimal']`. */
    styles?: readonly OutlineNumberStyle[] | undefined;
    /** The number the first item of every level gets. Defaults to 1. */
    start?: number | undefined;
    /** Written between levels. Defaults to `.`. */
    separator?: string | undefined;
}
/**
 * The outline number of an item from its path: its zero-based position among its siblings at each
 * level, from the top (`[0, 1, 2]` → `1.2.3`). Each level is written in its style, starting at
 * `start`, and levels are joined with `separator`.
 */
export declare function formatOutlineNumber(path: readonly number[], { styles, start, separator }?: FormatOutlineNumberOptions): string;
//# sourceMappingURL=outline-number.d.ts.map