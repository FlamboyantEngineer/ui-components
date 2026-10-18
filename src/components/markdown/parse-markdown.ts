// A dependency-free Markdown parser: CommonMark's blocks and inlines plus tables, task lists and
// strikethrough, read into a plain, frozen tree (specs/MARKDOWN.md). It never touches the DOM.

import {
  readAtx,
  readFencedCode,
  readIndentedCode,
  readParagraph,
  readTable,
  readThematicBreak,
  type BlockContext,
  type BlockReader,
} from './markdown-blocks.js';
import { readBlockquote, readList } from './markdown-containers.js';
import { createHeadingIdAllocator, toPlainText } from './markdown-headings.js';
import { parseMarkdownInlines } from './markdown-inlines.js';
import { expandLeadingTabs, isBlank } from './markdown-lines.js';
import type { MarkdownBlock, MarkdownDocument } from './markdown-nodes.js';

/** Block readers in the order they are tried; the paragraph reader takes any other line. */
const blockReaders: readonly BlockReader[] = [
  readFencedCode,
  readAtx,
  readThematicBreak,
  readBlockquote,
  readList,
  readIndentedCode,
  readTable,
  readParagraph,
];

function parseBlocks(lines: readonly string[], context: BlockContext): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  let index = 0;
  while (index < lines.length) {
    if (isBlank(lines[index] ?? '')) {
      index += 1;
      continue;
    }
    for (const read of blockReaders) {
      const result = read(lines, index, context);
      if (!result) continue;
      if (result.block) blocks.push(result.block);
      index = result.next;
      break;
    }
  }
  return blocks;
}

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

/**
 * Parses Markdown into a frozen document tree. Raw HTML is not interpreted: it stays text. Links
 * and images with an unsafe URL keep only their text. Headings get unique slug ids.
 */
export function parseMarkdown(source: string): MarkdownDocument {
  const lines = source
    .replaceAll('\u0000', '\ufffd')
    .split(/\r\n?|\n/)
    .map(expandLeadingTabs);
  const context: BlockContext = {
    definitions: new Map(),
    inlines: [],
    headings: [],
    parseBlocks: (inner) => parseBlocks(inner, context),
  };
  const children = parseBlocks(lines, context);
  for (const { target, text } of context.inlines) {
    target.push(...parseMarkdownInlines(text, context.definitions));
  }
  const allocateId = createHeadingIdAllocator();
  for (const heading of context.headings) heading.id = allocateId(toPlainText(heading.children));
  return deepFreeze({ type: 'document', children });
}
