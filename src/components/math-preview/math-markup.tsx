// Renders MathML markup as React elements through the allow-list in `math-sanitize.ts`.

import { createElement, type ReactNode } from 'react';
import { isMathElement, parseMathElements, readMathAttributes } from './math-sanitize.js';

function toReact(node: Node, key: string): ReactNode {
  if (node.nodeType === 3) return node.textContent;
  if (node.nodeType !== 1) return null;
  const element = node as Element;
  const name = element.localName;
  // An element off the list is dropped with its content.
  if (!isMathElement(name)) return null;
  const children = [...element.childNodes].map((child, index) => toReact(child, String(index)));
  return createElement(name, { ...readMathAttributes(element), key }, ...children);
}

/** The `<math>` elements of MathML markup as React elements, or `null` when there are none. */
export function renderMathMarkup(markup: string): ReactNode {
  const maths = parseMathElements(markup);
  if (maths.length === 0) return null;
  return maths.map((math, index) => toReact(math, String(index)));
}
