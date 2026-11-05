// Renders MathML markup through an allow-list: MathML Core elements and their presentation
// attributes become React elements; everything else, links, styles, scripts and event handlers
// included, is dropped. Text stays text.

import { createElement, type ReactNode } from 'react';

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

function readAttributes(element: Element, key: string) {
  const props: Record<string, string> = { key };
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

function toReact(node: Node, key: string): ReactNode {
  if (node.nodeType === 3) return node.textContent;
  if (node.nodeType !== 1) return null;
  const element = node as Element;
  const name = element.localName;
  // An element off the list is dropped with its content.
  if (!elements.has(name)) return null;
  const children = [...element.childNodes].map((child, index) => toReact(child, String(index)));
  return createElement(name, readAttributes(element, key), ...children);
}

/** The `<math>` elements of MathML markup as React elements, or `null` when there are none. */
export function renderMathMarkup(markup: string): ReactNode {
  if (typeof DOMParser === 'undefined') return null;
  const document = new DOMParser().parseFromString(markup, 'text/html');
  const maths = [...document.body.querySelectorAll('math')];
  if (maths.length === 0) return null;
  return maths.map((math, index) => toReact(math, String(index)));
}
