import { type LinkTarget } from './markdown-inline-syntax.js';
import type { MarkdownInline } from './markdown-nodes.js';
/** Link reference definitions by normalized label. */
type MarkdownDefinitions = ReadonlyMap<string, Omit<LinkTarget, 'end'>>;
/** Parses the inline content of a paragraph, heading or table cell. */
export declare function parseMarkdownInlines(text: string, definitions: MarkdownDefinitions): MarkdownInline[];
export {};
//# sourceMappingURL=markdown-inlines.d.ts.map