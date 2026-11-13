// Where source offsets sit on screen, read from the highlighted copy, which lies exactly under the
// text area: the rectangle of a range, the offset under a point, and scrolling a range into view.

import { measureScale } from '../../utils/element-scale.js';
import type { CodeRange } from './code-ranges.js';

interface TextPoint {
  node: Text;
  offset: number;
}

/** The text nodes of the highlighted copy in order, with the source offset each starts at. */
export interface CopyText {
  nodes: readonly Text[];
  starts: readonly number[];
  length: number;
}

/** Reads the copy's text nodes once, for every lookup until the copy renders again. */
export function readCopyText(root: Node): CopyText {
  const walker = root.ownerDocument?.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  const starts: number[] = [];
  let length = 0;
  for (let node = walker?.nextNode(); node; node = walker?.nextNode()) {
    nodes.push(node as Text);
    starts.push(length);
    length += (node as Text).data.length;
  }
  return { nodes, starts, length };
}

/** The text node an offset falls in: the first one that ends at or after it, by bisection. */
function locate({ nodes, starts }: CopyText, offset: number): TextPoint | null {
  let low = 0;
  let high = nodes.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if ((starts[middle] ?? 0) + (nodes[middle]?.data.length ?? 0) < offset) low = middle + 1;
    else high = middle;
  }
  const node = nodes[low];
  return node ? { node, offset: offset - (starts[low] ?? 0) } : null;
}

/** The on-screen rectangle of a range of the highlighted copy, or `null` when it cannot say. */
export function measureRange(copy: CopyText, range: CodeRange): DOMRect | null {
  const from = locate(copy, range.start);
  const to = locate(copy, range.end);
  if (!from || !to) return null;
  const domRange = from.node.ownerDocument.createRange();
  domRange.setStart(from.node, from.offset);
  domRange.setEnd(to.node, to.offset);
  return typeof domRange.getBoundingClientRect === 'function'
    ? domRange.getBoundingClientRect()
    : null;
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
export function findOffsetAt(copy: CopyText, x: number, y: number): number | null {
  const { length } = copy;
  let low = 0;
  let high = length;
  while (low < high) {
    const middle = (low + high) >> 1;
    const rect = measureRange(copy, { start: middle, end: middle + 1 });
    if (!rect) return null;
    if (isBefore(rect, x, y)) low = middle + 1;
    else high = middle;
  }
  const rect = low < length ? measureRange(copy, { start: low, end: low + 1 }) : null;
  return rect && contains(rect, x, y) ? low : null;
}

/** Scrolls the text area so a range of the copy is in view; the copy follows the text area. */
export function revealRange(input: HTMLElement, highlight: HTMLElement, range: CodeRange) {
  const rect = measureRange(readCopyText(highlight), range);
  if (!rect) return;
  // The copy's own pixels, which the text area's scroll offsets count, under any ancestor scale.
  const frame = highlight.getBoundingClientRect();
  const scale = measureScale(highlight);
  const top = (rect.top - frame.top) / scale.y + highlight.scrollTop;
  const left = (rect.left - frame.left) / scale.x + highlight.scrollLeft;
  const size = { width: rect.width / scale.x, height: rect.height / scale.y };
  if (top < input.scrollTop || top + size.height > input.scrollTop + input.clientHeight) {
    input.scrollTop = Math.max(0, top - input.clientHeight / 2);
  }
  if (left < input.scrollLeft || left + size.width > input.scrollLeft + input.clientWidth) {
    input.scrollLeft = Math.max(0, left - input.clientWidth / 2);
  }
}
