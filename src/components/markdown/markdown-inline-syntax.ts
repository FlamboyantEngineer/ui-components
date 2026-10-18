// Readers for the inline constructs of Markdown: escapes, code spans, autolinks, link targets and
// labels, and the flanking rules of emphasis delimiters (specs/MARKDOWN.md).

import { decodeEntities } from '../../utils/markup.js';

export interface LinkTarget {
  href: string;
  title: string | null;
  /** Index just past the construct. */
  end: number;
}

export interface DelimiterFlanking {
  canOpen: boolean;
  canClose: boolean;
}

type CharClass = 'space' | 'punctuation' | 'other';

const escapable = /^[!-/:-@[-`{-~]$/;
const escapeOrEntity = /\\([!-/:-@[-`{-~])|&(?:#x[0-9a-f]{1,6}|#[0-9]{1,7}|[a-z][a-z0-9]{1,31});/gi;
const uriAutolink = /^<([A-Za-z][A-Za-z0-9+.-]{1,31}:[^\s<>]*)>/;
const emailAutolink =
  /^<([A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*)>/;
const titleClosers: Readonly<Record<string, string>> = { '"': '"', "'": "'", '(': ')' };

export function isEscapable(char: string | undefined): boolean {
  return char !== undefined && escapable.test(char);
}

/** Resolves backslash escapes and entities, as in link destinations, titles and info strings. */
export function unescapeMarkdown(text: string): string {
  return text.replace(escapeOrEntity, (match, escaped: string | undefined) =>
    escaped === undefined ? decodeEntities(match) : escaped,
  );
}

/** A label's lookup key: trimmed, inner whitespace collapsed, case folded. */
export function normalizeLabel(label: string): string {
  return label.trim().replace(/\s+/g, ' ').toLowerCase();
}

/** Index just past the run of `char` that starts at `at`. */
export function runEnd(text: string, at: number, char: string): number {
  let end = at;
  while (text[end] === char) end += 1;
  return end;
}

/** A code span opening at `at`: its content and end, or null when no equal run closes it. */
export function readCodeSpan(text: string, at: number): { text: string; end: number } | null {
  const openEnd = runEnd(text, at, '`');
  const size = openEnd - at;
  for (let search = text.indexOf('`', openEnd); search !== -1; ) {
    const closeEnd = runEnd(text, search, '`');
    if (closeEnd - search === size) {
      const content = text.slice(openEnd, search).replaceAll('\n', ' ');
      const isPadded = content.startsWith(' ') && content.endsWith(' ') && content.trim() !== '';
      return { text: isPadded ? content.slice(1, -1) : content, end: closeEnd };
    }
    search = text.indexOf('`', closeEnd);
  }
  return null;
}

/** An autolink (`<https://…>` or `<name@example.com>`) at `at`. */
export function readAutolink(
  text: string,
  at: number,
): { href: string; label: string; end: number } | null {
  const rest = text.slice(at);
  const uri = uriAutolink.exec(rest);
  if (uri?.[1]) return { href: uri[1], label: uri[1], end: at + uri[0].length };
  const email = emailAutolink.exec(rest);
  if (email?.[1]) return { href: `mailto:${email[1]}`, label: email[1], end: at + email[0].length };
  return null;
}

function skipWhitespace(text: string, at: number): number {
  return at + (/^[ \t]*\n?[ \t]*/.exec(text.slice(at))?.[0].length ?? 0);
}

/** Index of the first unescaped `char` from `at` before any `stop` character, or -1. */
function findUnescaped(
  text: string,
  at: number,
  { char, stop }: { char: string; stop: string },
): number {
  for (let index = at; index < text.length; index += 1) {
    const current = text[index] as string;
    if (current === '\\' && isEscapable(text[index + 1])) index += 1;
    else if (current === char) return index;
    else if (stop.includes(current)) return -1;
  }
  return -1;
}

/** A bare destination: no spaces or control characters, balanced parentheses. */
function readBareDestination(text: string, at: number): number {
  let depth = 0;
  let index = at;
  for (; index < text.length; index += 1) {
    const char = text[index] as string;
    if (char === '\\' && isEscapable(text[index + 1])) index += 1;
    else if (char <= ' ' || char === '\u007f') break;
    else if (char === '(') depth += 1;
    else if (char === ')' && depth === 0) break;
    else if (char === ')') depth -= 1;
  }
  return depth === 0 && index > at ? index : -1;
}

function readDestination(text: string, at: number): { href: string; end: number } | null {
  if (text[at] === '<') {
    const close = findUnescaped(text, at + 1, { char: '>', stop: '<\n' });
    return close === -1 ? null : { href: text.slice(at + 1, close), end: close + 1 };
  }
  const end = readBareDestination(text, at);
  return end === -1 ? null : { href: text.slice(at, end), end };
}

function readTitle(text: string, at: number): { title: string; end: number } | null {
  const closer = titleClosers[text[at] ?? ''];
  if (!closer) return null;
  const close = findUnescaped(text, at + 1, { char: closer, stop: closer === ')' ? '(' : '' });
  return close === -1 ? null : { title: text.slice(at + 1, close), end: close + 1 };
}

/** An inline link target `(destination "title")` opening at `at`. */
export function readLinkTarget(text: string, at: number): LinkTarget | null {
  let index = skipWhitespace(text, at + 1);
  if (text[index] === ')') return { href: '', title: null, end: index + 1 };
  const destination = readDestination(text, index);
  if (!destination) return null;
  index = skipWhitespace(text, destination.end);
  const title = index > destination.end ? readTitle(text, index) : null;
  if (title) index = skipWhitespace(text, title.end);
  if (text[index] !== ')') return null;
  return {
    href: unescapeMarkdown(destination.href),
    title: title ? unescapeMarkdown(title.title) : null,
    end: index + 1,
  };
}

/** A link label `[label]` opening at `at`: its raw text and end. */
export function readLinkLabel(text: string, at: number): { label: string; end: number } | null {
  const close = findUnescaped(text, at + 1, { char: ']', stop: '[' });
  if (close === -1 || close - at > 1000) return null;
  return { label: text.slice(at + 1, close), end: close + 1 };
}

function classify(char: string | undefined): CharClass {
  if (char === undefined || /\s/.test(char)) return 'space';
  return /[\p{P}\p{S}]/u.test(char) ? 'punctuation' : 'other';
}

/** Whether the delimiter run `text[start, end)` may open or close emphasis. */
export function readFlanking(text: string, start: number, end: number): DelimiterFlanking {
  const before = classify(text[start - 1]);
  const after = classify(text[end]);
  const left = after !== 'space' && (after !== 'punctuation' || before !== 'other');
  const right = before !== 'space' && (before !== 'punctuation' || after !== 'other');
  if (text[start] !== '_') return { canOpen: left, canClose: right };
  return {
    canOpen: left && (!right || before === 'punctuation'),
    canClose: right && (!left || after === 'punctuation'),
  };
}
