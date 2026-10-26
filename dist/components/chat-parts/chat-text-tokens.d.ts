import type { ChatTextToken } from './chat-part.js';
/** A run of text, or a token by its position among the listed tokens. */
export type TokenPiece = string | number;
/** The tokens that lie within `text`, in order of their start, without any that overlap another. */
export declare function listTextTokens(text: string, tokens: readonly ChatTextToken[] | undefined): ChatTextToken[];
/** Splits `text` at the listed tokens, each token by its position in `tokens`. */
export declare function splitTextTokens(text: string, tokens: readonly ChatTextToken[]): TokenPiece[];
/** Splits rendered text at its token markers. A marker of a token beyond `count` stays text. */
export declare function splitTokenMarkers(text: string, count: number): TokenPiece[];
/**
 * The Markdown source of a text with tokens: a marker in place of each token that Markdown reads as
 * text, and the token's own text where Markdown shows the source as written (in code, a link's
 * target or an image), since a pill cannot show there.
 */
export declare function writeTokenSource(text: string, tokens: readonly ChatTextToken[]): string;
//# sourceMappingURL=chat-text-tokens.d.ts.map