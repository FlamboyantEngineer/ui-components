import type { EditorView } from 'prosemirror-view';
import { isHTMLElement } from '../../utils/is-element.js';

/** The distance from `y` to a block's vertical span; zero inside it. */
function distanceTo(view: EditorView, pos: number, y: number): number {
  const dom = view.nodeDOM(pos);
  if (!isHTMLElement(dom)) return Number.POSITIVE_INFINITY;
  const { top, bottom } = dom.getBoundingClientRect();
  if (y < top) return top - y;
  return y > bottom ? y - bottom : 0;
}

/**
 * The top-level block level with the viewport `y`, or the nearest one across a gap or past either
 * end, whatever `x` is: the pointer in the gutter beside a block, or over its text, targets it.
 * Blocks run down the page in document order, so a binary search reads few boxes.
 */
export function findBlockAtY(view: EditorView, y: number): number | null {
  const { doc } = view.state;
  if (doc.childCount === 0) return null;
  const starts: number[] = [];
  doc.forEach((_node, offset) => starts.push(offset));
  let low = 0;
  let high = starts.length - 1;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    const dom = view.nodeDOM(starts[middle] ?? 0);
    const bottom = isHTMLElement(dom) ? dom.getBoundingClientRect().bottom : y;
    if (bottom < y) low = middle + 1;
    else high = middle;
  }
  const before = starts[low - 1];
  const at = starts[low] ?? 0;
  if (before === undefined) return at;
  return distanceTo(view, before, y) < distanceTo(view, at, y) ? before : at;
}
