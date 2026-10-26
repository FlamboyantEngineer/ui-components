export interface MarkupTextToken {
    readonly type: 'text';
    readonly text: string;
}
export interface MarkupOpenToken {
    readonly type: 'open';
    /** The tag name as written. */
    readonly tag: string;
    /** Attributes as written, with entities decoded; the first of repeated names wins. */
    readonly attributes: Readonly<Record<string, string>>;
    /** The tag ends in `/>`. */
    readonly isSelfClosing: boolean;
}
export interface MarkupCloseToken {
    readonly type: 'close';
    readonly tag: string;
}
export type MarkupToken = MarkupTextToken | MarkupOpenToken | MarkupCloseToken;
export interface TokenizeMarkupOptions {
    /** Lower-case names of elements whose content is raw text up to their closing tag. */
    rawTextElements?: ReadonlySet<string> | undefined;
}
export interface SkipDroppedElementsOptions {
    /** Whether an opening tag starts an element dropped with its content. */
    isDropped: (token: MarkupOpenToken) => boolean;
    /** Whether an opening tag has no content (self-closing, or void in HTML). Defaults to `/>`. */
    isEmpty?: ((token: MarkupOpenToken) => boolean) | undefined;
}
/**
 * Decodes numeric character references and the common named entities (`&amp;`, `&nbsp;`,
 * `&mdash;`, …). An unknown name stays as written; a reference to no character becomes U+FFFD.
 */
export declare function decodeEntities(text: string): string;
/**
 * Splits markup into text, opening-tag and closing-tag tokens without touching the DOM. Comments,
 * processing instructions and declarations are dropped; CDATA sections become text; text has its
 * entities decoded. A `<` that starts no tag is text. The content of a raw-text element is one
 * undecoded text token, followed by its closing tag (implied at the end of the markup).
 */
export declare function tokenizeMarkup(markup: string, options?: TokenizeMarkupOptions): MarkupToken[];
/**
 * The tokens outside the elements `isDropped` picks: each picked element is skipped with its
 * content up to its matching closing tag. Elements of the same name nested inside it are counted,
 * so their closing tags do not end the drop early; tag names compare ignoring case.
 */
export declare function skipDroppedElements(tokens: Iterable<MarkupToken>, { isDropped, isEmpty }: SkipDroppedElementsOptions): Generator<MarkupToken>;
//# sourceMappingURL=markup.d.ts.map