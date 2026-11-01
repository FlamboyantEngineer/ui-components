// An allowlist HTML sanitizer that returns a plain, frozen tree instead of markup
// (specs/HTML-MARKUP.md). It never touches the DOM, so it also runs on the server.

import { requireDefined } from '../../utils/require-defined.js';
import { defaultUrlSchemes, isSafeUrl } from '../../utils/safe-url.js';
import { buildHtmlTree, type RawElement, type RawNode } from './html-tree.js';
import { mergeSafeRel } from '../../utils/merge-safe-rel.js';

export interface HtmlElementNode {
  readonly type: 'element';
  /** The tag name, in lower case. */
  readonly tag: string;
  /** The attributes the policy kept, lower-case names, entities decoded. */
  readonly attributes: Readonly<Record<string, string>>;
  readonly children: readonly HtmlNode[];
}

export interface HtmlTextNode {
  readonly type: 'text';
  readonly text: string;
}

export type HtmlNode = HtmlElementNode | HtmlTextNode;

interface FilterLevel {
  iterator: Iterator<RawNode>;
  output: HtmlNode[];
  element: RawElement | null;
}

/** What `sanitizeHtml` keeps. Names are lower case. */
export interface HtmlPolicy {
  /** Elements kept. Any other element is unwrapped: its content stays in its place. */
  elements: readonly string[];
  /** Attributes kept on kept elements. A name ending in `*` keeps every name it starts (`data-*`). */
  attributes: readonly string[];
  /** URL schemes allowed in URL attributes (`href`, `src`, `cite`, …); relative URLs always pass. */
  schemes: readonly string[];
}

/** The policy `sanitizeHtml` and `HtmlMarkup` use unless given another: rich text, no forms. */
export const defaultHtmlPolicy: HtmlPolicy = Object.freeze({
  elements: Object.freeze(
    [
      'a abbr b bdi bdo blockquote br caption cite code col colgroup dd del details dfn div dl dt em',
      'figcaption figure h1 h2 h3 h4 h5 h6 hr i img ins kbd li mark ol p pre q s samp small span',
      'strong sub summary sup table tbody td tfoot th thead time tr u ul var wbr',
    ]
      .join(' ')
      .split(' '),
  ),
  attributes: Object.freeze(
    [
      'abbr alt cite class colspan data-* datetime dir headers height href lang open rel reversed',
      'rowspan scope span src start target title type width',
    ]
      .join(' ')
      .split(' '),
  ),
  schemes: defaultUrlSchemes,
});

/** Attributes dropped whatever the policy allows: inline styles and embedded documents. */
const blockedAttributes = new Set(['style', 'srcdoc']);

const urlAttributes = new Set([
  'action',
  'background',
  'cite',
  'formaction',
  'href',
  'longdesc',
  'poster',
  'src',
  'xlink:href',
]);

function isAllowedName(name: string, allowed: readonly string[]): boolean {
  return allowed.some((entry) =>
    entry.endsWith('*') ? name.startsWith(entry.slice(0, -1)) : entry === name,
  );
}

function isSafeAttributeValue(name: string, value: string, schemes: readonly string[]): boolean {
  if (name === 'srcset') {
    return value
      .split(',')
      .every((candidate) => isSafeUrl(candidate.trim().split(/\s+/)[0] ?? '', schemes));
  }
  return !urlAttributes.has(name) || isSafeUrl(value, schemes);
}

/** Library hook classes (`ui-…`) are not the content's to claim. */
function filterClassName(value: string): string {
  return value
    .split(/\s+/)
    .filter((token) => token && !token.startsWith('ui-'))
    .join(' ');
}

function withSafeRel(attributes: Record<string, string>): Record<string, string> {
  const rel = mergeSafeRel(attributes.target, attributes.rel);
  return rel === undefined ? attributes : { ...attributes, rel };
}

function filterAttributes(element: RawElement, policy: HtmlPolicy): Record<string, string> {
  const kept: Record<string, string> = {};
  for (const [rawName, rawValue] of Object.entries(element.attributes)) {
    const name = rawName.toLowerCase();
    if (name.startsWith('on') || blockedAttributes.has(name) || Object.hasOwn(kept, name)) continue;
    if (!isAllowedName(name, policy.attributes)) continue;
    if (!isSafeAttributeValue(name, rawValue, policy.schemes)) continue;
    const value = name === 'class' ? filterClassName(rawValue) : rawValue;
    if (name === 'class' && !value) continue;
    kept[name] = value;
  }
  return element.tag === 'a' ? withSafeRel(kept) : kept;
}

function filterNodes(nodes: readonly RawNode[], policy: HtmlPolicy): HtmlNode[] {
  const output: HtmlNode[] = [];
  const elements = new Set(policy.elements);
  const levels: FilterLevel[] = [{ iterator: nodes[Symbol.iterator](), output, element: null }];
  while (levels.length > 0) {
    const level = requireDefined(levels.at(-1));
    const next = level.iterator.next();
    if (next.done) {
      levels.pop();
      if (level.element) {
        requireDefined(levels.at(-1)).output.push(
          Object.freeze({
            type: 'element',
            tag: level.element.tag,
            attributes: Object.freeze(filterAttributes(level.element, policy)),
            children: Object.freeze(level.output),
          }),
        );
      }
      continue;
    }
    const node = next.value;
    if (typeof node === 'string') {
      level.output.push(Object.freeze({ type: 'text', text: node }));
      continue;
    }
    const isAllowed = !node.isUnwrapped && elements.has(node.tag);
    levels.push({
      iterator: node.children[Symbol.iterator](),
      output: isAllowed ? [] : level.output,
      element: isAllowed ? node : null,
    });
  }
  return output;
}

/**
 * Sanitizes an HTML fragment into a frozen tree of the elements and attributes `policy` allows.
 * Scripts, styles, frames, embedded objects and form fields are dropped with their content; other
 * elements outside the policy are unwrapped. Event handlers, inline styles, unsafe URLs and `ui-`
 * classes are dropped, and a link that opens a new tab gets `rel="noopener noreferrer"`.
 */
export function sanitizeHtml(
  markup: string,
  policy: HtmlPolicy = defaultHtmlPolicy,
): readonly HtmlNode[] {
  return Object.freeze(filterNodes(buildHtmlTree(markup), policy));
}
