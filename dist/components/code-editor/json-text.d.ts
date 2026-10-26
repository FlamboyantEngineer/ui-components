import type { CodeToken } from './code-editor.js';
/** Where a JSON text stops parsing, counted from 1. */
export interface JsonErrorLocation {
    line: number;
    column: number;
}
/** A typed token and where it starts. */
export interface PlacedJsonToken {
    text: string;
    type: string;
    offset: number;
}
/** The typed tokens of JSON text (whitespace left out), with their offsets. */
export declare function placeJsonTokens(source: string): PlacedJsonToken[];
/**
 * Splits JSON text into highlighting tokens that cover it exactly: object keys, strings, numbers,
 * literals (`true`, `false`, `null`), punctuation and characters JSON does not allow.
 */
export declare function tokenizeJson(source: string): CodeToken[];
/**
 * Where the text fails to parse, read from the parser's message when it says (`line 3 column 5`
 * or `position 12`); `null` when the message gives no place.
 */
export declare function locateJsonError(source: string, message: string): JsonErrorLocation | null;
/**
 * The parse error of a JSON text, or `null` when it parses. Blank text parses as nothing. The
 * location is the first token that breaks JSON's grammar, or else the place the parser reports.
 */
export declare function findJsonError(source: string): {
    location: JsonErrorLocation | null;
} | null;
/** The text rewritten with `indent` spaces per level, or `null` when it is blank or not JSON. */
export declare function formatJson(source: string, indent: number): string | null;
//# sourceMappingURL=json-text.d.ts.map