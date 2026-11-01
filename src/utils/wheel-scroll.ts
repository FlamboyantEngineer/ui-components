// Wheel input as pixels, and the scroller inside a container that a wheel step should scroll before
// the container handles the wheel itself.

import { getOwnerWindow } from './owner-window.js';

/** The pixels one line of wheel input stands for. */
const wheelLineHeight = 16;

/** A wheel event's travel in pixels: lines count 16 pixels and pages the `page` size. */
export function toWheelPixels(
  event: Pick<WheelEvent, 'deltaX' | 'deltaY' | 'deltaMode'>,
  page: { width: number; height: number },
): { x: number; y: number } {
  if (event.deltaMode === 1) {
    return { x: event.deltaX * wheelLineHeight, y: event.deltaY * wheelLineHeight };
  }
  if (event.deltaMode === 2) return { x: event.deltaX * page.width, y: event.deltaY * page.height };
  return { x: event.deltaX, y: event.deltaY };
}

const scrollingOverflow = new Set(['auto', 'scroll', 'overlay']);

/** Whether `element` scrolls along one axis and has room left in the direction of `delta`. */
function hasRoom(
  delta: number,
  {
    overflow,
    position,
    size,
    extent,
  }: { overflow: string; position: number; size: number; extent: number },
): boolean {
  if (delta === 0 || !scrollingOverflow.has(overflow) || extent <= size) return false;
  const travelled = Math.abs(position);
  return delta > 0 ? travelled + size < extent - 1 : travelled > 0;
}

/**
 * The nearest element from `target` up to, but not including, `boundary` that can still scroll by
 * `step`, so it keeps the wheel; null when none can, and the boundary may take the wheel.
 */
export function findWheelScroller(
  target: EventTarget | null,
  boundary: Element,
  step: { x: number; y: number },
): Element | null {
  const view = getOwnerWindow(boundary);
  let node = target instanceof view.Element ? target : null;
  while (node && node !== boundary && boundary.contains(node)) {
    const style = view.getComputedStyle(node);
    // A text area scrolls its own text whatever the stylesheet says.
    const isTextArea = node.localName === 'textarea';
    const canScrollY = hasRoom(step.y, {
      overflow: isTextArea ? 'auto' : style.overflowY,
      position: node.scrollTop,
      size: node.clientHeight,
      extent: node.scrollHeight,
    });
    const canScrollX = hasRoom(step.x, {
      overflow: isTextArea ? 'auto' : style.overflowX,
      position: node.scrollLeft,
      size: node.clientWidth,
      extent: node.scrollWidth,
    });
    if (canScrollY || canScrollX) return node;
    node = node.parentElement;
  }
  return null;
}
