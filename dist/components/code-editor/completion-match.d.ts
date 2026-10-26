import type { CodeRange } from './code-ranges.js';
/** A snippet's text with its fields' defaults, and where each field sits in it. */
export interface ParsedSnippet {
    text: string;
    fields: CodeRange[];
}
/** The identifier-like word that ends at `caret`, or `''`. */
export declare function findCompletionQuery(value: string, caret: number): string;
/** Reads `${…}` fields; backslashes quote a dollar, closing brace or backslash. */
export declare function parseSnippet(snippet: string): ParsedSnippet;
/** Indents every line of a multiline insertion after the first like the line it goes into. */
export declare function indentInsertion(snippet: ParsedSnippet, indentation: string): ParsedSnippet;
//# sourceMappingURL=completion-match.d.ts.map