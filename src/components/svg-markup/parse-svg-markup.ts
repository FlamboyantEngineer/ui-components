// A DOM-free parser for SVG markup strings. It reads the subset of XML that icon and illustration
// files use and returns a plain, frozen tree that React can render without innerHTML.

import { tokenizeMarkup, type MarkupOpenToken } from '../../utils/markup.js';
import { walkTree } from '../../utils/walk-tree.js';

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

/** The parse so far: a document node holding the top-level elements, and the open elements. */
interface ParserState {
  root: MutableElement;
  stack: MutableElement[];
}

/** Elements whose whole subtree is dropped: scripts and embedded HTML. */
const droppedElements: ReadonlySet<string> = new Set(['script', 'foreignobject']);
const urlAttributes = new Set(['href', 'xlink:href', 'src']);

const cacheLimit = 256;
const cache = new Map<string, SvgElementNode>();

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

function filterAttributes(attributes: Readonly<Record<string, string>>): Record<string, string> {
  const kept: Record<string, string> = {};
  for (const [name, value] of Object.entries(attributes)) {
    if (/^on/i.test(name)) continue;
    if (urlAttributes.has(name.toLowerCase()) && isUnsafeUrl(value)) continue;
    kept[name] = value;
  }
  return kept;
}

function freezeNode(root: MutableElement | SvgTextNode): SvgNode {
  for (const node of walkTree([root], (node) =>
    node.type === 'element' ? node.children : undefined,
  )) {
    if (node.type === 'element') {
      Object.freeze(node.attributes);
      Object.freeze(node.children);
    }
    Object.freeze(node);
  }
  return root;
}

function currentElement(state: ParserState): MutableElement {
  return state.stack[state.stack.length - 1] ?? state.root;
}

/** Adds text to the open element; whitespace-only text and text outside any element are dropped. */
function addText(state: ParserState, text: string): void {
  if (text.trim() === '' || state.stack.length === 1) return;
  currentElement(state).children.push({ type: 'text', text });
}

/** Closes the nearest open element named `tag`, and any left open inside it. */
function closeElement(state: ParserState, tag: string): void {
  const at = state.stack.findLastIndex((element, position) => position > 0 && element.tag === tag);
  if (at > 0) state.stack.length = at;
}

function openElement(state: ParserState, token: MarkupOpenToken): void {
  const element: MutableElement = {
    type: 'element',
    tag: token.tag,
    attributes: filterAttributes(token.attributes),
    children: [],
  };
  currentElement(state).children.push(element);
  if (!token.isSelfClosing) state.stack.push(element);
}

function parseTree(markup: string): SvgElementNode {
  const root: MutableElement = { type: 'element', tag: '#document', attributes: {}, children: [] };
  const state: ParserState = { root, stack: [root] };
  let dropping: string | null = null;
  for (const token of tokenizeMarkup(markup, { rawTextElements: droppedElements })) {
    if (dropping !== null) {
      if (token.type === 'close' && token.tag === dropping) dropping = null;
    } else if (token.type === 'text') {
      addText(state, token.text);
    } else if (token.type === 'close') {
      closeElement(state, token.tag);
    } else if (droppedElements.has(token.tag.toLowerCase())) {
      dropping = token.isSelfClosing ? null : token.tag;
    } else {
      openElement(state, token);
    }
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
