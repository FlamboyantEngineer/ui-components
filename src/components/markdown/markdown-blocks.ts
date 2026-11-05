// Leaf block readers of the Markdown parser: code, headings, breaks, tables and paragraphs with
// their link reference definitions (specs/MARKDOWN.md).

import { type LinkTarget, normalizeLabel, unescapeMarkdown } from './markdown-inline-syntax.js';
import {
  decodeBlockText,
  indentOf,
  interruptsParagraph,
  isBlank,
  isFenceClose,
  isTableStart,
  isThematicBreak,
  readAtxHeading,
  readFence,
  readSetextLevel,
  readTableDivider,
  splitTableCells,
  stripColumns,
  stripIndent,
} from './markdown-lines.js';
import type { MarkdownBlock, MarkdownHeading, MarkdownInline } from './markdown-nodes.js';

/** What block readers share while a document is parsed. */
export interface BlockContext {
  /** Link reference definitions by normalized label; the first definition of a label wins. */
  definitions: Map<string, Omit<LinkTarget, 'end'>>;
  /** Inline content to parse once every definition is known, into its target array. */
  inlines: Array<{ target: MarkdownInline[]; text: string }>;
  /** Headings in document order, whose ids are given once their text is parsed. */
  headings: Array<{ id: string; readonly children: readonly MarkdownInline[] }>;
  /** Queues a container's lines and returns its blocks, filled before the parent resumes. */
  parseBlocks: (lines: readonly string[]) => MarkdownBlock[];
}

/** A block read from `lines`, or null when the lines held only definitions, and the next line. */
interface BlockResult {
  block: MarkdownBlock | null;
  next: number;
}

export type BlockReader = (
  lines: readonly string[],
  at: number,
  context: BlockContext,
) => BlockResult | null;

const definitionPattern =
  /^\[((?:[^\\[\]]|\\.){1,999})\]:[ \t]*(<[^<>\n]*>|\S+)(?:[ \t]+("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\((?:[^()\\]|\\.)*\)))?[ \t]*$/;

/** An inline array filled after the block pass, when every link definition is known. */
function deferInlines(context: BlockContext, text: string): MarkdownInline[] {
  const target: MarkdownInline[] = [];
  context.inlines.push({ target, text });
  return target;
}

function createHeading(context: BlockContext, level: number, text: string): MarkdownHeading {
  const heading = {
    type: 'heading' as const,
    level: level as MarkdownHeading['level'],
    id: '',
    children: deferInlines(context, text),
  };
  context.headings.push(heading);
  return heading;
}

export const readFencedCode: BlockReader = (lines, at) => {
  const fence = readFence(lines[at] ?? '');
  if (!fence) return null;
  const body: string[] = [];
  let index = at + 1;
  for (; index < lines.length && !isFenceClose(lines[index] ?? '', fence); index += 1) {
    body.push(decodeBlockText(stripColumns(lines[index] ?? '', fence.indent)));
  }
  const word = fence.info.split(/\s+/)[0];
  const language = word ? unescapeMarkdown(word) : null;
  return {
    block: { type: 'codeBlock', language, text: body.join('\n') },
    next: Math.min(index + 1, lines.length),
  };
};

export const readIndentedCode: BlockReader = (lines, at) => {
  if (indentOf(lines[at] ?? '') < 4) return null;
  const body: string[] = [];
  let index = at;
  for (; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    if (!isBlank(line) && indentOf(line) < 4) break;
    body.push(decodeBlockText(stripColumns(line, 4)));
  }
  while (body.length > 0 && isBlank(body.at(-1) ?? '')) body.pop();
  return { block: { type: 'codeBlock', language: null, text: body.join('\n') }, next: index };
};

export const readAtx: BlockReader = (lines, at, context) => {
  const heading = readAtxHeading(lines[at] ?? '');
  if (!heading) return null;
  return { block: createHeading(context, heading.level, heading.text), next: at + 1 };
};

export const readThematicBreak: BlockReader = (lines, at) =>
  isThematicBreak(lines[at] ?? '') ? { block: { type: 'thematicBreak' }, next: at + 1 } : null;

export const readTable: BlockReader = (lines, at, context) => {
  const head = lines[at] ?? '';
  const align = isTableStart(head, lines[at + 1]) ? readTableDivider(lines[at + 1] ?? '') : null;
  if (!align) return null;
  const toCells = (line: string) => {
    const cells = splitTableCells(line);
    return align.map((_, column) => deferInlines(context, cells[column] ?? ''));
  };
  const header = toCells(head);
  const rows: MarkdownInline[][][] = [];
  let index = at + 2;
  for (; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    if (isBlank(line) || interruptsParagraph(line, lines[index + 1])) break;
    rows.push(toCells(line));
  }
  return { block: { type: 'table', align, header, rows }, next: index };
};

/** Records the definitions at the start of a paragraph and returns the lines left after them. */
function takeDefinitions(lines: string[], context: BlockContext): string[] {
  let count = 0;
  for (const line of lines) {
    const match = definitionPattern.exec(line);
    const label = match?.[1];
    if (!match || !label?.trim()) break;
    const key = normalizeLabel(label);
    const destination = (match[2] ?? '').replace(/^<(.*)>$/, '$1');
    const title = match[3] ? unescapeMarkdown(match[3].slice(1, -1)) : null;
    if (!context.definitions.has(key)) {
      context.definitions.set(key, { href: unescapeMarkdown(destination), title });
    }
    count += 1;
  }
  return lines.slice(count);
}

/** Collects paragraph lines from `at` until a blank line, another block or a setext underline. */
function collectParagraph(lines: readonly string[], at: number) {
  const collected: string[] = [];
  let index = at;
  for (; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    if (isBlank(line)) break;
    if (collected.length > 0) {
      const level = readSetextLevel(line);
      if (level) return { collected, index, level };
      if (interruptsParagraph(line, lines[index + 1])) break;
    }
    collected.push(decodeBlockText(stripIndent(line)));
  }
  return { collected, index, level: null };
}

export const readParagraph: BlockReader = (lines, at, context) => {
  const { collected, index, level } = collectParagraph(lines, at);
  const rest = takeDefinitions(collected, context);
  const text = rest.join('\n').trimEnd();
  if (!text) return { block: null, next: index };
  if (level) return { block: createHeading(context, level, text), next: index + 1 };
  return { block: { type: 'paragraph', children: deferInlines(context, text) }, next: index };
};
