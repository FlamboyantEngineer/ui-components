export interface RawElement {
    tag: string;
    attributes: Readonly<Record<string, string>>;
    children: RawNode[];
}
export type RawNode = RawElement | string;
/**
 * Reads an HTML fragment into a tree of lower-case elements and text. Blocked elements are skipped
 * with their content (nested ones of the same name included), void elements take no children, and
 * an element closes the open elements an HTML parser would close (a paragraph before a block, a
 * list item before the next one, table parts before their siblings); a stray closing tag is ignored.
 */
export declare function buildHtmlTree(markup: string): RawNode[];
//# sourceMappingURL=html-tree.d.ts.map