// JSON text helpers for the JSON editor: highlighting tokens, parse checks and formatting.

import { requireDefined } from '../../utils/require-defined.js';
import type { CodeToken } from './code-editor.js';

/** Where a JSON text stops parsing, counted from 1. */
interface JsonErrorLocation {
  line: number;
  column: number;
}

/** A typed token and where it starts. */
export interface PlacedJsonToken {
  text: string;
  type: string;
  offset: number;
}

const whitespacePattern = /^\s+/;

const numberPattern = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/;

const literalPattern = /^(?:true|false|null)\b/;

const punctuationCharacters = new Set(['{', '}', '[', ']', ':', ',']);

const scalarKinds = new Set(['key', 'string', 'number', 'literal']);

/** The end of the string token starting at `start` (a double quote), past its closing quote. */
function endOfString(source: string, start: number): number {
  let index = start + 1;
  while (index < source.length) {
    const character = source[index];
    if (character === '\\') index += 2;
    else if (character === '"') return index + 1;
    else index += 1;
  }
  return source.length;
}

function isKey(source: string, end: number): boolean {
  return /^\s*:/.test(source.slice(end));
}

function readToken(source: string, index: number): CodeToken {
  const rest = source.slice(index);
  const space = whitespacePattern.exec(rest)?.[0];
  if (space) return { text: space };
  if (rest.startsWith('"')) {
    const end = endOfString(source, index);
    return { text: source.slice(index, end), type: isKey(source, end) ? 'key' : 'string' };
  }
  const number = numberPattern.exec(rest)?.[0];
  if (number) return { text: number, type: 'number' };
  const literal = literalPattern.exec(rest)?.[0];
  if (literal) return { text: literal, type: 'literal' };
  const character = rest.charAt(0);
  return {
    text: character,
    type: punctuationCharacters.has(character) ? 'punctuation' : 'invalid',
  };
}

function locationAt(source: string, offset: number): JsonErrorLocation {
  const before = source.slice(0, offset).split('\n');
  return { line: before.length, column: (before.at(-1)?.length ?? 0) + 1 };
}

/** The typed tokens of JSON text (whitespace left out), with their offsets. */
export function placeJsonTokens(source: string): PlacedJsonToken[] {
  const placed: PlacedJsonToken[] = [];
  let offset = 0;
  for (const { text, type } of tokenizeJson(source)) {
    if (type) placed.push({ text, type, offset });
    offset += text.length;
  }
  return placed;
}

interface GrammarFrame {
  kind: 'root' | 'array' | 'object';
  expects: 'first' | 'key' | 'colon' | 'value' | 'comma' | 'done';
}

function readGrammarValue(stack: GrammarFrame[], token: PlacedJsonToken): boolean {
  const frame = requireDefined(stack.at(-1));
  frame.expects = frame.kind === 'root' ? 'done' : 'comma';
  if (token.text === '{' || token.text === '[') {
    stack.push({ kind: token.text === '{' ? 'object' : 'array', expects: 'first' });
    return true;
  }
  return scalarKinds.has(token.type);
}

function readGrammarToken(stack: GrammarFrame[], token: PlacedJsonToken): boolean {
  const frame = requireDefined(stack.at(-1));
  const close = frame.kind === 'array' ? ']' : '}';
  if (frame.expects === 'first') {
    if (token.text === close) return Boolean(stack.pop());
    frame.expects = frame.kind === 'array' ? 'value' : 'key';
  }
  if (frame.expects === 'value') return readGrammarValue(stack, token);
  if (frame.expects === 'key') {
    if (token.type !== 'key' && token.type !== 'string') return false;
    frame.expects = 'colon';
    return true;
  }
  if (frame.expects === 'colon') {
    frame.expects = 'value';
    return token.text === ':';
  }
  if (frame.expects !== 'comma') return false;
  if (token.text === close) return Boolean(stack.pop());
  frame.expects = frame.kind === 'array' ? 'value' : 'key';
  return token.text === ',';
}

/** Where the tokens stop following JSON's grammar, or `null` when they follow it. */
function findGrammarError(source: string): number | null {
  const stack: GrammarFrame[] = [{ kind: 'root', expects: 'value' }];
  for (const token of placeJsonTokens(source)) {
    if (!readGrammarToken(stack, token)) return token.offset;
  }
  return stack.length === 1 && stack[0]?.expects === 'done' ? null : source.length;
}

/**
 * Splits JSON text into highlighting tokens that cover it exactly: object keys, strings, numbers,
 * literals (`true`, `false`, `null`), punctuation and characters JSON does not allow.
 */
export function tokenizeJson(source: string): CodeToken[] {
  const tokens: CodeToken[] = [];
  for (let index = 0; index < source.length;) {
    const token = readToken(source, index);
    tokens.push(token);
    index += token.text.length;
  }
  return tokens;
}

/**
 * Where the text fails to parse, read from the parser's message when it says (`line 3 column 5`
 * or `position 12`); `null` when the message gives no place.
 */
export function locateJsonError(source: string, message: string): JsonErrorLocation | null {
  const lineColumn = /line (\d+) column (\d+)/.exec(message);
  if (lineColumn) return { line: Number(lineColumn[1]), column: Number(lineColumn[2]) };
  const position = /position (\d+)/.exec(message);
  return position ? locationAt(source, Number(position[1])) : null;
}

/**
 * The parse error of a JSON text, or `null` when it parses. Blank text parses as nothing. The
 * location is the first token that breaks JSON's grammar, or else the place the parser reports.
 */
export function findJsonError(source: string): { location: JsonErrorLocation | null } | null {
  if (source.trim() === '') return null;
  try {
    JSON.parse(source);
    return null;
  } catch (error) {
    const offset = findGrammarError(source);
    if (offset !== null) return { location: locationAt(source, offset) };
    return { location: locateJsonError(source, error instanceof Error ? error.message : '') };
  }
}

const openers = new Set(['{', '[']);
const closers = new Set(['}', ']']);

/**
 * The text rewritten with `indent` spaces per level (0 to 10, none on one line), or `null` when it is blank
 * or not JSON. It lays out the source's own tokens, so every number, string and repeated key keeps
 * its text: formatting never changes a value, as reading it into JavaScript values would.
 */
export function formatJson(source: string, indent: number): string | null {
  if (source.trim() === '' || findJsonError(source)) return null;
  // Strings keep their quotes, so only punctuation reads as a bare bracket, colon or comma.
  const tokens = placeJsonTokens(source).map(({ text }) => text);
  const width = Math.min(10, Math.max(0, Math.trunc(indent) || 0));
  const breakAt = (depth: number) => (width > 0 ? `\n${' '.repeat(width * depth)}` : '');
  let depth = 0;
  let text = '';
  tokens.forEach((token, index) => {
    if (closers.has(token) && !openers.has(tokens[index - 1] ?? '')) {
      depth -= 1;
      text += breakAt(depth);
    }
    text += token === ':' && width > 0 ? ': ' : token;
    if (openers.has(token) && !closers.has(tokens[index + 1] ?? '')) {
      depth += 1;
      text += breakAt(depth);
    } else if (token === ',') text += breakAt(depth);
  });
  return text;
}
