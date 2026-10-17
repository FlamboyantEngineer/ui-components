// Ranges of the source a code editor marks: diagnostics, matching brackets and search matches.

import type { CodeDiagnostic, CodeToken } from './code-layers.js';

/** A run of the source, as text offsets. */
export interface CodeRange {
  start: number;
  end: number;
}

/** The bracket at the caret and its partner, `null` when it has none. */
export interface BracketMatch {
  at: number;
  partner: number | null;
}

const pairs: Readonly<Record<string, string>> = {
  '(': ')',
  '[': ']',
  '{': '}',
  ')': '(',
  ']': '[',
  '}': '{',
};

const opening = new Set(['(', '[', '{']);

/** Token types whose text is not code, so their brackets do not count. */
const textTypes = new Set(['string', 'key', 'comment']);

const WORD = /^[\w$]+/;

function lineBounds(value: string, line: number): CodeRange | null {
  const lines = value.split('\n');
  if (line < 1 || line > lines.length) return null;
  const start = lines.slice(0, line - 1).reduce((sum, text) => sum + text.length + 1, 0);
  return { start, end: start + (lines[line - 1]?.length ?? 0) };
}

/** The offset of a line and column counted from 1, kept within the line. */
function offsetAt(value: string, line: number, column: number): number | null {
  const bounds = lineBounds(value, line);
  if (!bounds) return null;
  return Math.min(bounds.end, bounds.start + Math.max(0, column - 1));
}

/** At least one character: the word at `start`, or the character before a line end. */
function spanAt(value: string, start: number, lineStart: number): CodeRange | null {
  const word = WORD.exec(value.slice(start))?.[0].length ?? 0;
  if (word > 0) return { start, end: start + word };
  if (start < value.length && value[start] !== '\n') return { start, end: start + 1 };
  return start > lineStart ? { start: start - 1, end: start } : null;
}

/**
 * The source a diagnostic marks: from its column to `endLine` and `endColumn`, or else the word at
 * its column; the line's text when it has no column. `null` when it has no line or nothing to mark.
 */
export function findDiagnosticRange(value: string, diagnostic: CodeDiagnostic): CodeRange | null {
  const { line, column, endLine, endColumn } = diagnostic;
  if (line === undefined) return null;
  const bounds = lineBounds(value, line);
  if (!bounds) return null;
  if (column === undefined) {
    const indent = /^\s*/.exec(value.slice(bounds.start, bounds.end))?.[0].length ?? 0;
    return bounds.start + indent < bounds.end
      ? { start: bounds.start + indent, end: bounds.end }
      : null;
  }
  const start = Math.min(bounds.end, bounds.start + Math.max(0, column - 1));
  const end = endColumn === undefined ? null : offsetAt(value, endLine ?? line, endColumn);
  if (end !== null && end > start) return { start, end };
  return spanAt(value, start, bounds.start);
}

/** Whether each offset is code: not inside a string, key or comment token. */
function createCodeMask(tokens: readonly CodeToken[]): (offset: number) => boolean {
  const skipped: CodeRange[] = [];
  let offset = 0;
  for (const { text, type } of tokens) {
    if (type && textTypes.has(type)) skipped.push({ start: offset, end: offset + text.length });
    offset += text.length;
  }
  return (at) => !skipped.some(({ start, end }) => at >= start && at < end);
}

function scanForPartner(value: string, from: number, isCode: (offset: number) => boolean) {
  const forward = opening.has(value[from] ?? '');
  const stack: string[] = [];
  for (let at = from + (forward ? 1 : -1); at >= 0 && at < value.length; at += forward ? 1 : -1) {
    const character = value[at] ?? '';
    if (!(character in pairs) || !isCode(at)) continue;
    if (opening.has(character) === forward) stack.push(character);
    else if (stack.length > 0) stack.pop();
    else return pairs[character] === value[from] ? at : null;
  }
  return null;
}

/**
 * The bracket just before the caret (or else just after it) and its partner, skipping brackets in
 * strings, keys and comments; `null` when no bracket touches the caret.
 */
export function matchBracket(
  value: string,
  tokens: readonly CodeToken[],
  caret: number,
): BracketMatch | null {
  const isCode = createCodeMask(tokens);
  const at = [caret - 1, caret].find(
    (offset) => offset >= 0 && (value[offset] ?? '') in pairs && isCode(offset),
  );
  if (at === undefined) return null;
  return { at, partner: scanForPartner(value, at, isCode) };
}

/** The places `query` occurs in the source, ignoring case, without overlaps. */
export function findMatches(value: string, query: string): CodeRange[] {
  if (!query) return [];
  const text = value.toLowerCase();
  const needle = query.toLowerCase();
  const matches: CodeRange[] = [];
  for (let at = text.indexOf(needle); at !== -1; at = text.indexOf(needle, at + needle.length)) {
    matches.push({ start: at, end: at + needle.length });
  }
  return matches;
}
