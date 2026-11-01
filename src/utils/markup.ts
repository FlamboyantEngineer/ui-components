// A DOM-free tokenizer and entity decoder shared by the markup readers (specs/MARKUP.md).

import { decodeHTML, decodeHTMLAttribute, decodeHTMLStrict } from 'entities/decode';

/**
 * The deepest element nesting the markup renderers draw (specs/MARKUP.md): deeper elements are
 * unwrapped and their content kept, so no input overflows the stack while React mounts it. It sits
 * well below the 512 open elements Chromium's parser keeps, so server HTML parses back the same
 * inside a page's own nesting.
 */
export const maxMarkupDepth = 256;

interface MarkupTextToken {
  readonly type: 'text';
  readonly text: string;
}

export interface MarkupOpenToken {
  readonly type: 'open';
  /** The tag name as written. */
  readonly tag: string;
  /** Attributes as written, with entities decoded; the first of repeated names wins. */
  readonly attributes: Readonly<Record<string, string>>;
  /** The tag ends in `/>`. */
  readonly isSelfClosing: boolean;
}

interface MarkupCloseToken {
  readonly type: 'close';
  readonly tag: string;
}

type MarkupToken = MarkupTextToken | MarkupOpenToken | MarkupCloseToken;

interface TokenizeMarkupOptions {
  /** Lower-case names of elements whose content is raw text up to their closing tag. */
  rawTextElements?: ReadonlySet<string> | undefined;
  /**
   * `html` decodes references as an HTML parser does, also legacy names without a `;` (`&copy`)
   * and numeric references a browser remaps; `strict` (the default) decodes as `decodeEntities`.
   */
  references?: 'html' | 'strict' | undefined;
}

interface SkipDroppedElementsOptions {
  /** Whether an opening tag starts an element dropped with its content. */
  isDropped: (token: MarkupOpenToken) => boolean;
  /** Whether an opening tag has no content (self-closing, or void in HTML). Defaults to `/>`. */
  isEmpty?: ((token: MarkupOpenToken) => boolean) | undefined;
}

/** The markup being read and the tokens read so far. */
interface Scanner {
  markup: string;
  tokens: MarkupToken[];
  rawTextElements: ReadonlySet<string> | undefined;
  decode: ReferenceDecoders;
}

const tagNamePattern = /[A-Za-z_][\w:.-]*/y;
const attributePattern = /([^\s=/>"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
const entityPattern = /&(#x[0-9a-f]{1,8}|#[0-9]{1,8}|[a-z][a-z0-9]{1,31});/gi;

function decodeCodePoint(value: number): string {
  const isSurrogate = value >= 0xd800 && value <= 0xdfff;
  return value === 0 || value > 0x10ffff || isSurrogate ? '\ufffd' : String.fromCodePoint(value);
}

/**
 * Decodes numeric character references and every named character reference of HTML (`&amp;`,
 * `&eacute;`, `&alpha;`, `&NotNestedGreaterGreater;`), each ended by its `;` and matched with its
 * case. An unknown name stays as written; a reference to no character becomes U+FFFD.
 */
export function decodeEntities(text: string): string {
  if (!text.includes('&')) return text;
  return text.replace(entityPattern, (match, entity: string) => {
    const lower = entity.toLowerCase();
    if (lower.startsWith('#x')) return decodeCodePoint(Number.parseInt(lower.slice(2), 16));
    if (lower.startsWith('#')) return decodeCodePoint(Number.parseInt(lower.slice(1), 10));
    return decodeHTMLStrict(match);
  });
}

/** How a tokenizer decodes character references in text and attribute values. */
interface ReferenceDecoders {
  text: (text: string) => string;
  attribute: (value: string) => string;
}

const strictDecoders: ReferenceDecoders = { text: decodeEntities, attribute: decodeEntities };

/** An HTML parser's decoding, legacy references without a `;` included. */
const htmlDecoders: ReferenceDecoders = {
  text: (text) => (text.includes('&') ? decodeHTML(text) : text),
  attribute: (value) => (value.includes('&') ? decodeHTMLAttribute(value) : value),
};

function parseAttributes(source: string, decode: ReferenceDecoders): Record<string, string> {
  const attributes: Record<string, string> = {};
  for (const match of source.matchAll(attributePattern)) {
    const name = match[1];
    if (!name || Object.hasOwn(attributes, name)) continue;
    attributes[name] = decode.attribute(match[2] ?? match[3] ?? match[4] ?? '');
  }
  return attributes;
}

/** Index just past the `>` that closes a declaration such as a doctype with an internal subset. */
function findDeclarationEnd(markup: string, start: number): number {
  let depth = 0;
  for (let index = start; index < markup.length; index += 1) {
    const char = markup[index];
    if (char === '[') depth += 1;
    else if (char === ']') depth = Math.max(0, depth - 1);
    else if (char === '>' && depth === 0) return index + 1;
  }
  return markup.length;
}

/** Index just past the next `terminator` from `from`, or the end of the markup. */
function findIndexAfter(markup: string, terminator: string, from: number): number {
  const end = markup.indexOf(terminator, from);
  return end === -1 ? markup.length : end + terminator.length;
}

/**
 * Reads a construct that is not an element tag at `open`: a comment, processing instruction or
 * declaration (dropped) or a CDATA section (its text kept). Returns the index after it, or null
 * when `open` starts a tag.
 */
function readNonElement({ markup, tokens }: Scanner, open: number): number | null {
  if (markup.startsWith('<!--', open)) return findIndexAfter(markup, '-->', open + 4);
  if (markup.startsWith('<![CDATA[', open)) {
    const end = findIndexAfter(markup, ']]>', open + 9);
    const text = markup.slice(open + 9, markup.endsWith(']]>', end) ? end - 3 : end);
    if (text) tokens.push({ type: 'text', text });
    return end;
  }
  if (markup.startsWith('<?', open)) return findIndexAfter(markup, '?>', open + 2);
  if (markup.startsWith('<!', open)) return findDeclarationEnd(markup, open + 2);
  return null;
}

/** Reads the raw text of an element up to its closing tag, which it also reads. */
function readRawText({ markup, tokens }: Scanner, tag: string, from: number): number {
  const closer = new RegExp(`</${tag.replaceAll('.', '\\.')}\\s*>`, 'ig');
  closer.lastIndex = from;
  const match = closer.exec(markup);
  const end = match ? match.index : markup.length;
  if (end > from) tokens.push({ type: 'text', text: markup.slice(from, end) });
  tokens.push({ type: 'close', tag });
  return match ? closer.lastIndex : markup.length;
}

/**
 * Index of the `>` that ends a tag's attributes from `from`, skipping quoted values, or -1 when
 * a `<` outside quotes, an unclosed quote or the end of the markup comes first. One pass, so an
 * unterminated tag costs its length once.
 */
function findTagEnd(markup: string, from: number): number {
  for (let index = from; index < markup.length; index += 1) {
    const char = markup[index];
    if (char === '>') return index;
    if (char === '<') return -1;
    if (char === '"' || char === "'") {
      index = markup.indexOf(char, index + 1);
      if (index === -1) return -1;
    }
  }
  return -1;
}

function readTag(scanner: Scanner, open: number): number {
  const { markup, tokens } = scanner;
  const isClosing = markup[open + 1] === '/';
  tagNamePattern.lastIndex = open + (isClosing ? 2 : 1);
  const name = tagNamePattern.exec(markup);
  const nameEnd = tagNamePattern.lastIndex;
  const close = name ? findTagEnd(markup, nameEnd) : -1;
  if (!name || close === -1) {
    tokens.push({ type: 'text', text: '<' });
    return open + 1;
  }
  const tag = name[0];
  const end = close + 1;
  if (isClosing) {
    tokens.push({ type: 'close', tag });
    return end;
  }
  const isSelfClosing = close > nameEnd && markup[close - 1] === '/';
  const attributeSource = markup.slice(nameEnd, isSelfClosing ? close - 1 : close);
  tokens.push({
    type: 'open',
    tag,
    attributes: parseAttributes(attributeSource, scanner.decode),
    isSelfClosing,
  });
  if (isSelfClosing || !scanner.rawTextElements?.has(tag.toLowerCase())) return end;
  return readRawText(scanner, tag, end);
}

/**
 * Splits markup into text, opening-tag and closing-tag tokens without touching the DOM. Comments,
 * processing instructions and declarations are dropped; CDATA sections become text; text has its
 * entities decoded. A `<` that starts no tag is text. The content of a raw-text element is one
 * undecoded text token, followed by its closing tag (implied at the end of the markup).
 */
export function tokenizeMarkup(markup: string, options: TokenizeMarkupOptions = {}): MarkupToken[] {
  const tokens: MarkupToken[] = [];
  const decode = options.references === 'html' ? htmlDecoders : strictDecoders;
  const scanner: Scanner = { markup, tokens, rawTextElements: options.rawTextElements, decode };
  let index = 0;
  while (index < markup.length) {
    const open = markup.indexOf('<', index);
    const textEnd = open === -1 ? markup.length : open;
    if (textEnd > index) {
      tokens.push({ type: 'text', text: decode.text(markup.slice(index, textEnd)) });
    }
    if (open === -1) break;
    index = readNonElement(scanner, open) ?? readTag(scanner, open);
  }
  return tokens;
}

/**
 * The tokens outside the elements `isDropped` picks: each picked element is skipped with its
 * content up to its matching closing tag. Elements of the same name nested inside it are counted,
 * so their closing tags do not end the drop early; tag names compare ignoring case.
 */
export function* skipDroppedElements(
  tokens: Iterable<MarkupToken>,
  { isDropped, isEmpty = (token) => token.isSelfClosing }: SkipDroppedElementsOptions,
): Generator<MarkupToken> {
  let dropping: string | null = null;
  let depth = 0;
  for (const token of tokens) {
    if (dropping === null) {
      if (token.type !== 'open' || !isDropped(token)) yield token;
      else if (!isEmpty(token)) [dropping, depth] = [token.tag.toLowerCase(), 1];
      continue;
    }
    if (token.type === 'text' || token.tag.toLowerCase() !== dropping) continue;
    if (token.type === 'close') depth -= 1;
    else if (!isEmpty(token)) depth += 1;
    if (depth === 0) dropping = null;
  }
}
