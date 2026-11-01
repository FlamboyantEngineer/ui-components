import { describe, expect, it } from 'vitest';
import { measureInScroller, measureScale, toScale } from './scroll-geometry.js';

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
  it('UIC-SCROLL-REGION-4.5 reads an element scale from its box and its layout size', () => {
    expect(toScale(50, 100)).toBe(0.5);
    expect(toScale(0, 100)).toBe(1);
    expect(measureScale(scaledScroller(0.5))).toEqual({ x: 0.5, y: 0.5 });
    expect(measureScale(document.createElement('div'))).toEqual({ x: 1, y: 1 });
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
});
