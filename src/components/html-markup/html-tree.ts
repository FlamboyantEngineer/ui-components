// Builds the element tree of an HTML fragment from markup tokens, closing elements the way an HTML
// parser implies (specs/HTML-MARKUP.md). Policy filtering happens afterwards in sanitize-html.ts.

import { skipDroppedElements, tokenizeMarkup, type MarkupOpenToken } from '../../utils/markup.js';
import { requireDefined } from '../../utils/require-defined.js';
import {
  closeOpen,
  createOpenElements,
  currentOpen,
  findOpen,
  pushOpen,
  type OpenElements,
} from '../../utils/open-elements.js';
import {
  fosterElement,
  prepareTablePart,
  reconcileTablePolicy,
  tableContexts,
  tableParts,
} from './html-table.js';

export interface RawElement {
  tag: string;
  attributes: Readonly<Record<string, string>>;
  children: RawNode[];
  /** Kept as content only: its tag could not survive a parse of the server HTML. */
  isUnwrapped?: boolean;
}

export type RawNode = RawElement | string;

interface ImpliedEnd {
  /** Open elements the new one closes. */
  closes: ReadonlySet<string>;
  /** Open elements that bound the search: nothing below them is closed. */
  stopAt: ReadonlySet<string>;
}

/** Elements dropped with all their content, whatever the policy allows. */
const blockedElements: ReadonlySet<string> = new Set([
  'applet',
  'base',
  'embed',
  'frame',
  'frameset',
  'iframe',
  'link',
  'math',
  'meta',
  'noembed',
  'noframes',
  'noscript',
  'object',
  'plaintext',
  'script',
  'select',
  'style',
  'svg',
  'template',
  'textarea',
  'title',
  'xmp',
]);

const voidElements = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

/**
 * Blocked elements whose content an HTML parser reads as text, so their markup is never parsed.
 * The content of the other blocked elements is read only to find their matching closing tag.
 */
const rawTextElements: ReadonlySet<string> = new Set([
  'iframe',
  'noembed',
  'noframes',
  'noscript',
  'plaintext',
  'script',
  'style',
  'textarea',
  'title',
  'xmp',
]);

const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

/** Elements that close an open paragraph. */
const paragraphClosers = new Set([
  ...headings,
  ...'address article aside blockquote dd details div dl dt fieldset figcaption figure footer form header hr li main nav ol p pre section summary table ul'.split(
    ' ',
  ),
]);

function impliedEnd(closes: string, stopAt: string): ImpliedEnd {
  return { closes: new Set(closes.split(' ')), stopAt: new Set(stopAt.split(' ')) };
}

const paragraphEnd = impliedEnd('p', 'table td th caption button');

/** The elements that close open ones on opening; a Map, so only declared names have a rule. */
const impliedEnds: ReadonlyMap<string, ImpliedEnd> = new Map([
  ['li', impliedEnd('li', 'ul ol table td th')],
  ['dt', impliedEnd('dt dd', 'dl table td th')],
  ['dd', impliedEnd('dt dd', 'dl table td th')],
  ['a', impliedEnd('a', 'table td th')],
  ...headings.map((tag) => [tag, impliedEnd(headings.join(' '), 'p table')] as const),
]);

type Stack = OpenElements<RawElement>;

interface StructureLevel {
  iterator: Iterator<RawNode>;
  depth: number;
  table: RawElement | null;
}

function hasImpliedEnd(stack: Stack, rule: ImpliedEnd): boolean {
  const at = findOpen(stack, rule.closes);
  return at > 0 && at >= findOpen(stack, rule.stopAt);
}

/** Closes the nearest open element the rule names, unless a boundary comes first. */
function applyImpliedEnd(stack: Stack, rule: ImpliedEnd): void {
  if (hasImpliedEnd(stack, rule)) closeOpen(stack, findOpen(stack, rule.closes));
}

function closesEmittedAncestor(stack: Stack, tag: string): boolean {
  if (paragraphClosers.has(tag) && hasImpliedEnd(stack, paragraphEnd)) return true;
  const rule = impliedEnds.get(tag);
  if (!rule) return false;
  // A heading's opening tag closes only a heading it opens directly in.
  return headings.includes(tag)
    ? headings.includes(currentOpen(stack).tag)
    : hasImpliedEnd(stack, rule);
}

function appendElement(stack: Stack, element: RawElement): void {
  currentOpen(stack).children.push(element);
}

/**
 * Whether an element placed before a table would close an open element when the server HTML is
 * parsed again: there the table no longer stands between them. A heading closes only a heading it
 * opens directly in; the other rules close the nearest open element they name, up to a boundary.
 */
function closesOnReparse(stack: Stack, tag: string, rule: ImpliedEnd): boolean {
  const tables = stack.positions.get('table') ?? [];
  const table = tables.at(-1) ?? 0;
  if (headings.includes(tag)) return headings.includes(stack.elements[table - 1]?.tag ?? '');
  const stopAt = [...rule.stopAt].filter((name) => name !== 'table');
  const at = findOpen(stack, rule.closes);
  return at > 0 && at >= Math.max(findOpen(stack, stopAt), tables.at(-2) ?? -1);
}

function openElement(stack: Stack, token: MarkupOpenToken): void {
  const tag = token.tag.toLowerCase();
  const element: RawElement = { tag, attributes: token.attributes, children: [] };
  if (tableParts.has(tag)) {
    if (!prepareTablePart(stack, tag)) return;
    appendElement(stack, element);
  } else {
    if (paragraphClosers.has(tag)) applyImpliedEnd(stack, paragraphEnd);
    const rule = impliedEnds.get(tag);
    if (rule) applyImpliedEnd(stack, rule);
    if (!fosterElement(stack, element)) appendElement(stack, element);
    else if (rule && closesOnReparse(stack, tag, rule)) element.isUnwrapped = true;
  }
  if (!token.isSelfClosing && !voidElements.has(tag)) pushOpen(stack, element, tag);
}

function closeElement(stack: Stack, tag: string): void {
  const at = findOpen(stack, [tag]);
  if (at > 0) closeOpen(stack, at);
}

function addText(stack: Stack, text: string): void {
  const parent = currentOpen(stack);
  if (tableContexts.has(parent.tag)) return;
  const last = parent.children[parent.children.length - 1];
  if (typeof last === 'string') parent.children[parent.children.length - 1] = last + text;
  else parent.children.push(text);
}

/**
 * Reads an HTML fragment into a tree of lower-case elements and text. Blocked elements are skipped
 * with their content (nested ones of the same name included), void elements take no children, and
 * an element closes the open elements an HTML parser would close (a paragraph before a block, a
 * list item before the next one, table parts before their siblings); a stray closing tag is ignored.
 */
export function buildHtmlTree(markup: string): RawNode[] {
  const root: RawElement = { tag: '#fragment', attributes: {}, children: [] };
  const stack = createOpenElements(root);
  const tokens = skipDroppedElements(
    tokenizeMarkup(markup, { rawTextElements, references: 'html' }),
    {
      isDropped: (token) => blockedElements.has(token.tag.toLowerCase()),
      isEmpty: (token) => token.isSelfClosing || voidElements.has(token.tag.toLowerCase()),
    },
  );
  for (const token of tokens) {
    if (token.type === 'text') addText(stack, token.text);
    else if (token.type === 'close') closeElement(stack, token.tag.toLowerCase());
    else openElement(stack, token);
  }
  return root.children;
}

/**
 * Filtering can remove a boundary that protected an ancestor from an implied close. Keep only
 * the conflicting tag's content. A table removed here must also lose its own scaffold; nested
 * tables own their structure independently. Both passes are iterative and visit each node once.
 */
export function reconcileHtmlTree(nodes: readonly RawNode[], elements: ReadonlySet<string>): void {
  reconcileTablePolicy(nodes, elements);
  const stack = createOpenElements<RawElement>({ tag: '#fragment', attributes: {}, children: [] });
  const levels: StructureLevel[] = [{ iterator: nodes[Symbol.iterator](), depth: 1, table: null }];
  while (levels.length > 0) {
    const level = requireDefined(levels.at(-1));
    const next = level.iterator.next();
    if (next.done) {
      closeOpen(stack, level.depth);
      levels.pop();
      continue;
    }
    const node = next.value;
    if (typeof node === 'string') continue;
    const table = node.tag === 'table' ? node : level.table;
    if (tableParts.has(node.tag) && table && (table.isUnwrapped || !elements.has('table'))) {
      node.isUnwrapped = true;
    }
    const depth = stack.elements.length;
    if (!node.isUnwrapped && elements.has(node.tag)) {
      if (closesEmittedAncestor(stack, node.tag)) node.isUnwrapped = true;
      else pushOpen(stack, node, node.tag);
    }
    levels.push({ iterator: node.children[Symbol.iterator](), depth, table });
  }
}
