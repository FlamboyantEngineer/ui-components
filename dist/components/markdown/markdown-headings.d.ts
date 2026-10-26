import type { OutlineHeading } from '../outline/outline.js';
import type { MarkdownDocument, MarkdownInline } from './markdown-nodes.js';
/** The text inline nodes read as: link and emphasis text, code, image alt text. */
export declare function toPlainText(nodes: readonly MarkdownInline[]): string;
/** Hands out heading slugs, suffixing repeats `-2`, `-3`, … so they stay unique in a document. */
export declare function createHeadingIdAllocator(): (text: string) => string;
/**
 * The document's headings in order, as `Outline` takes them, with ids carrying the same
 * `headingIdPrefix` the `Markdown` that renders the document uses.
 */
export declare function listMarkdownHeadings(document: MarkdownDocument, headingIdPrefix?: string): OutlineHeading[];
//# sourceMappingURL=markdown-headings.d.ts.map