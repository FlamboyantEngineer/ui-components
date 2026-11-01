// How an ancestor's transform scales an element on screen. Pointer events and client rects are in
// viewport pixels, while sizes, offsets and measured properties are in the element's own layout
// pixels; an axis-aligned `transform: scale()` between them makes one viewport pixel worth less or
// more than one layout pixel.

import { isHTMLElement } from './is-element.js';

/** Viewport pixels per layout pixel of an element, on each axis. */
export interface ElementScale {
  x: number;
  y: number;
}

const unscaled: ElementScale = { x: 1, y: 1 };

/** Viewport pixels per layout pixel along one axis; 1 within `offset*`'s whole-pixel rounding. */
function axisScale(rendered: number, layout: number): number {
  if (layout <= 0 || Math.abs(rendered - layout) < 1) return 1;
  return rendered / layout;
}

/**
 * How many viewport pixels one layout pixel of `element` covers on each axis: its client rect over
 * its layout size. An element with no layout size, or none at all, counts as unscaled.
 */
export function measureScale(element: Element | null | undefined): ElementScale {
  if (!element || !isHTMLElement(element)) return unscaled;
  const rect = element.getBoundingClientRect();
  return {
    x: axisScale(rect.width, element.offsetWidth),
    y: axisScale(rect.height, element.offsetHeight),
  };
}

/** A viewport point as layout pixels from `element`'s top left corner. */
export function toLocalPoint(
  element: Element | null | undefined,
  point: { x: number; y: number },
): { x: number; y: number } {
  if (!element) return point;
  const box = element.getBoundingClientRect();
  const scale = measureScale(element);
  return { x: (point.x - box.left) / scale.x, y: (point.y - box.top) / scale.y };
}
