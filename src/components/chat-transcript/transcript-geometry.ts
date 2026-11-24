import { measureInScroller } from '../../utils/scroll-geometry.js';

/** Where a revealed message sits: just into view, at the top, or in the middle. */
export type RevealAlignment = 'nearest' | 'start' | 'center';

/** The viewport's paddings, inside which the content starts and ends. */
export function readViewportPadding(viewport: HTMLElement): { top: number; bottom: number } {
  const style = viewport.ownerDocument.defaultView?.getComputedStyle(viewport);
  return {
    top: Number.parseFloat(style?.paddingTop ?? '') || 0,
    bottom: Number.parseFloat(style?.paddingBottom ?? '') || 0,
  };
}

/**
 * How far an element's top edge sits below the top of the viewport's padding box, and its height,
 * in the viewport's own pixels under any ancestor scale.
 */
export function readOffsetBox(
  element: Element,
  viewport: HTMLElement,
): { top: number; height: number } {
  const box = measureInScroller(element, viewport);
  return { top: box.top - viewport.scrollTop, height: box.height };
}

/** How far an element's top edge sits below the top of the viewport's padding box, in pixels. */
export function readOffset(element: Element, viewport: HTMLElement): number {
  return readOffsetBox(element, viewport).top;
}

/** How far the viewport is from its bottom, in pixels. */
export function readDistanceToBottom(viewport: HTMLElement): number {
  return viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop;
}

/** The scroll position that puts the element's top at the top of the viewport's content box. */
export function resolveTopAlignment(element: Element, viewport: HTMLElement): number {
  return viewport.scrollTop + readOffset(element, viewport) - readViewportPadding(viewport).top;
}

/**
 * The scroll position that brings an element into view: its top at the top (`start`, and for an
 * element taller than the view), centred, or moved just far enough to show it whole (`nearest`).
 */
export function resolveReveal(
  element: Element,
  viewport: HTMLElement,
  align: RevealAlignment,
): number {
  const padding = readViewportPadding(viewport);
  const { top, height } = readOffsetBox(element, viewport);
  const room = viewport.clientHeight - padding.top - padding.bottom;
  const start = viewport.scrollTop + top - padding.top;
  if (align === 'start' || height >= room) return start;
  if (align === 'center') return start - (room - height) / 2;
  if (top < padding.top) return start;
  const overflow = top + height - (viewport.clientHeight - padding.bottom);
  return overflow > 0 ? viewport.scrollTop + overflow : viewport.scrollTop;
}

/**
 * The index of the first element whose bottom edge is below the viewport's top, among elements in
 * document order, or -1. Their edges only grow down the list, so the search halves it each step.
 */
export function findFirstVisible(elements: readonly Element[], viewport: HTMLElement): number {
  let low = 0;
  let high = elements.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    const element = elements[middle] as Element;
    const box = readOffsetBox(element, viewport);
    const bottom = box.top + box.height;
    if (bottom > 0) high = middle;
    else low = middle + 1;
  }
  return low < elements.length ? low : -1;
}

/** The index of the last element whose top edge is above the viewport's bottom, or -1. */
export function findLastVisible(elements: readonly Element[], viewport: HTMLElement): number {
  let low = 0;
  let high = elements.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if (readOffset(elements[middle] as Element, viewport) < viewport.clientHeight) low = middle + 1;
    else high = middle;
  }
  return low - 1;
}
