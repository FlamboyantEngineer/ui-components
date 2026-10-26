/** A heading of the document an outline lists. */
export interface OutlineHeading {
    /** The id of the heading's element; its entry links to `#id`. Unique within the outline. */
    id: string;
    /** The entry's text. */
    label: string;
    /** The heading's level, 1 for the top; deeper levels nest under the nearest shallower heading. */
    level: number;
}
/** A heading in its place in the tree. */
export interface OutlineEntry {
    heading: OutlineHeading;
    /** Zero-based position among its siblings at each depth, from the top. */
    path: readonly number[];
    /** The ids of the entries it nests under, from the top. */
    ancestors: readonly string[];
    children: OutlineEntry[];
}
/**
 * Nests headings given in document order: each goes under the nearest heading before it with a
 * lower level, so a skipped level nests one step deeper, and a heading with no such heading before
 * it is at the top.
 */
export declare function nestOutlineHeadings(headings: readonly OutlineHeading[]): OutlineEntry[];
/** Every entry of the tree, in document order. */
export declare function flattenOutline(entries: readonly OutlineEntry[]): OutlineEntry[];
//# sourceMappingURL=outline-tree.d.ts.map