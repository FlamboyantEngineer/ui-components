// The inline parser: text, escapes, entities, code spans, emphasis, strikethrough, links, images,
// autolinks and line breaks, with CommonMark's delimiter and bracket rules (specs/MARKDOWN.md).

import { decodeEntities } from '../../utils/markup.js';
import { isSafeUrl } from '../../utils/safe-url.js';
import {
  isEscapable,
  normalizeLabel,
  readAutolink,
  readCodeSpan,
  readFlanking,
  readLinkLabel,
  readLinkTarget,
  runEnd,
  type LinkTarget,
} from './markdown-inline-syntax.js';
import { toPlainText } from './markdown-headings.js';
import type { MarkdownInline } from './markdown-nodes.js';

/** Link reference definitions by normalized label. */
type MarkdownDefinitions = ReadonlyMap<string, Omit<LinkTarget, 'end'>>;

interface Delimiter {
  kind: 'delimiter';
  char: string;
  count: number;
  original: number;
  canOpen: boolean;
  canClose: boolean;
}

interface Bracket {
  kind: 'bracket';
  isImage: boolean;
  isActive: boolean;
  /** Index of the label's first character. */
  start: number;
}

type Item = { kind: 'node'; node: MarkdownInline } | Delimiter | Bracket;

interface InlineState {
  text: string;
  at: number;
  items: Item[];
  buffer: string;
  definitions: MarkdownDefinitions;
}

const imageSchemes = ['http', 'https'];
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

function itemText(item: Delimiter | Bracket): string {
  if (item.kind === 'delimiter') return item.char.repeat(item.count);
  return item.isImage ? '![' : '[';
}

/** The items as nodes: leftover delimiters and brackets become text, adjacent texts merge. */
function toNodes(items: readonly Item[]): MarkdownInline[] {
  const nodes: MarkdownInline[] = [];
  for (const item of items) {
    const node: MarkdownInline =
      item.kind === 'node' ? item.node : { type: 'text', text: itemText(item) };
    const last = nodes[nodes.length - 1];
    if (node.type === 'text' && last?.type === 'text') {
      nodes[nodes.length - 1] = { type: 'text', text: last.text + node.text };
    } else if (node.type !== 'text' || node.text) {
      nodes.push(node);
    }
  }
  return nodes;
}

function isOpenerFor(item: Item, closer: Delimiter): item is Delimiter {
  if (item.kind !== 'delimiter' || item.char !== closer.char || !item.canOpen) return false;
  if (closer.char === '~') return item.count === closer.count;
  const isOddMatch =
    (item.canClose || closer.canOpen) &&
    (item.original + closer.original) % 3 === 0 &&
    !(item.original % 3 === 0 && closer.original % 3 === 0);
  return !isOddMatch;
}

/** Pairs delimiter runs into emphasis, strong and strikethrough nodes, innermost first. */
function processEmphasis(items: Item[]): void {
  for (let index = 0; index < items.length; index += 1) {
    const closer = items[index] as Item;
    if (closer.kind !== 'delimiter' || !closer.canClose) continue;
    const openerAt = items.findLastIndex(
      (item, position) => position < index && isOpenerFor(item, closer),
    );
    if (openerAt === -1) continue;
    const opener = items[openerAt] as Delimiter;
    const use = closer.char === '~' ? closer.count : Math.min(2, opener.count, closer.count);
    const type = closer.char === '~' ? 'strikethrough' : use === 2 ? 'strong' : 'emphasis';
    const inner = items.splice(openerAt + 1, index - openerAt - 1);
    items.splice(openerAt + 1, 0, { kind: 'node', node: { type, children: toNodes(inner) } });
    opener.count -= use;
    closer.count -= use;
    let closerAt = openerAt + 2;
    if (opener.count === 0) {
      items.splice(openerAt, 1);
      closerAt -= 1;
    }
    if (closer.count === 0) items.splice(closerAt, 1);
    index = closerAt - 1;
  }
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
  const reference = text[after] === '[' ? readLinkLabel(text, after) : null;
  const label = reference?.label.trim() ? reference.label : text.slice(bracket.start, at);
  const definition = state.definitions.get(normalizeLabel(label));
  return definition ? { ...definition, end: reference?.end ?? after } : null;
}

/** Link or image nodes for a closed bracket; an unsafe URL leaves its content as plain nodes. */
function createLinkNodes(bracket: Bracket, target: LinkTarget, inner: Item[]): MarkdownInline[] {
  processEmphasis(inner);
  const children = toNodes(inner);
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
  const { items } = state;
  const at = items.findLastIndex((item) => item.kind === 'bracket');
  const bracket = items[at];
  if (bracket?.kind !== 'bracket') return false;
  const target = bracket.isActive ? readBracketTarget(state, bracket) : null;
  if (!target) {
    items[at] = { kind: 'node', node: { type: 'text', text: itemText(bracket) } };
    return false;
  }
  const nodes = createLinkNodes(bracket, target, items.splice(at + 1));
  items.pop();
  for (const node of nodes) items.push({ kind: 'node', node });
  if (!bracket.isImage) {
    for (let index = 0; index < at; index += 1) {
      const item = items[index]!;
      if (item.kind === 'bracket') item.isActive = false;
    }
  }
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

function readNewline(state: InlineState): boolean {
  const isHard = / {2,}$/.test(state.buffer);
  state.buffer = state.buffer.trimEnd();
  const next = skipSpaces(state.text, state.at + 1);
  if (isHard) return push(state, { type: 'lineBreak' }, next);
  state.buffer += '\n';
  state.at = next;
  return true;
}

function openBracket(state: InlineState, isImage: boolean): true {
  flush(state);
  const start = state.at + (isImage ? 2 : 1);
  state.items.push({ kind: 'bracket', isImage, isActive: true, start });
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
  const state: InlineState = { text, at: 0, items: [], buffer: '', definitions };
  while (state.at < text.length) {
    const char = text[state.at] as string;
    if (readers[char]?.(state)) continue;
    state.buffer += char;
    state.at += 1;
  }
  flush(state);
  processEmphasis(state.items);
  return toNodes(state.items);
}
