import type { LinkTarget } from './markdown-inline-syntax.js';
import type { MarkdownBlock, MarkdownInline } from './markdown-nodes.js';
/** What block readers share while a document is parsed. */
export interface BlockContext {
    /** Link reference definitions by normalized label; the first definition of a label wins. */
    definitions: Map<string, Omit<LinkTarget, 'end'>>;
    /** Inline content to parse once every definition is known, into its target array. */
    inlines: Array<{
        target: MarkdownInline[];
        text: string;
    }>;
    /** Headings in document order, whose ids are given once their text is parsed. */
    headings: Array<{
        id: string;
        readonly children: readonly MarkdownInline[];
    }>;
    /** Queues a container's lines and returns its blocks, filled before the parent resumes. */
    parseBlocks: (lines: readonly string[]) => MarkdownBlock[];
}
/** A block read from `lines`, or null when the lines held only definitions, and the next line. */
interface BlockResult {
    block: MarkdownBlock | null;
    next: number;
}
export type BlockReader = (lines: readonly string[], at: number, context: BlockContext) => BlockResult | null;
/** An inline array filled after the block pass, when every link definition is known. */
export declare function deferInlines(context: BlockContext, text: string): MarkdownInline[];
export declare const readFencedCode: BlockReader;
export declare const readIndentedCode: BlockReader;
export declare const readAtx: BlockReader;
export declare const readThematicBreak: BlockReader;
export declare const readTable: BlockReader;
export declare const readParagraph: BlockReader;
export {};
//# sourceMappingURL=markdown-blocks.d.ts.map