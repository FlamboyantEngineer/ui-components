// Where an element sits in a scrolling element, in the scroller's own CSS pixels: the pixels its
// scrollTop, clientHeight and scrollHeight count, whatever scale an ancestor transform draws it at.

import { measureScale } from './element-scale.js';
import { isShadowRoot } from './is-element.js';

/** A box in a scroller's content, in the scroller's own CSS pixels. */
interface ScrollerBox {
  /** From the top of the scroller's padding box with nothing scrolled, as `scrollTop` counts. */
  top: number;
  /** From the inline-start side as `scrollLeft` counts, so negative scroll offsets carry over. */
  left: number;
  width: number;
  height: number;
}

/**
 * Where `element` sits in the content of `scroller`, in the scroller's own pixels: comparable with
 * its `scrollTop`, `scrollLeft`, `clientHeight` and `clientWidth` under any ancestor scale.
 */
export function measureInScroller(element: Element, scroller: HTMLElement): ScrollerBox {
  const view = scroller.getBoundingClientRect();
  const box = element.getBoundingClientRect();
  const scale = measureScale(scroller);
  return {
    top: (box.top - view.top) / scale.y - scroller.clientTop + scroller.scrollTop,
    left: (box.left - view.left) / scale.x - scroller.clientLeft + scroller.scrollLeft,
    width: box.width / scale.x,
    height: box.height / scale.y,
  };
}

/** The element holding a node, across a shadow root's boundary to its host. */
function composedParent(node: Node): Element | null {
  if (node.parentElement) return node.parentElement;
  const root = node.getRootNode();
  return isShadowRoot(root) ? root.host : null;
}

/** Whether an element scrolls its content vertically now. */
function scrollsVertically(element: Element): element is HTMLElement {
  const { overflowY } = getComputedStyle(element);
  return /auto|scroll|overlay/.test(overflowY) && element.scrollHeight > element.clientHeight;
}

/**
 * Scrolls `target` to the start of `boundary`, and of each scroller between them, leaving every
 * scroller outside `boundary` (the page among them) where it is, unlike `scrollIntoView`. Each
 * scroller stops the target's `scroll-margin-top` below its `scroll-padding-top`, and the scroll
 * follows the scroller's `scroll-behavior`. Positions are measured in each scroller's own pixels,
 * so an ancestor `transform: scale()` moves nothing off. `boundary` must hold `target`, across
 * shadow roots too.
 */
export function scrollToStartWithin(target: Element, boundary: HTMLElement): void {
  const margin = Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
  for (let node = composedParent(target); node; node = composedParent(node)) {
    const isBoundary = node === boundary;
    if (isBoundary || scrollsVertically(node)) {
      const scroller = node as HTMLElement;
      const padding = Number.parseFloat(getComputedStyle(scroller).scrollPaddingTop) || 0;
      const top = measureInScroller(target, scroller).top - margin - padding;
      scroller.scrollTo({ top: Math.max(0, top) });
    }
    if (isBoundary) return;
  }
}
