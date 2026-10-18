// A DOM-free tokenizer and entity decoder shared by the markup readers (specs/MARKUP.md).

export interface MarkupTextToken {
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

export interface MarkupCloseToken {
  readonly type: 'close';
  readonly tag: string;
}

export type MarkupToken = MarkupTextToken | MarkupOpenToken | MarkupCloseToken;

export interface TokenizeMarkupOptions {
  /** Lower-case names of elements whose content is raw text up to their closing tag. */
  rawTextElements?: ReadonlySet<string> | undefined;
}

/** The markup being read and the tokens read so far. */
interface Scanner {
  markup: string;
  tokens: MarkupToken[];
  rawTextElements: ReadonlySet<string> | undefined;
}

const tagPattern = /<(\/)?([A-Za-z_][\w:.-]*)((?:[^<>"']|"[^"]*"|'[^']*')*?)(\/)?>/y;
const attributePattern = /([^\s=/>"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
const entityPattern = /&(#x[0-9a-f]{1,8}|#[0-9]{1,8}|[a-z][a-z0-9]{1,31});/gi;

const namedEntities: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00a0',
  ensp: '\u2002',
  emsp: '\u2003',
  thinsp: '\u2009',
  shy: '\u00ad',
  copy: '©',
  reg: '®',
  trade: '™',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  lsquo: '‘',
  rsquo: '’',
  sbquo: '‚',
  ldquo: '“',
  rdquo: '”',
  bdquo: '„',
  laquo: '«',
  raquo: '»',
  bull: '•',
  middot: '·',
  dagger: '†',
  Dagger: '‡',
  para: '¶',
  sect: '§',
  deg: '°',
  plusmn: '±',
  times: '×',
  divide: '÷',
  minus: '−',
  le: '≤',
  ge: '≥',
  ne: '≠',
  asymp: '≈',
  infin: '∞',
  micro: 'µ',
  frac12: '½',
  frac14: '¼',
  frac34: '¾',
  sup2: '²',
  sup3: '³',
  euro: '€',
  pound: '£',
  yen: '¥',
  cent: '¢',
  larr: '←',
  rarr: '→',
  uarr: '↑',
  darr: '↓',
  harr: '↔',
};

function decodeCodePoint(value: number): string {
  const isSurrogate = value >= 0xd800 && value <= 0xdfff;
  return value === 0 || value > 0x10ffff || isSurrogate ? '\ufffd' : String.fromCodePoint(value);
}

/**
 * Decodes numeric character references and the common named entities (`&amp;`, `&nbsp;`,
 * `&mdash;`, …). An unknown name stays as written; a reference to no character becomes U+FFFD.
 */
export function decodeEntities(text: string): string {
  if (!text.includes('&')) return text;
  return text.replace(entityPattern, (match, entity: string) => {
    const lower = entity.toLowerCase();
    if (lower.startsWith('#x')) return decodeCodePoint(Number.parseInt(lower.slice(2), 16));
    if (lower.startsWith('#')) return decodeCodePoint(Number.parseInt(lower.slice(1), 10));
    return namedEntities[entity] ?? namedEntities[lower] ?? match;
  });
}

function parseAttributes(source: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  for (const match of source.matchAll(attributePattern)) {
    const name = match[1];
    if (!name || Object.hasOwn(attributes, name)) continue;
    attributes[name] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? '');
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

function readTag(scanner: Scanner, open: number): number {
  const { markup, tokens } = scanner;
  tagPattern.lastIndex = open;
  const match = tagPattern.exec(markup);
  if (!match) {
    tokens.push({ type: 'text', text: '<' });
    return open + 1;
  }
  const end = tagPattern.lastIndex;
  const [, closing, tag = '', attributeSource = '', selfClosing] = match;
  if (closing) {
    tokens.push({ type: 'close', tag });
    return end;
  }
  const isSelfClosing = Boolean(selfClosing);
  tokens.push({ type: 'open', tag, attributes: parseAttributes(attributeSource), isSelfClosing });
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
  const scanner: Scanner = { markup, tokens, rawTextElements: options.rawTextElements };
  let index = 0;
  while (index < markup.length) {
    const open = markup.indexOf('<', index);
    const textEnd = open === -1 ? markup.length : open;
    if (textEnd > index) {
      tokens.push({ type: 'text', text: decodeEntities(markup.slice(index, textEnd)) });
    }
    if (open === -1) break;
    index = readNonElement(scanner, open) ?? readTag(scanner, open);
  }
  return tokens;
}
