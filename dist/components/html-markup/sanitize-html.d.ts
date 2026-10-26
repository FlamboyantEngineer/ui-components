export interface HtmlElementNode {
    readonly type: 'element';
    /** The tag name, in lower case. */
    readonly tag: string;
    /** The attributes the policy kept, lower-case names, entities decoded. */
    readonly attributes: Readonly<Record<string, string>>;
    readonly children: readonly HtmlNode[];
}
export interface HtmlTextNode {
    readonly type: 'text';
    readonly text: string;
}
export type HtmlNode = HtmlElementNode | HtmlTextNode;
/** What `sanitizeHtml` keeps. Names are lower case. */
export interface HtmlPolicy {
    /** Elements kept. Any other element is unwrapped: its content stays in its place. */
    elements: readonly string[];
    /** Attributes kept on kept elements. A name ending in `*` keeps every name it starts (`data-*`). */
    attributes: readonly string[];
    /** URL schemes allowed in URL attributes (`href`, `src`, `cite`, …); relative URLs always pass. */
    schemes: readonly string[];
}
/** The policy `sanitizeHtml` and `HtmlMarkup` use unless given another: rich text, no forms. */
export declare const defaultHtmlPolicy: HtmlPolicy;
/**
 * Sanitizes an HTML fragment into a frozen tree of the elements and attributes `policy` allows.
 * Scripts, styles, frames, embedded objects and form fields are dropped with their content; other
 * elements outside the policy are unwrapped. Event handlers, inline styles, unsafe URLs and `ui-`
 * classes are dropped, and a link that opens a new tab gets `rel="noopener noreferrer"`.
 */
export declare function sanitizeHtml(markup: string, policy?: HtmlPolicy): readonly HtmlNode[];
//# sourceMappingURL=sanitize-html.d.ts.map