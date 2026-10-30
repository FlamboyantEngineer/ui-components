'use client';

// A Markdown node override that turns `[n]` markers in text into citations (specs/CHAT-SOURCES.md,
// UIC-MARKDOWN-2.8).

import type { ReactNode } from 'react';
import { requireDefined } from '../../utils/require-defined.js';
import type { MarkdownNode } from '../markdown/markdown.js';
import { TextMatch } from '../text-match/text-match.js';
import { ChatCitation } from './chat-citation.js';
import type { ChatSource } from './chat-source-summary.js';

/** A run of text, or the numbers of one marker (`[2]`, `[1, 3]`). */
type CitationPiece = string | readonly number[];

const marker = /\[(\d{1,4}(?:[ \t]*,[ \t]*\d{1,4})*)\]/g;

/**
 * Splits text at its citation markers: `[n]`, or `[n, m]` for several, whose every number is a
 * source between 1 and `count`. Other bracketed numbers stay text.
 */
export function splitCitationMarkers(text: string, count: number): CitationPiece[] {
  const pieces: CitationPiece[] = [];
  let from = 0;
  for (const match of text.matchAll(marker)) {
    const numbers = (match[1] ?? '').split(',').map(Number);
    if (!numbers.every((number) => number >= 1 && number <= count)) continue;
    if (match.index > from) pieces.push(text.slice(from, match.index));
    pieces.push(numbers);
    from = match.index + match[0].length;
  }
  if (from < text.length) pieces.push(text.slice(from));
  return pieces;
}

/**
 * Creates a `renderNode` for `Markdown` that draws the `[n]` markers in text as `ChatCitation`s of
 * `sources` (the first source is `[1]`). Markers of unknown numbers, and markers in code, stay text.
 * Create it once per sources array (for example with `useMemo`), so a streaming `Markdown` keeps
 * its finished blocks.
 */
export function createCitationOverride(sources: readonly ChatSource[]) {
  return (node: MarkdownNode): ReactNode => {
    if (node.type !== 'text') return undefined;
    const pieces = splitCitationMarkers(node.text, sources.length);
    if (pieces.every((piece) => typeof piece === 'string')) return undefined;
    return pieces.flatMap((piece, at) =>
      typeof piece === 'string'
        ? [<TextMatch key={at}>{piece}</TextMatch>]
        : piece.map((index) => (
            <ChatCitation
              key={`${at}-${index}`}
              source={requireDefined(sources[index - 1])}
              index={index}
            />
          )),
    );
  };
}
