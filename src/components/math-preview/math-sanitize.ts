// The MathML allow-list, without React: MathML Core elements and their presentation attributes
// are kept; everything else, links, styles, scripts and event handlers included, is dropped with its
// content. Text stays text (specs/MATH-PREVIEW.md, UIC-MATH-PREVIEW-1.4 and 3.1).

const mathNamespace = 'http://www.w3.org/1998/Math/MathML';

const elements = new Set([
  'math',
  'semantics',
  'annotation',
  'mrow',
  'mi',
  'mn',
  'mo',
  'ms',
  'mtext',
  'mspace',
  'msub',
  'msup',
  'msubsup',
  'munder',
  'mover',
  'munderover',
  'mmultiscripts',
  'mprescripts',
  'none',
  'mfrac',
  'msqrt',
  'mroot',
  'mstyle',
  'mpadded',
  'mphantom',
  'menclose',
  'merror',
  'mtable',
  'mtr',
  'mtd',
  'mlabeledtr',
]);

const attributes = new Set([
  'accent',
  'accentunder',
  'columnalign',
  'columnlines',
  'columnspacing',
  'columnspan',
  'depth',
  'display',
  'displaystyle',
  'encoding',
  'fence',
  'form',
  'frame',
  'height',
  'largeop',
  'linethickness',
  'lspace',
  'mathbackground',
  'mathcolor',
  'mathsize',
  'mathvariant',
  'maxsize',
  'minsize',
  'movablelimits',
  'notation',
  'rowalign',
  'rowlines',
  'rowspacing',
  'rowspan',
  'rspace',
  'scriptlevel',
  'separator',
  'stretchy',
  'symmetric',
  'voffset',
  'width',
]);

/** A colour attribute takes a colour word or hex value only, never a function such as `url()`. */
const colourValue = /^(#[\da-f]{3,8}|[a-z]+)$/i;

/** The allowed presentation attributes of a MathML element, by lower-case name. */
export function readMathAttributes(element: Element): Record<string, string> {
  const props: Record<string, string> = {};
  for (const { name, value } of element.attributes) {
    const lower = name.toLowerCase();
    if (!attributes.has(lower)) continue;
    if (lower.startsWith('math') && lower !== 'mathvariant' && lower !== 'mathsize') {
      if (!colourValue.test(value)) continue;
    }
    props[lower] = value;
  }
  return props;
}

/** Whether a MathML element of this local name is kept. */
export function isMathElement(name: string): boolean {
  return elements.has(name);
}

/** The `<math>` elements of markup parsed as an inert HTML document, or none without a parser. */
export function parseMathElements(markup: string, ownerDocument?: Document): Element[] {
  const Parser = ownerDocument?.defaultView?.DOMParser ?? globalThis.DOMParser;
  if (typeof Parser === 'undefined') return [];
  const parsed = new Parser().parseFromString(markup, 'text/html');
  return [...parsed.body.querySelectorAll('math')];
}

function copyAllowed(node: Node, ownerDocument: Document): Node | null {
  if (node.nodeType === 3) return ownerDocument.createTextNode(node.textContent ?? '');
  if (node.nodeType !== 1) return null;
  const source = node as Element;
  if (!elements.has(source.localName)) return null;
  const copy = ownerDocument.createElementNS(mathNamespace, source.localName);
  for (const [name, value] of Object.entries(readMathAttributes(source))) {
    copy.setAttribute(name, value);
  }
  for (const child of source.childNodes) {
    const allowed = copyAllowed(child, ownerDocument);
    if (allowed) copy.append(allowed);
  }
  return copy;
}

/**
 * The first `<math>` element of MathML markup, rebuilt in `ownerDocument` through the allow-list,
 * or `null` when the markup holds no math or no HTML parser is available.
 */
export function sanitizeMathMarkup(markup: string, ownerDocument: Document): Element | null {
  const [math] = parseMathElements(markup, ownerDocument);
  if (math === undefined) return null;
  return copyAllowed(math, ownerDocument) as Element;
}
