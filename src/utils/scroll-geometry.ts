// Where an element sits in a scrolling element, in the scroller's own CSS pixels: the pixels its
// scrollTop, clientHeight and scrollHeight count, whatever scale an ancestor transform draws it at.

/** The scale from an element's own CSS pixels to viewport pixels, 1 for an unlaid-out side. */
export function toScale(viewportSize: number, ownSize: number): number {
  return viewportSize > 0 && ownSize > 0 ? viewportSize / ownSize : 1;
}

/** How many viewport pixels one of an element's own CSS pixels spans, across and down. */
export interface ElementScale {
  x: number;
  y: number;
}

/** The scale an element is drawn at: its viewport box against its own layout size. */
export function measureScale(element: HTMLElement): ElementScale {
  const box = element.getBoundingClientRect();
  return {
    x: toScale(box.width, element.offsetWidth),
    y: toScale(box.height, element.offsetHeight),
  };
}

/** A box in a scroller's content, in the scroller's own CSS pixels. */
export interface ScrollerBox {
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
