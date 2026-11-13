import { describe, expect, it } from 'vitest';
import { measureInScroller, scrollToStartWithin } from './scroll-geometry.js';

/** A scroller drawn at `scale`: 200 by 100 own pixels, a 2px border, scrolled 40 down. */
function scaledScroller(scale: number) {
  const scroller = document.createElement('div');
  Object.defineProperties(scroller, {
    offsetWidth: { value: 204 },
    offsetHeight: { value: 104 },
    clientTop: { value: 2 },
    clientLeft: { value: 2 },
    clientHeight: { value: 100 },
    clientWidth: { value: 200 },
  });
  scroller.scrollTop = 40;
  scroller.getBoundingClientRect = () =>
    ({ top: 10, left: 20, width: 204 * scale, height: 104 * scale }) as DOMRect;
  return scroller;
}

describe('scroll geometry', () => {
  it('UIC-SCROLL-REGION-4.5 reads a fractional box as unscaled, as offset sizes round', () => {
    const scroller = scaledScroller(1);
    // 104.5 pixels tall on screen while offsetHeight rounds it to 104: no scale at all.
    scroller.getBoundingClientRect = () =>
      ({ top: 10, left: 20, width: 204, height: 104.5 }) as DOMRect;
    const element = document.createElement('div');
    element.getBoundingClientRect = () =>
      ({ top: 12010, left: 22, width: 50, height: 30 }) as DOMRect;
    expect(measureInScroller(element, scroller).top).toBe(12000 - 2 + 40);
  });

  it('UIC-SCROLL-REGION-4.5 measures an element in the scroller own pixels under a scale', () => {
    for (const scale of [0.5, 1, 2]) {
      const scroller = scaledScroller(scale);
      // An element 130 own pixels into the content, 30 tall, seen with 40 scrolled away.
      const element = document.createElement('div');
      element.getBoundingClientRect = () =>
        ({
          top: 10 + (2 + 130 - 40) * scale,
          left: 20 + (2 + 8) * scale,
          width: 50 * scale,
          height: 30 * scale,
        }) as DOMRect;
      expect(measureInScroller(element, scroller)).toEqual({
        top: 130,
        left: 8,
        width: 50,
        height: 30,
      });
    }
  });

  it('UIC-OUTLINE-3.1 scrolls a target to the start of its boundary and leaves outer scrollers', () => {
    const outer = document.createElement('div');
    outer.style.overflowY = 'auto';
    Object.defineProperties(outer, { scrollHeight: { value: 900 }, clientHeight: { value: 300 } });
    outer.scrollTop = 25;
    const boundary = scaledScroller(1);
    boundary.style.scrollPaddingTop = '4px';
    const target = document.createElement('h2');
    target.style.scrollMarginTop = '40px';
    // 130 own pixels into the content, seen with 40 scrolled away.
    target.getBoundingClientRect = () =>
      ({ top: 10 + 2 + 130 - 40, left: 30, width: 50, height: 20 }) as DOMRect;
    const scrolls: { element: string; top: number }[] = [];
    for (const [element, name] of [
      [outer, 'outer'],
      [boundary, 'boundary'],
    ] as const) {
      element.scrollTo = ((options: ScrollToOptions) =>
        scrolls.push({ element: name, top: options.top ?? 0 })) as typeof element.scrollTo;
    }
    outer.append(boundary);
    boundary.append(target);
    document.body.append(outer);
    scrollToStartWithin(target, boundary);
    // The heading's 130px, less its 40px margin and the scroller's 4px padding.
    expect(scrolls).toEqual([{ element: 'boundary', top: 86 }]);
    expect(outer.scrollTop).toBe(25);
    outer.remove();
  });
});
