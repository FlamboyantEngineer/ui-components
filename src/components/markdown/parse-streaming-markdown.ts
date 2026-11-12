// Parses a Markdown source that keeps growing without parsing its settled start again
// (specs/MARKDOWN.md, UIC-MARKDOWN-2.12): the blocks before the last place where a new top-level
// block must start stay as they were parsed, and only the source after it is parsed again.

import {
  type Fence,
  isFenceClose,
  readFence,
  readListMarker,
  toBlockLine,
} from './markdown-lines.js';
import type { MarkdownBlock, MarkdownDocument } from './markdown-nodes.js';
import { parseMarkdownBlocks } from './parse-markdown.js';

/** A parse of a growing source, which the next, longer source continues. */
export interface StreamingMarkdownParse {
  document: MarkdownDocument;
  /** The start of the source whose blocks are settled. */
  settled: string;
  settledBlocks: readonly MarkdownBlock[];
  settledHeadingIds: readonly string[];
}

/**
 * A line no open block can take after a blank line: it starts in the first column and cannot
 * continue a list, a block quote or indented code, open a fence or define a link.
 */
const freshStart = /^[\p{L}\p{N}#|!(]/u;

/**
 * A line that may start a link reference definition, inside block quotes and list items too.
 * Definitions can change the blocks before them, so a source with one is parsed whole; text such
 * as `x[0]:` inside a line does not match.
 */
const definitionStart = /^[ \t>]*(?:(?:[-+*]|\d{1,9}[.)])[ \t]+[ \t>]*)*\[[^\]]{0,999}\]:/m;

/** A paragraph that only the end of a source can reach; it stays out of an unclosed fence. */
const sentinel = '﷐';

/**
 * The offset of the last line that must start a new top-level block, a whole line with more after
 * it, at or after `from`: a fresh start after a blank line, outside any fence a plain reading of
 * the lines sees. `from` when there is none.
 */
function findSettledEnd(source: string, from: number): number {
  let end = from;
  let fence: Fence | null = null;
  let previousBlank = false;
  let start = from;
  while (start < source.length) {
    const lineEnd = source.indexOf('\n', start);
    if (lineEnd === -1) break;
    const line = toBlockLine(source.slice(start, lineEnd));
    if (fence) {
      if (isFenceClose(line, fence)) fence = null;
    } else {
      if (previousBlank && freshStart.test(line) && !readListMarker(line)) end = start;
      fence = readFence(line);
    }
    previousBlank = line.trim() === '';
    start = lineEnd + 1;
  }
  return end;
}

/**
 * The blocks of `source`, a run of whole lines that ends with a blank line, when they settle: no
 * block of theirs, such as a fence a list item left open, would take the lines that follow.
 */
function parseSettledBlocks(source: string, takenIds: readonly string[]) {
  const { blocks, headingIds } = parseMarkdownBlocks(`${source}${sentinel}`, takenIds);
  const last = blocks.at(-1);
  const isClosed =
    last?.type === 'paragraph' &&
    last.children.length === 1 &&
    last.children[0]?.type === 'text' &&
    last.children[0].text === sentinel;
  return isClosed ? { blocks: blocks.slice(0, -1), headingIds } : null;
}

function createParse(
  source: string,
  settled: Omit<StreamingMarkdownParse, 'document'>,
): StreamingMarkdownParse {
  const ids = settled.settledHeadingIds;
  const tail = parseMarkdownBlocks(source.slice(settled.settled.length), ids).blocks;
  const children = Object.freeze([...settled.settledBlocks, ...tail]);
  return { ...settled, document: Object.freeze({ type: 'document', children }) };
}

/**
 * Parses `source` as `parseMarkdown` does, reusing the settled blocks of `previous` when `source`
 * continues its source. Line endings are read as `\n`. A source with a line that may start a link
 * reference definition, which can change what came before, is parsed whole.
 */
export function parseStreamingMarkdown(
  rawSource: string,
  previous: StreamingMarkdownParse | null,
): StreamingMarkdownParse {
  const empty = { settled: '', settledBlocks: [], settledHeadingIds: [] };
  // A lone `\r` and `\r\n` each end one line, so a source read in pieces keeps its prefix.
  const source = rawSource.includes('\r') ? rawSource.replaceAll(/\r\n?/g, '\n') : rawSource;
  if (definitionStart.test(source)) return createParse(source, empty);
  const base = previous && source.startsWith(previous.settled) ? previous : empty;
  const end = findSettledEnd(source, base.settled.length);
  if (end === base.settled.length) return createParse(source, base);
  const added = parseSettledBlocks(source.slice(base.settled.length, end), base.settledHeadingIds);
  if (!added) return createParse(source, base);
  return createParse(source, {
    settled: source.slice(0, end),
    settledBlocks: [...base.settledBlocks, ...added.blocks],
    settledHeadingIds: [...base.settledHeadingIds, ...added.headingIds],
  });
}
