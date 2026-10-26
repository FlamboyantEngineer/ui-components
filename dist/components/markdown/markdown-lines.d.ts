import type { MarkdownAlign } from './markdown-nodes.js';
export interface ListMarker {
    ordered: boolean;
    /** The bullet (`-`, `+`, `*`) or the ordered delimiter (`.`, `)`). */
    symbol: string;
    start: number;
    /** Columns from the line start to the item's content. */
    contentIndent: number;
    /** The item's first line has no content. */
    isEmpty: boolean;
}
export interface Fence {
    indent: number;
    marker: string;
    info: string;
}
export declare function isBlank(line: string): boolean;
export declare function indentOf(line: string): number;
/** Expands the tabs of a line's leading whitespace to the next multiple of four columns. */
export declare function expandLeadingTabs(line: string): string;
export declare function readFence(line: string): Fence | null;
export declare function isFenceClose(line: string, fence: Fence): boolean;
/** A heading line's level and text, without the optional closing `#` sequence. */
export declare function readAtxHeading(line: string): {
    level: number;
    text: string;
} | null;
export declare function isThematicBreak(line: string): boolean;
/** The level a setext underline gives the paragraph above it: 1 for `===`, 2 for `---`. */
export declare function readSetextLevel(line: string): 1 | 2 | null;
/** The line without its block quote marker, or null when it has none. */
export declare function stripBlockquoteMarker(line: string): string | null;
export declare function readListMarker(line: string): ListMarker | null;
/** Splits a table row into trimmed cells on unescaped pipes; `\|` becomes a literal pipe. */
export declare function splitTableCells(line: string): string[];
/** The column alignments of a table divider row, or null when the line is not one. */
export declare function readTableDivider(line: string): MarkdownAlign[] | null;
/** Whether a line and the next start a table: a row with pipes over a matching divider. */
export declare function isTableStart(line: string, next: string | undefined): boolean;
/** Whether a line ends a paragraph by starting another block. */
export declare function interruptsParagraph(line: string, next: string | undefined): boolean;
//# sourceMappingURL=markdown-lines.d.ts.map