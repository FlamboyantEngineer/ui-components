import { describe, expect, it } from 'vitest';
import { measureScale, toLocalPoint } from './element-scale.js';

/** A div whose layout size and client rect are set, as a scaled ancestor would leave them. */
function scaled(layout: { width: number; height: number }, rect: DOMRect) {
  const element = document.createElement('div');
  Object.defineProperties(element, {
    offsetWidth: { value: layout.width },
    offsetHeight: { value: layout.height },
  });
  element.getBoundingClientRect = () => rect;
  return element;
}

describe('measureScale', () => {
  it('UIC-SPLIT-VIEW-3.3 reads viewport pixels per layout pixel on each axis', () => {
    const element = scaled({ width: 200, height: 100 }, new DOMRect(10, 20, 300, 50));
    expect(measureScale(element)).toEqual({ x: 1.5, y: 0.5 });
    expect(toLocalPoint(element, { x: 160, y: 45 })).toEqual({ x: 100, y: 50 });
  });

  it('UIC-SPLIT-VIEW-3.3 counts sizes within whole-pixel rounding, no size or no element as unscaled', () => {
    expect(
      measureScale(scaled({ width: 200, height: 100 }, new DOMRect(0, 0, 200.4, 99.6))),
    ).toEqual({ x: 1, y: 1 });
    expect(measureScale(scaled({ width: 0, height: 0 }, new DOMRect(0, 0, 0, 0)))).toEqual({
      x: 1,
      y: 1,
    });
    expect(measureScale(null)).toEqual({ x: 1, y: 1 });
    expect(toLocalPoint(null, { x: 3, y: 4 })).toEqual({ x: 3, y: 4 });
  });
});
