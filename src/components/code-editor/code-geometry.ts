// Where source offsets sit on screen, read from the highlighted copy, which lies exactly under the
// text area: the rectangle of a range, the offset under a point, and scrolling a range into view.

import type { CodeRange } from './code-ranges.js';

interface TextPoint {
  node: Text;
  offset: number;
}

function collectTextNodes(root: Node): Text[] {
  const walker = root.ownerDocument?.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  for (let node = walker?.nextNode(); node; node = walker?.nextNode()) nodes.push(node as Text);
  return nodes;
}

function locate(nodes: readonly Text[], offset: number): TextPoint | null {
  let start = 0;
  for (const node of nodes) {
    const length = node.data.length;
    if (offset <= start + length) return { node, offset: offset - start };
    start += length;
  }
  return null;
}

function measure(nodes: readonly Text[], range: CodeRange): DOMRect | null {
  const from = locate(nodes, range.start);
  const to = locate(nodes, range.end);
  if (!from || !to) return null;
  const domRange = from.node.ownerDocument.createRange();
  domRange.setStart(from.node, from.offset);
  domRange.setEnd(to.node, to.offset);
  return typeof domRange.getBoundingClientRect === 'function'
    ? domRange.getBoundingClientRect()
    : null;
}

/** The on-screen rectangle of a range of the highlighted copy, or `null` when it cannot say. */
export function measureRange(highlight: HTMLElement, range: CodeRange): DOMRect | null {
  return measure(collectTextNodes(highlight), range);
}

function isBefore(rect: DOMRect, x: number, y: number): boolean {
  return rect.bottom <= y || (rect.top <= y && rect.right <= x);
}

function contains(rect: DOMRect, x: number, y: number): boolean {
  return x >= rect.left && x < rect.right && y >= rect.top && y < rect.bottom;
}

/**
 * The offset of the character under a point, found by bisecting the copy's characters in reading
 * order; `null` over no character, such as past the end of a line.
 */
export function findOffsetAt(highlight: HTMLElement, x: number, y: number): number | null {
  const nodes = collectTextNodes(highlight);
  const length = nodes.reduce((sum, node) => sum + node.data.length, 0);
  let low = 0;
  let high = length;
  while (low < high) {
    const middle = (low + high) >> 1;
    const rect = measure(nodes, { start: middle, end: middle + 1 });
    if (!rect) return null;
    if (isBefore(rect, x, y)) low = middle + 1;
    else high = middle;
  }
  const rect = low < length ? measure(nodes, { start: low, end: low + 1 }) : null;
  return rect && contains(rect, x, y) ? low : null;
}

/** Scrolls the text area so a range of the copy is in view; the copy follows the text area. */
export function revealRange(input: HTMLElement, highlight: HTMLElement, range: CodeRange) {
  const rect = measureRange(highlight, range);
  if (!rect) return;
  const frame = highlight.getBoundingClientRect();
  const top = rect.top - frame.top + highlight.scrollTop;
  const left = rect.left - frame.left + highlight.scrollLeft;
  if (top < input.scrollTop || top + rect.height > input.scrollTop + input.clientHeight) {
    input.scrollTop = Math.max(0, top - input.clientHeight / 2);
  }
  if (left < input.scrollLeft || left + rect.width > input.scrollLeft + input.clientWidth) {
    input.scrollLeft = Math.max(0, left - input.clientWidth / 2);
  }
}
