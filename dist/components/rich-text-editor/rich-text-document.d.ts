/** A value a node or mark attribute holds. */
export type RichTextAttributeValue = string | number | boolean | null;
/** A node's or a mark's attributes, by name. */
export interface RichTextAttributes {
    readonly [name: string]: RichTextAttributeValue;
}
/** A mark on a text node, such as `{ type: 'link', attrs: { href: '/a' } }`. */
export interface RichTextMark {
    type: string;
    attrs?: RichTextAttributes | undefined;
}
/** A node of the document: a block, an inline node or a run of text with its marks. */
export interface RichTextNode {
    type: string;
    attrs?: RichTextAttributes | undefined;
    content?: readonly RichTextNode[] | undefined;
    /** The characters of a `text` node. */
    text?: string | undefined;
    marks?: readonly RichTextMark[] | undefined;
}
/** A whole document: its top node, `doc`, holding the blocks. */
export interface RichTextDocument extends RichTextNode {
    type: 'doc';
}
//# sourceMappingURL=rich-text-document.d.ts.map