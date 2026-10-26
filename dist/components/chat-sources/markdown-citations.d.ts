import type { ReactNode } from 'react';
import type { MarkdownNode } from '../markdown/markdown.js';
import type { ChatSource } from './chat-source-summary.js';
/** A run of text, or the numbers of one marker (`[2]`, `[1, 3]`). */
type CitationPiece = string | readonly number[];
/**
 * Splits text at its citation markers: `[n]`, or `[n, m]` for several, whose every number is a
 * source between 1 and `count`. Other bracketed numbers stay text.
 */
export declare function splitCitationMarkers(text: string, count: number): CitationPiece[];
/**
 * Creates a `renderNode` for `Markdown` that draws the `[n]` markers in text as `ChatCitation`s of
 * `sources` (the first source is `[1]`). Markers of unknown numbers, and markers in code, stay text.
 * Create it once per sources array (for example with `useMemo`), so a streaming `Markdown` keeps
 * its finished blocks.
 */
export declare function createCitationOverride(sources: readonly ChatSource[]): (node: MarkdownNode) => ReactNode;
export {};
//# sourceMappingURL=markdown-citations.d.ts.map