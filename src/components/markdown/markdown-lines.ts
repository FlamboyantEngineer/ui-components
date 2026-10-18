// Line classifiers for the Markdown block parser (specs/MARKDOWN.md).

import type { MarkdownAlign } from './markdown-nodes.js';

export interface ListMarker {
  ordered: boolean;
  /** The bullet (`-`, `+`, `*`) or the ordered delimiter (`.`, `)`). */
  symbol: string;
  start: number;
  /** Columns from the line start to the item's content. */
  contentIndent: number;
  /** The item's first line has no content. */
  isEmpty: boolean;
}

export interface Fence {
  indent: number;
  marker: string;
  info: string;
}

const fenceOpen = /^( {0,3})(`{3,}|~{3,})(.*)$/;
const atxHeading = /^ {0,3}(#{1,6})(?=[ \t]|$)(.*)$/;
const thematicBreak = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/;
const setextUnderline = /^ {0,3}(=+|-+)[ \t]*$/;
const blockquoteMarker = /^ {0,3}> ?/;
const listMarker = /^( {0,3})(?:([-+*])|(\d{1,9})([.)]))(?=[ \t]|$)/;
const dividerCell = /^:?-+:?$/;

export function isBlank(line: string): boolean {
  return line.trim() === '';
}

export function indentOf(line: string): number {
  return line.length - line.trimStart().length;
}

/** Expands the tabs of a line's leading whitespace to the next multiple of four columns. */
export function expandLeadingTabs(line: string): string {
  const whitespace = /^[ \t]*/.exec(line)?.[0] ?? '';
  if (!whitespace.includes('\t')) return line;
  let columns = 0;
  for (const char of whitespace)
    columns = char === '\t' ? columns + 4 - (columns % 4) : columns + 1;
  return ' '.repeat(columns) + line.slice(whitespace.length);
}

export function readFence(line: string): Fence | null {
  const match = fenceOpen.exec(line);
  if (!match) return null;
  const [, indent = '', marker = '', info = ''] = match;
  if (marker.startsWith('`') && info.includes('`')) return null;
  return { indent: indent.length, marker, info: info.trim() };
}

export function isFenceClose(line: string, fence: Fence): boolean {
  const match = /^ {0,3}(`{3,}|~{3,})[ \t]*$/.exec(line);
  const marker = match?.[1] ?? '';
  return marker.startsWith(fence.marker.charAt(0)) && marker.length >= fence.marker.length;
}

/** A heading line's level and text, without the optional closing `#` sequence. */
export function readAtxHeading(line: string): { level: number; text: string } | null {
  const match = atxHeading.exec(line);
  if (!match) return null;
  const text = (match[2] ?? '').trim().replace(/(?:^|[ \t]+)#+[ \t]*$/, '');
  return { level: (match[1] ?? '').length, text: text.trim() };
}

export function isThematicBreak(line: string): boolean {
  return thematicBreak.test(line);
}

/** The level a setext underline gives the paragraph above it: 1 for `===`, 2 for `---`. */
export function readSetextLevel(line: string): 1 | 2 | null {
  const match = setextUnderline.exec(line);
  if (!match) return null;
  return match[1]?.startsWith('=') ? 1 : 2;
}

/** The line without its block quote marker, or null when it has none. */
export function stripBlockquoteMarker(line: string): string | null {
  const match = blockquoteMarker.exec(line);
  return match ? line.slice(match[0].length) : null;
}

export function readListMarker(line: string): ListMarker | null {
  if (isThematicBreak(line)) return null;
  const match = listMarker.exec(line);
  if (!match) return null;
  const [marker, , bullet, digits, delimiter = ''] = match;
  const rest = line.slice(marker.length);
  const spaces = indentOf(rest);
  const isEmpty = isBlank(rest);
  // Five or more spaces start indented code inside the item, which then begins after one space.
  const gap = isEmpty || spaces > 4 ? 1 : spaces;
  return {
    ordered: bullet === undefined,
    symbol: bullet ?? delimiter,
    start: digits === undefined ? 1 : Number(digits),
    contentIndent: marker.length + gap,
    isEmpty,
  };
}

/** Splits a table row into trimmed cells on unescaped pipes; `\|` becomes a literal pipe. */
export function splitTableCells(line: string): string[] {
  let row = line.trim();
  if (row.startsWith('|')) row = row.slice(1);
  if (row.endsWith('|') && !row.endsWith('\\|')) row = row.slice(0, -1);
  return row.split(/(?<!\\)\|/).map((cell) => cell.trim().replaceAll('\\|', '|'));
}

/** The column alignments of a table divider row, or null when the line is not one. */
export function readTableDivider(line: string): MarkdownAlign[] | null {
  if (!line.includes('-') || indentOf(line) > 3) return null;
  const cells = splitTableCells(line);
  if (!cells.every((cell) => dividerCell.test(cell))) return null;
  if (cells.length === 1 && !line.includes('|')) return null;
  return cells.map((cell) => {
    if (cell.startsWith(':') && cell.endsWith(':')) return 'center';
    if (cell.endsWith(':')) return 'end';
    return cell.startsWith(':') ? 'start' : null;
  });
}

/** Whether a line and the next start a table: a row with pipes over a matching divider. */
export function isTableStart(line: string, next: string | undefined): boolean {
  if (next === undefined || !line.includes('|') || indentOf(line) > 3) return false;
  const align = readTableDivider(next);
  return align !== null && align.length === splitTableCells(line).length;
}

/** Whether a line ends a paragraph by starting another block. */
export function interruptsParagraph(line: string, next: string | undefined): boolean {
  if (readFence(line) || readAtxHeading(line) || isThematicBreak(line)) return true;
  if (stripBlockquoteMarker(line) !== null || isTableStart(line, next)) return true;
  const marker = readListMarker(line);
  return marker !== null && !marker.isEmpty && (!marker.ordered || marker.start === 1);
}
