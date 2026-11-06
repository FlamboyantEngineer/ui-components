// Mention and command tokens in a text part: listed, split out of plain text, and carried through
// Markdown as markers that text nodes turn back into pills (specs/CHAT-PARTS.md, UIC-CHAT-PARTS-2.4).

import { requireDefined } from '../../utils/require-defined.js';
import { walkTree } from '../../utils/walk-tree.js';
import type { MarkdownNode } from '../markdown/markdown.js';
import type { MarkdownBlock } from '../markdown/markdown-nodes.js';
import {
  parseStreamingMarkdown,
  type StreamingMarkdownParse,
} from '../markdown/parse-streaming-markdown.js';
import type { ChatTextToken } from './chat-part.js';

/** A run of text, or a token by its position among the listed tokens. */
type TokenPiece = string | number;

// A marker is an interlinear annotation anchor, a key, a separator, the token's position and a
// terminator, which Markdown reads as ordinary text. Text may hold anchors too, so the key is one
// that follows no anchor in the text, as written or as Markdown reads it (entities decode): text
// cannot spell a marker's opening, and an anchor beside one cannot join it, since the opening holds
// only the one anchor. The key is the smallest number free, so it stays short however many anchors,
// and so however many tokens, the text holds.
const anchor = '\uFFF9';
const separator = '\uFFFA';
const markerEnd = '\uFFFB';

/** The opening of each marker of a source, as `writeTokenSource` chose it. */
export type TokenMarker = string;

/** A Markdown source with its tokens replaced by markers, and the opening they share. */
interface TokenSource {
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

/** What a block of Markdown shows: its text, and what it shows as written. */
interface ShownText {
  text: readonly string[];
  literal: readonly string[];
}

/** What each parsed block shows, kept while a streaming parse keeps the block itself. */
const shownByBlock = new WeakMap<MarkdownBlock, ShownText>();

function readBlockShownText(block: MarkdownBlock): ShownText {
  const known = shownByBlock.get(block);
  if (known) return known;
  const nodes = [...walkTree<MarkdownNode>([block], listNodeChildren)];
  const shown = {
    text: nodes.flatMap((node) => (node.type === 'text' ? [node.text] : [])),
    literal: nodes.flatMap(readLiteralText),
  };
  shownByBlock.set(block, shown);
  return shown;
}

/** What Markdown shows of a parsed source, block by block. */
function readShownText(parse: StreamingMarkdownParse): ShownText {
  const blocks = parse.document.children.map(readBlockShownText);
  return {
    text: blocks.flatMap((block) => block.text),
    literal: blocks.flatMap((block) => block.literal),
  };
}

/** A marker opening that none of the strings holds: an anchor, the smallest free key, a separator. */
function chooseMarker(values: readonly string[]): TokenMarker {
  const taken = new Set<string>();
  for (const value of values) {
    for (const [, key] of value.matchAll(/\uFFF9(\d+)\uFFFA/g)) taken.add(requireDefined(key));
  }
  let key = 0;
  while (taken.has(String(key))) key += 1;
  return `${anchor}${key}${separator}`;
}

/** The parses a token source was read from, which the source of a longer text continues. */
export interface TokenSourceParses {
  text: StreamingMarkdownParse;
  marked: StreamingMarkdownParse;
}

/**
 * The Markdown source of a text with tokens: a marker in place of each token that Markdown reads as
 * text, and the token's own text where Markdown shows the source as written (in code, a link's
 * target or an image), since a pill cannot show there. Its markers open with a key no anchor in the
 * text is followed by, so literal text never reads as a token, and each marker stays a few
 * characters long, so the source grows linearly with the tokens. Given the `parses` of an earlier
 * source, a text that continues it parses only its unsettled end again (UIC-MARKDOWN-2.12), so a
 * streamed text with tokens does not parse its whole source for every chunk.
 */
export function writeTokenSource(
  text: string,
  tokens: readonly ChatTextToken[],
  previous?: TokenSourceParses | null,
): TokenSource & { parses: TokenSourceParses | null } {
  if (tokens.length === 0) return { source: text, marker: chooseMarker([]), parses: null };
  const textParse = parseStreamingMarkdown(text, previous?.text ?? null);
  const shown = readShownText(textParse);
  const marker = chooseMarker([text, ...shown.text, ...shown.literal]);
  const marked = writeTokenMarkers(text, tokens, { literal: noTokens, marker });
  const markedParse = parseStreamingMarkdown(marked, previous?.marked ?? null);
  const literal = new Set(
    readShownText(markedParse)
      .literal.flatMap((value) => splitTokenMarkers(value, tokens.length, marker))
      .filter((piece) => typeof piece === 'number'),
  );
  const source = literal.size === 0 ? marked : writeTokenMarkers(text, tokens, { literal, marker });
  return { source, marker, parses: { text: textParse, marked: markedParse } };
}
