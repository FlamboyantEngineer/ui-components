import type { Orientation } from '../core/props.js';

/** Whether more than one pixel of the element's content lies past its box along `axis`. */
export function isOverflowing(element: Element, axis: Orientation): boolean {
  return axis === 'vertical'
    ? element.scrollHeight > element.clientHeight + 1
    : element.scrollWidth > element.clientWidth + 1;
}
