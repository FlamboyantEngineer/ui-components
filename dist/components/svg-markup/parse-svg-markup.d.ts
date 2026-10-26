export interface SvgElementNode {
    readonly type: 'element';
    /** The tag name as written (`path`, `linearGradient`). The root is always `svg`. */
    readonly tag: string;
    /** Attributes as written in the markup, with entities decoded. */
    readonly attributes: Readonly<Record<string, string>>;
    readonly children: readonly SvgNode[];
}
export interface SvgTextNode {
    readonly type: 'text';
    readonly text: string;
}
export type SvgNode = SvgElementNode | SvgTextNode;
/**
 * Parses SVG markup into a frozen element tree rooted at its `<svg>` element. Comments, processing
 * instructions and doctypes are dropped; CDATA becomes text; entities are decoded. Scripts, embedded
 * HTML (`foreignObject`), event-handler attributes, script URLs and SMIL animations that could set a
 * link to a script URL are dropped. Results are cached by markup string, keeping the most recently
 * used entries. Throws when the markup has no `<svg>` root.
 */
export declare function parseSvgMarkup(markup: string): SvgElementNode;
//# sourceMappingURL=parse-svg-markup.d.ts.map