import type { CodeTokenizer } from './code-layers.js';
export type CodeLanguage = 'text' | 'json' | 'javascript' | 'typescript' | 'html' | 'css' | 'sql' | 'python' | 'markdown';
export interface CodeSyntaxRule {
    /** Styling token kind, such as keyword, string, number or comment. */
    type: string;
    /** Matched at the current offset; flags are preserved except g and y. Empty matches are ignored. */
    pattern: RegExp;
}
export type CodeSyntax = readonly CodeSyntaxRule[];
/** Ordered syntax rules preserve every source character, including unmatched text. */
export declare function createCodeTokenizer(syntax: CodeSyntax): CodeTokenizer;
export declare function resolveCodeTokenizer({ language, syntax, }: {
    language?: CodeLanguage | undefined;
    syntax?: CodeSyntax | undefined;
}): CodeTokenizer | undefined;
//# sourceMappingURL=code-languages.d.ts.map