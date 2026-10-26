/** Column alignment from a table's divider row (`:---`, `:---:`, `---:`), or `null`. */
export type MarkdownAlign = 'start' | 'center' | 'end' | null;
export interface MarkdownText {
    readonly type: 'text';
    readonly text: string;
}
export interface MarkdownInlineCode {
    readonly type: 'inlineCode';
    readonly text: string;
}
export interface MarkdownEmphasis {
    readonly type: 'emphasis' | 'strong' | 'strikethrough';
    readonly children: readonly MarkdownInline[];
}
export interface MarkdownLink {
    readonly type: 'link';
    /** A relative URL or one with an `http`, `https`, `mailto` or `tel` scheme. */
    readonly href: string;
    readonly title: string | null;
    readonly children: readonly MarkdownInline[];
}
export interface MarkdownImage {
    readonly type: 'image';
    /** A relative URL or one with an `http` or `https` scheme. */
    readonly src: string;
    readonly alt: string;
    readonly title: string | null;
}
export interface MarkdownLineBreak {
    readonly type: 'lineBreak';
}
export type MarkdownInline = MarkdownText | MarkdownInlineCode | MarkdownEmphasis | MarkdownLink | MarkdownImage | MarkdownLineBreak;
export interface MarkdownHeading {
    readonly type: 'heading';
    readonly level: 1 | 2 | 3 | 4 | 5 | 6;
    /** A slug of the heading's text, unique within the document (`install`, `install-2`). */
    readonly id: string;
    readonly children: readonly MarkdownInline[];
}
export interface MarkdownParagraph {
    readonly type: 'paragraph';
    readonly children: readonly MarkdownInline[];
}
export interface MarkdownCodeBlock {
    readonly type: 'codeBlock';
    /** The first word of a fence's info string (`ts` in ```` ```ts ````), or `null`. */
    readonly language: string | null;
    readonly text: string;
}
export interface MarkdownBlockquote {
    readonly type: 'blockquote';
    readonly children: readonly MarkdownBlock[];
}
export interface MarkdownListItem {
    readonly type: 'listItem';
    /** A task item's state (`- [x]`), or `null` for a plain item. */
    readonly checked: boolean | null;
    readonly children: readonly MarkdownBlock[];
}
export interface MarkdownList {
    readonly type: 'list';
    readonly ordered: boolean;
    /** The first item's number in an ordered list. */
    readonly start: number;
    /** No blank line separates the items or their blocks: paragraphs render without `<p>`. */
    readonly tight: boolean;
    readonly children: readonly MarkdownListItem[];
}
export interface MarkdownTable {
    readonly type: 'table';
    readonly align: readonly MarkdownAlign[];
    /** Heading cells, one per column. */
    readonly header: ReadonlyArray<readonly MarkdownInline[]>;
    /** Body rows of cells, as many as there are columns. */
    readonly rows: ReadonlyArray<ReadonlyArray<readonly MarkdownInline[]>>;
}
export interface MarkdownThematicBreak {
    readonly type: 'thematicBreak';
}
export type MarkdownBlock = MarkdownHeading | MarkdownParagraph | MarkdownCodeBlock | MarkdownBlockquote | MarkdownList | MarkdownTable | MarkdownThematicBreak;
export type MarkdownNode = MarkdownBlock | MarkdownListItem | MarkdownInline;
export interface MarkdownDocument {
    readonly type: 'document';
    readonly children: readonly MarkdownBlock[];
}
//# sourceMappingURL=markdown-nodes.d.ts.map