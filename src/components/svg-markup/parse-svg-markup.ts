// A DOM-free parser for SVG markup strings. It reads the subset of XML that icon and illustration
// files use and returns a plain, frozen tree that React can render without innerHTML.

export interface SvgElementNode {
  readonly type: 'element';
  /** The tag name as written (`path`, `linearGradient`). The root is always `svg`. */
  readonly tag: string;
  /** Attributes as written in the markup, with entities decoded. */
  readonly attributes: Readonly<Record<string, string>>;
  readonly children: readonly SvgNode[];
}

export interface SvgTextNode {
  readonly type: 'text';
  readonly text: string;
}

export type SvgNode = SvgElementNode | SvgTextNode;

interface MutableElement {
  type: 'element';
  tag: string;
  attributes: Record<string, string>;
  children: Array<MutableElement | SvgTextNode>;
}

/** The parse so far: the markup, a document node holding the top-level elements, and open elements. */
interface ParserState {
  markup: string;
  root: MutableElement;
  stack: MutableElement[];
}

const tagPattern = /<(\/)?([A-Za-z_][\w:.-]*)((?:[^<>"']|"[^"]*"|'[^']*')*?)(\/)?>/y;
const attributePattern = /([^\s=/>"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
const entityPattern = /&(#x[0-9a-f]+|#[0-9]+|amp|lt|gt|quot|apos);/gi;
const namedEntities: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

/** Elements whose whole subtree is dropped: scripts and embedded HTML. */
const droppedElements = new Set(['script', 'foreignobject']);
const urlAttributes = new Set(['href', 'xlink:href', 'src']);

const cacheLimit = 256;
const cache = new Map<string, SvgElementNode>();

function decodeEntities(text: string): string {
  return text.replace(entityPattern, (match, entity: string) => {
    const lower = entity.toLowerCase();
    if (lower.startsWith('#x')) return decodeCodePoint(Number.parseInt(lower.slice(2), 16), match);
    if (lower.startsWith('#')) return decodeCodePoint(Number.parseInt(lower.slice(1), 10), match);
    return namedEntities[lower] ?? match;
  });
}

function decodeCodePoint(value: number, fallback: string): string {
  try {
    return String.fromCodePoint(value);
  } catch {
    return fallback;
  }
}

function isUnsafeUrl(value: string): boolean {
  // Browsers ignore control characters and whitespace inside a scheme.
  let compact = '';
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code > 0x20 && code !== 0x7f) compact += char.toLowerCase();
    if (compact.length >= 11) break;
  }
  return compact.startsWith('javascript:') || compact.startsWith('vbscript:');
}

function parseAttributes(source: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  for (const match of source.matchAll(attributePattern)) {
    const name = match[1];
    if (!name || name in attributes) continue;
    if (/^on/i.test(name)) continue;
    const value = decodeEntities(match[2] ?? match[3] ?? match[4] ?? '');
    if (urlAttributes.has(name.toLowerCase()) && isUnsafeUrl(value)) continue;
    attributes[name] = value;
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

function freezeNode(node: MutableElement | SvgTextNode): SvgNode {
  if (node.type === 'text') return Object.freeze(node);
  return Object.freeze({
    type: 'element',
    tag: node.tag,
    attributes: Object.freeze(node.attributes),
    children: Object.freeze(node.children.map(freezeNode)),
  });
}

function currentElement(state: ParserState): MutableElement {
  return state.stack[state.stack.length - 1] ?? state.root;
}

/** Adds text to the open element; whitespace-only text and text outside any element are dropped. */
function addText(state: ParserState, text: string): void {
  if (text.trim() === '' || state.stack.length === 1) return;
  currentElement(state).children.push({ type: 'text', text });
}

/**
 * Reads a construct that is not an element tag at `open`: a comment, processing instruction or
 * declaration (dropped) or a CDATA section (kept as text). Returns the index after it, or null when
 * `open` starts a tag.
 */
function parseNonElement(state: ParserState, open: number): number | null {
  const { markup } = state;
  if (markup.startsWith('<!--', open)) return findIndexAfter(markup, '-->', open + 4);
  if (markup.startsWith('<![CDATA[', open)) {
    const close = markup.indexOf(']]>', open + 9);
    const end = close === -1 ? markup.length : close;
    addText(state, markup.slice(open + 9, end));
    return close === -1 ? end : end + 3;
  }
  if (markup.startsWith('<?', open)) return findIndexAfter(markup, '?>', open + 2);
  if (markup.startsWith('<!', open)) return findDeclarationEnd(markup, open + 2);
  return null;
}

/** Closes the nearest open element named `tag`, and any left open inside it. */
function closeElement(state: ParserState, tag: string): void {
  const at = state.stack.findLastIndex((element, position) => position > 0 && element.tag === tag);
  if (at > 0) state.stack.length = at;
}

/** Index just past the closing tag of a dropped element that starts before `from`. */
function skipElement(markup: string, tag: string, from: number): number {
  const closer = new RegExp(`</${tag}\\s*>`, 'ig');
  closer.lastIndex = from;
  return closer.exec(markup) ? closer.lastIndex : markup.length;
}

/** Reads the tag at `open` into the tree and returns the index after it. */
function parseTag(state: ParserState, open: number): number {
  const { markup } = state;
  tagPattern.lastIndex = open;
  const match = tagPattern.exec(markup);
  if (!match) {
    addText(state, '<');
    return open + 1;
  }
  const end = tagPattern.lastIndex;
  const [, closing, tag = '', attributeSource = '', selfClosing] = match;
  if (closing) {
    closeElement(state, tag);
    return end;
  }
  if (droppedElements.has(tag.toLowerCase())) {
    return selfClosing ? end : skipElement(markup, tag, end);
  }
  const element: MutableElement = {
    type: 'element',
    tag,
    attributes: parseAttributes(attributeSource),
    children: [],
  };
  currentElement(state).children.push(element);
  if (!selfClosing) state.stack.push(element);
  return end;
}

function parseTree(markup: string): SvgElementNode {
  const root: MutableElement = { type: 'element', tag: '#document', attributes: {}, children: [] };
  const state: ParserState = { markup, root, stack: [root] };
  let index = 0;
  while (index < markup.length) {
    const open = markup.indexOf('<', index);
    const textEnd = open === -1 ? markup.length : open;
    if (textEnd > index) addText(state, decodeEntities(markup.slice(index, textEnd)));
    if (open === -1) break;
    index = parseNonElement(state, open) ?? parseTag(state, open);
  }
  const svg = root.children.find(
    (child): child is MutableElement =>
      child.type === 'element' && child.tag.toLowerCase() === 'svg',
  );
  if (!svg) throw new Error('SVG markup must contain a root <svg> element.');
  return freezeNode({ ...svg, tag: 'svg' }) as SvgElementNode;
}

/**
 * Parses SVG markup into a frozen element tree rooted at its `<svg>` element. Comments, processing
 * instructions and doctypes are dropped; CDATA becomes text; entities are decoded. Scripts, embedded
 * HTML (`foreignObject`), event-handler attributes and script URLs are dropped. Results are cached by
 * markup string, keeping the most recently used entries. Throws when the markup has no `<svg>` root.
 */
export function parseSvgMarkup(markup: string): SvgElementNode {
  const cached = cache.get(markup);
  if (cached) {
    cache.delete(markup);
    cache.set(markup, cached);
    return cached;
  }
  const tree = parseTree(markup);
  cache.set(markup, tree);
  while (cache.size > cacheLimit) {
    const oldest = cache.keys().next();
    if (oldest.done) break;
    cache.delete(oldest.value);
  }
  return tree;
}
