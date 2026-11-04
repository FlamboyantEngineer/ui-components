// A DOM-free parser for SVG markup strings. It reads the subset of XML that icon and illustration
// files use and returns a plain, frozen tree that React can render without innerHTML.

import { createLruCache } from '../../utils/lru-cache.js';
import { type MarkupOpenToken, skipDroppedElements, tokenizeMarkup } from '../../utils/markup.js';
import {
  closeOpen,
  createOpenElements,
  currentOpen,
  findOpen,
  type OpenElements,
  pushOpen,
} from '../../utils/open-elements.js';
import { walkTree } from '../../utils/walk-tree.js';
import {
  filterSvgAttributes,
  isRefusedAnimation,
  isTextOnlySvgTag,
  isUnwrappedSvgTag,
  toSvgTag,
} from './svg-policy.js';

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
  stack: OpenElements<MutableElement>;
}

/** Elements whose content is raw text, so markup inside them is never read as elements. */
const rawTextElements: ReadonlySet<string> = new Set(['script', 'style']);

const cache = createLruCache<string, SvgElementNode | null>(256);

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
  return currentOpen(state.stack);
}

/**
 * Adds text to the open element. Text outside any element is dropped, and so is whitespace-only
 * text outside a `<text>` element, where it only indents the markup; inside one it separates words.
 */
function addText(state: ParserState, text: string): void {
  if (state.stack.elements.length === 1) return;
  if (text.trim() === '' && findOpen(state.stack, ['text']) <= 0) return;
  currentElement(state).children.push({ type: 'text', text });
}

/** Closes the nearest open element named `tag`, and any left open inside it. */
function closeElement(state: ParserState, tag: string): void {
  const at = findOpen(state.stack, [tag.toLowerCase()]);
  if (at > 0) closeOpen(state.stack, at);
}

function openElement(state: ParserState, token: MarkupOpenToken): void {
  // An unwrapped element is never opened, so its closing tag finds nothing to close.
  if (isUnwrappedSvgTag(token.tag)) return;
  const tag = toSvgTag(token.tag) ?? token.tag;
  const element: MutableElement = {
    type: 'element',
    tag,
    attributes: filterSvgAttributes(tag, token.attributes),
    children: [],
  };
  currentElement(state).children.push(element);
  if (!token.isSelfClosing) pushOpen(state.stack, element, tag.toLowerCase());
}

/**
 * Whether an opening tag starts an element dropped with its content: one outside the policy, a
 * refused animation, or any element inside a text-only element.
 */
function isDroppedElement(state: ParserState, token: MarkupOpenToken): boolean {
  if (state.stack.elements.length > 1 && isTextOnlySvgTag(currentElement(state).tag)) return true;
  if (isUnwrappedSvgTag(token.tag)) return false;
  const tag = toSvgTag(token.tag);
  return tag === null || isRefusedAnimation(tag, token.attributes);
}

function parseTree(markup: string): SvgElementNode | null {
  const root: MutableElement = { type: 'element', tag: '#document', attributes: {}, children: [] };
  const state: ParserState = { root, stack: createOpenElements(root) };
  const tokens = tokenizeMarkup(markup, { rawTextElements });
  const isDropped = (token: MarkupOpenToken) => isDroppedElement(state, token);
  for (const token of skipDroppedElements(tokens, { isDropped })) {
    if (token.type === 'text') addText(state, token.text);
    else if (token.type === 'close') closeElement(state, token.tag);
    else openElement(state, token);
  }
  const svg = root.children.find(
    (child): child is MutableElement =>
      child.type === 'element' && child.tag.toLowerCase() === 'svg',
  );
  if (!svg) return null;
  return freezeNode({ ...svg, tag: 'svg' }) as SvgElementNode;
}

/**
 * Parses untrusted SVG markup into a frozen element tree rooted at its `<svg>` element. Comments,
 * processing instructions and doctypes are dropped; CDATA becomes text; entities are decoded. Only
 * the drawing elements and attributes of the safe-SVG policy survive: anything else, links outside
 * the drawing, and values that could load or run something are dropped. Results are cached by
 * markup string, keeping the most recently used entries. Null when the markup has no `<svg>` root.
 */
export function parseSvgMarkup(markup: string): SvgElementNode | null {
  const cached = cache.get(markup);
  if (cached !== undefined) return cached;
  const tree = parseTree(markup);
  cache.set(markup, tree);
  return tree;
}
