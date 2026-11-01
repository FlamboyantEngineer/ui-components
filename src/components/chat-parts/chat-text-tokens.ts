// Mention and command tokens in a text part: listed, split out of plain text, and carried through
// Markdown as markers that text nodes turn back into pills (specs/CHAT-PARTS.md, UIC-CHAT-PARTS-2.4).

import { requireDefined } from '../../utils/require-defined.js';
import { walkTree } from '../../utils/walk-tree.js';
import { parseMarkdown } from '../markdown/parse-markdown.js';
import type { MarkdownNode } from '../markdown/markdown.js';
import type { ChatTextToken } from './chat-part.js';

/** A run of text, or a token by its position among the listed tokens. */
type TokenPiece = string | number;

// Unicode keeps the interlinear annotation anchor and terminator for use inside an application:
// Markdown reads them as ordinary text, and neither typed nor generated text contains them.
const markerStart = '\uFFF9';
const markerEnd = '\uFFFB';
const markerPattern = /\uFFF9(\d+)\uFFFB/g;

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
export function splitTokenMarkers(text: string, count: number): TokenPiece[] {
  const pieces: TokenPiece[] = [];
  let from = 0;
  for (const match of text.matchAll(markerPattern)) {
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
  literal: ReadonlySet<number>,
): string {
  return splitTextTokens(text, tokens)
    .map((piece) => {
      if (typeof piece === 'string') return piece;
      const { start, end } = requireDefined(tokens[piece]);
      return literal.has(piece) ? text.slice(start, end) : `${markerStart}${piece}${markerEnd}`;
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

/**
 * The Markdown source of a text with tokens: a marker in place of each token that Markdown reads as
 * text, and the token's own text where Markdown shows the source as written (in code, a link's
 * target or an image), since a pill cannot show there.
 */
export function writeTokenSource(text: string, tokens: readonly ChatTextToken[]): string {
  if (tokens.length === 0) return text;
  const marked = writeTokenMarkers(text, tokens, noTokens);
  const nodes = walkTree<MarkdownNode>(parseMarkdown(marked).children, listNodeChildren);
  const literal = new Set(
    [...nodes]
      .flatMap(readLiteralText)
      .flatMap((value) => splitTokenMarkers(value, tokens.length))
      .filter((piece) => typeof piece === 'number'),
  );
  return literal.size === 0 ? marked : writeTokenMarkers(text, tokens, literal);
}
