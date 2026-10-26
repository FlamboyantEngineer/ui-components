import type { MarkdownDocument } from './markdown-nodes.js';
/**
 * Parses Markdown into a frozen document tree. Raw HTML is not interpreted: it stays text. Links
 * and images with an unsafe URL keep only their text. Headings get unique slug ids.
 */
export declare function parseMarkdown(source: string): MarkdownDocument;
//# sourceMappingURL=parse-markdown.d.ts.map