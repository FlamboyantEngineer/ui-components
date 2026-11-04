// The inline parser: text, escapes, entities, code spans, emphasis, strikethrough, links, images,
// autolinks and line breaks, with CommonMark's delimiter and bracket rules (specs/MARKDOWN.md).

import { decodeEntities } from '../../utils/markup.js';
import { isSafeUrl } from '../../utils/safe-url.js';
import {
  type Bracket,
  type Item,
  itemText,
  resolveEmphasis,
  toNodes,
} from './markdown-emphasis.js';
import { toPlainText } from './markdown-headings.js';
import {
  isEscapable,
  type LinkTarget,
  normalizeLabel,
  readAutolink,
  readCodeSpan,
  readFlanking,
  readLinkLabel,
  readLinkTarget,
  runEnd,
} from './markdown-inline-syntax.js';
import type { MarkdownInline } from './markdown-nodes.js';

/** Link reference definitions by normalized label. */
type MarkdownDefinitions = ReadonlyMap<string, Omit<LinkTarget, 'end'>>;

interface InlineState {
  text: string;
  at: number;
  items: Item[];
  /** The open brackets, innermost last, with their item positions. */
  brackets: { bracket: Bracket; at: number }[];
  /** Brackets below this depth are inactive: a link closed above them. */
  activeDepth: number;
  buffer: string;
  definitions: MarkdownDefinitions;
}

const imageSchemes = ['http', 'https'];
/** CommonMark's longest link label. */
const maxLabelLength = 999;
const entity = /^&(?:#x[0-9a-f]{1,6}|#[0-9]{1,7}|[a-z][a-z0-9]{1,31});/i;

function skipSpaces(text: string, at: number): number {
  return runEnd(text, at, ' ');
}

function flush(state: InlineState): void {
  if (!state.buffer) return;
  state.items.push({ kind: 'node', node: { type: 'text', text: state.buffer } });
  state.buffer = '';
}

function push(state: InlineState, node: MarkdownInline, end: number): true {
  flush(state);
  state.items.push({ kind: 'node', node });
  state.at = end;
  return true;
}

function readDelimiter(state: InlineState): boolean {
  const { text, at } = state;
  const char = text[at] as string;
  const end = runEnd(text, at, char);
  if (char === '~' && end - at > 2) {
    state.buffer += text.slice(at, end);
    state.at = end;
    return true;
  }
  flush(state);
  const count = end - at;
  state.items.push({
    kind: 'delimiter',
    char,
    count,
    original: count,
    ...readFlanking(text, at, end),
  });
  state.at = end;
  return true;
}

/** The target after a closing bracket: inline, full, collapsed or shortcut reference. */
function readBracketTarget(state: InlineState, bracket: Bracket): LinkTarget | null {
  const { text, at } = state;
  const after = at + 1;
  if (text[after] === '(') {
    const inline = readLinkTarget(text, after);
    if (inline) return inline;
  }
  if (state.definitions.size === 0) return null;
  const reference = text[after] === '[' ? readLinkLabel(text, after) : null;
  if (!reference?.label.trim() && at - bracket.start > maxLabelLength) return null;
  const label = reference?.label.trim() ? reference.label : text.slice(bracket.start, at);
  const definition = state.definitions.get(normalizeLabel(label));
  return definition ? { ...definition, end: reference?.end ?? after } : null;
}

/** Link or image nodes for a closed bracket; an unsafe URL leaves its content as plain nodes. */
function createLinkNodes(bracket: Bracket, target: LinkTarget, inner: Item[]): MarkdownInline[] {
  const children = toNodes(resolveEmphasis(inner));
  const { href, title } = target;
  if (bracket.isImage) {
    const alt = toPlainText(children);
    return isSafeUrl(href, imageSchemes)
      ? [{ type: 'image', src: href, alt, title }]
      : [{ type: 'text', text: alt }];
  }
  return isSafeUrl(href) ? [{ type: 'link', href, title, children }] : children;
}

function closeBracket(state: InlineState): boolean {
  flush(state);
  const { items, brackets } = state;
  const open = brackets.pop();
  const isActive = brackets.length >= state.activeDepth;
  state.activeDepth = Math.min(state.activeDepth, brackets.length);
  if (!open) return false;
  const { bracket, at } = open;
  const target = isActive ? readBracketTarget(state, bracket) : null;
  if (!target) {
    items[at] = { kind: 'node', node: { type: 'text', text: itemText(bracket) } };
    return false;
  }
  const nodes = createLinkNodes(bracket, target, items.splice(at + 1));
  items.pop();
  for (const node of nodes) items.push({ kind: 'node', node });
  if (!bracket.isImage) state.activeDepth = brackets.length;
  state.at = target.end;
  return true;
}

function readBackslash(state: InlineState): boolean {
  const next = state.text[state.at + 1];
  if (next === '\n')
    return push(state, { type: 'lineBreak' }, skipSpaces(state.text, state.at + 2));
  if (!isEscapable(next)) return false;
  state.buffer += next;
  state.at += 2;
  return true;
}

function readBackticks(state: InlineState): boolean {
  const span = readCodeSpan(state.text, state.at);
  if (span) return push(state, { type: 'inlineCode', text: span.text }, span.end);
  const end = runEnd(state.text, state.at, '`');
  state.buffer += state.text.slice(state.at, end);
  state.at = end;
  return true;
}

function readAngle(state: InlineState): boolean {
  const link = readAutolink(state.text, state.at);
  if (!link) return false;
  const label = { type: 'text', text: link.label } as const;
  const node = isSafeUrl(link.href)
    ? ({ type: 'link', href: link.href, title: null, children: [label] } as const)
    : label;
  return push(state, node, link.end);
}

function readEntity(state: InlineState): boolean {
  const match = entity.exec(state.text.slice(state.at, state.at + 40));
  if (!match) return false;
  state.buffer += decodeEntities(match[0]);
  state.at += match[0].length;
  return true;
}

/** Ends a line. The text before it is flushed, so the buffer only ever holds one line. */
function readNewline(state: InlineState): boolean {
  const isHard = state.buffer.endsWith('  ');
  state.buffer = state.buffer.trimEnd();
  const next = skipSpaces(state.text, state.at + 1);
  if (isHard) return push(state, { type: 'lineBreak' }, next);
  state.buffer += '\n';
  flush(state);
  state.at = next;
  return true;
}

function openBracket(state: InlineState, isImage: boolean): true {
  flush(state);
  const start = state.at + (isImage ? 2 : 1);
  const bracket: Bracket = { kind: 'bracket', isImage, start };
  state.brackets.push({ bracket, at: state.items.length });
  state.items.push(bracket);
  state.at = start;
  return true;
}

const readers: Readonly<Record<string, (state: InlineState) => boolean>> = {
  '\\': readBackslash,
  '`': readBackticks,
  '*': readDelimiter,
  _: readDelimiter,
  '~': readDelimiter,
  '!': (state) => state.text[state.at + 1] === '[' && openBracket(state, true),
  '[': (state) => openBracket(state, false),
  ']': closeBracket,
  '<': readAngle,
  '&': readEntity,
  '\n': readNewline,
};

/** Parses the inline content of a paragraph, heading or table cell. */
export function parseMarkdownInlines(
  text: string,
  definitions: MarkdownDefinitions,
): MarkdownInline[] {
  const state: InlineState = {
    text,
    at: 0,
    items: [],
    brackets: [],
    activeDepth: 0,
    buffer: '',
    definitions,
  };
  while (state.at < text.length) {
    const char = text[state.at] as string;
    if (readers[char]?.(state)) continue;
    state.buffer += char;
    state.at += 1;
  }
  flush(state);
  return toNodes(resolveEmphasis(state.items));
}
