// Line classifiers for the Markdown block parser (specs/MARKDOWN.md).

import type { MarkdownAlign } from './markdown-nodes.js';

export interface ListMarker {
  ordered: boolean;
  /** The bullet (`-`, `+`, `*`) or the ordered delimiter (`.`, `)`). */
  symbol: string;
  start: number;
  /** Columns from the line start to the item's content. */
  contentIndent: number;
  /** The item's first line without its marker and the whitespace up to its content. */
  content: string;
  /** The item's first line has no content. */
  isEmpty: boolean;
}

export interface Fence {
  indent: number;
  marker: string;
  info: string;
}

// Block lines hold each tab as a tab character followed by a NUL for every further column it
// covers, so one character is one column at any container depth (see toBlockLine). Whitespace
// patterns therefore read `[ \t\0]`.
const fenceOpen = /^([ \t\0]{0,3})(`{3,}|~{3,})(.*)$/;
const fenceClose = /^[ \t\0]{0,3}(`{3,}|~{3,})[ \t\0]*$/;
const atxHeading = /^[ \t\0]{0,3}(#{1,6})(?=[ \t]|$)(.*)$/;
const thematicBreak = /^[ \t\0]{0,3}([-*_])(?:[ \t\0]*\1){2,}[ \t\0]*$/;
const setextUnderline = /^[ \t\0]{0,3}(=+|-+)[ \t\0]*$/;
const blockquoteMarker = /^[ \t\0]{0,3}>/;
const listMarker = /^([ \t\0]{0,3})(?:([-+*])|(\d{1,9})([.)]))(?=[ \t]|$)/;
const dividerCell = /^:?-+:?$/;

/**
 * A source line as the block parser reads it: NUL becomes U+FFFD, and each tab is followed by a
 * NUL for every further column it covers up to the next multiple of four, counted from the line
 * start. Columns stay true inside containers, and decodeBlockText gives the tabs back.
 */
export function toBlockLine(line: string): string {
  const safe = line.replaceAll('\u0000', '\ufffd');
  if (!safe.includes('\t')) return safe;
  let encoded = '';
  for (const char of safe) {
    encoded += char === '\t' ? '\t' + '\u0000'.repeat(3 - (encoded.length % 4)) : char;
  }
  return encoded;
}

/**
 * Block text as written: an encoded tab becomes one tab again, and the columns left of a tab that
 * stripping took only in part become spaces.
 */
export function decodeBlockText(text: string): string {
  if (!text.includes('\u0000')) return text;
  return text.replace(/\t\0+/g, '\t').replaceAll('\u0000', ' ');
}

export function isBlank(line: string): boolean {
  return /^[\s\0]*$/.test(line);
}

/** The columns of a line's leading whitespace. */
export function indentOf(line: string): number {
  return /^[ \t\0]*/.exec(line)?.[0].length ?? 0;
}

/**
 * The line without up to `columns` columns of its leading whitespace. A tab taken only in part
 * leaves the rest of its columns, which decode as spaces.
 */
export function stripColumns(line: string, columns: number): string {
  return line.slice(Math.min(columns, indentOf(line)));
}

/** The line without its leading whitespace. */
export function stripIndent(line: string): string {
  return line.slice(indentOf(line));
}

export function readFence(line: string): Fence | null {
  const match = fenceOpen.exec(line);
  if (!match) return null;
  const [, indent = '', marker = '', info = ''] = match;
  if (marker.startsWith('`') && info.includes('`')) return null;
  return { indent: indent.length, marker, info: decodeBlockText(info).trim() };
}

export function isFenceClose(line: string, fence: Fence): boolean {
  const match = fenceClose.exec(line);
  const marker = match?.[1] ?? '';
  return marker.startsWith(fence.marker.charAt(0)) && marker.length >= fence.marker.length;
}

/** A heading line's level and text, without the optional closing `#` sequence. */
export function readAtxHeading(line: string): { level: number; text: string } | null {
  const match = atxHeading.exec(line);
  if (!match) return null;
  const text = decodeBlockText(match[2] ?? '')
    .trim()
    .replace(/(?:^|[ \t]+)#+[ \t]*$/, '');
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

/**
 * The line without its block quote marker and the one column of whitespace after it, or null when
 * it has none.
 */
export function stripBlockquoteMarker(line: string): string | null {
  const match = blockquoteMarker.exec(line);
  return match ? stripColumns(line.slice(match[0].length), 1) : null;
}

export function readListMarker(line: string): ListMarker | null {
  if (isThematicBreak(line)) return null;
  const match = listMarker.exec(line);
  if (!match) return null;
  const [marker, , bullet, digits, delimiter = ''] = match;
  const rest = line.slice(marker.length);
  const spaces = indentOf(rest);
  const isEmpty = isBlank(rest);
  // Five or more columns start indented code inside the item, which then begins after one.
  const gap = isEmpty || spaces > 4 ? 1 : spaces;
  return {
    ordered: bullet === undefined,
    symbol: bullet ?? delimiter,
    start: digits === undefined ? 1 : Number(digits),
    contentIndent: marker.length + gap,
    content: stripColumns(rest, gap),
    isEmpty,
  };
}

/** Splits a table row into trimmed cells on unescaped pipes; `\|` becomes a literal pipe. */
export function splitTableCells(line: string): string[] {
  let row = decodeBlockText(line).trim();
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
