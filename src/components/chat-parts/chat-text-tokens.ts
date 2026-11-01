// Mention and command tokens in a text part: listed, split out of plain text, and carried through
// Markdown as markers that text nodes turn back into pills (specs/CHAT-PARTS.md, UIC-CHAT-PARTS-2.4).

import { requireDefined } from '../../utils/require-defined.js';
import { walkTree } from '../../utils/walk-tree.js';
import { parseMarkdown } from '../markdown/parse-markdown.js';
import type { MarkdownNode } from '../markdown/markdown.js';
import type { ChatTextToken } from './chat-part.js';

/** A run of text, or a token by its position among the listed tokens. */
type TokenPiece = string | number;

// A marker is a run of interlinear annotation anchors, the token's position and a terminator, which
// Markdown reads as ordinary text. Text may hold anchors too, so the run is longer than any run of
// anchors in the text, as written or as Markdown reads it (entities decode): text cannot spell a
// marker, and an anchor beside one only lengthens its run.
const anchor = '\uFFF9';
const markerEnd = '\uFFFB';

/** The run of anchors that opens each marker of a source, as `writeTokenSource` chose it. */
export type TokenMarker = string;

/** A Markdown source with its tokens replaced by markers, and the run that opens them. */
export interface TokenSource {
  source: string;
  marker: TokenMarker;
}

const noTokens: ReadonlySet<number> = new Set();

function isWithin(token: ChatTextToken, length: number): boolean {
  const { start, end } = token;
  return (
    Number.isInteger(start) && Number.isInteger(end) && start >= 0 && start < end && end <= length
  );
}

/** The tokens that lie within `text`, in order of their start, without any that overlap another. */
export function listTextTokens(
  text: string,
  tokens: readonly ChatTextToken[] | undefined,
): ChatTextToken[] {
  const sorted = (tokens ?? [])
    .filter((token) => isWithin(token, text.length))
    .sort((a, b) => a.start - b.start);
  const listed: ChatTextToken[] = [];
  for (const token of sorted) {
    const previous = listed.at(-1);
    if (!previous || token.start >= previous.end) listed.push(token);
  }
  return listed;
}

/** Splits `text` at the listed tokens, each token by its position in `tokens`. */
export function splitTextTokens(text: string, tokens: readonly ChatTextToken[]): TokenPiece[] {
  const pieces: TokenPiece[] = [];
  let from = 0;
  tokens.forEach((token, index) => {
    if (token.start > from) pieces.push(text.slice(from, token.start));
    pieces.push(index);
    from = token.end;
  });
  if (from < text.length) pieces.push(text.slice(from));
  return pieces;
}

/** Splits rendered text at its token markers. A marker of a token beyond `count` stays text. */
export function splitTokenMarkers(text: string, count: number, marker: TokenMarker): TokenPiece[] {
  const pieces: TokenPiece[] = [];
  let from = 0;
  for (const match of text.matchAll(new RegExp(`${marker}(\\d+)${markerEnd}`, 'g'))) {
    const index = Number(match[1]);
    if (index >= count) continue;
    if (match.index > from) pieces.push(text.slice(from, match.index));
    pieces.push(index);
    from = match.index + match[0].length;
  }
  if (from < text.length) pieces.push(text.slice(from));
  return pieces;
}

/** `text` with a marker in place of each token, except the `literal` ones, which keep their text. */
function writeTokenMarkers(
  text: string,
  tokens: readonly ChatTextToken[],
  { literal, marker }: { literal: ReadonlySet<number>; marker: TokenMarker },
): string {
  return splitTextTokens(text, tokens)
    .map((piece) => {
      if (typeof piece === 'string') return piece;
      const { start, end } = requireDefined(tokens[piece]);
      return literal.has(piece) ? text.slice(start, end) : `${marker}${piece}${markerEnd}`;
    })
    .join('');
}

/** What Markdown shows as written rather than as text: code, link targets and image attributes. */
function readLiteralText(node: MarkdownNode): string[] {
  switch (node.type) {
    case 'inlineCode':
    case 'codeBlock':
      return [node.text];
    case 'link':
      return [node.href, node.title ?? ''];
    case 'image':
      return [node.src, node.alt, node.title ?? ''];
    default:
      return [];
  }
}

function listNodeChildren(node: MarkdownNode): readonly MarkdownNode[] | undefined {
  if ('children' in node) return node.children;
  return node.type === 'table' ? [...node.header.flat(), ...node.rows.flat(2)] : undefined;
}

/** What Markdown shows of `source`: its text, and what it shows as written. */
function readShownText(source: string) {
  const nodes = [...walkTree<MarkdownNode>(parseMarkdown(source).children, listNodeChildren)];
  return {
    text: nodes.flatMap((node) => (node.type === 'text' ? [node.text] : [])),
    literal: nodes.flatMap(readLiteralText),
  };
}

/** The longest run of anchors in any of the strings. */
function longestAnchorRun(values: readonly string[]): number {
  let longest = 0;
  for (const value of values) {
    for (const run of value.match(/\uFFF9+/g) ?? []) longest = Math.max(longest, run.length);
  }
  return longest;
}

/**
 * The Markdown source of a text with tokens: a marker in place of each token that Markdown reads as
 * text, and the token's own text where Markdown shows the source as written (in code, a link's
 * target or an image), since a pill cannot show there. Its marker run is longer than any run of
 * anchors in the text, so literal text never reads as a token.
 */
export function writeTokenSource(text: string, tokens: readonly ChatTextToken[]): TokenSource {
  if (tokens.length === 0) return { source: text, marker: anchor };
  const shown = readShownText(text);
  const marker = anchor.repeat(longestAnchorRun([text, ...shown.text, ...shown.literal]) + 1);
  const marked = writeTokenMarkers(text, tokens, { literal: noTokens, marker });
  const literal = new Set(
    readShownText(marked)
      .literal.flatMap((value) => splitTokenMarkers(value, tokens.length, marker))
      .filter((piece) => typeof piece === 'number'),
  );
  const source = literal.size === 0 ? marked : writeTokenMarkers(text, tokens, { literal, marker });
  return { source, marker };
}
