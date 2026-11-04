import { describe, expect, it } from 'vitest';
import { findWheelScroller } from './wheel-scroll.js';

function createScroller({
  direction = 'ltr',
  axis = 'x',
}: { direction?: 'ltr' | 'rtl'; axis?: 'x' | 'y' } = {}) {
  const boundary = document.createElement('div');
  const scroller = document.createElement('div');
  const content = document.createElement('span');
  scroller.style.direction = direction;
  scroller.style.overflowX = 'auto';
  scroller.style.overflowY = 'auto';
  Object.defineProperties(scroller, {
    clientWidth: { value: 100 },
    scrollWidth: { value: axis === 'x' ? 300 : 100 },
    clientHeight: { value: 100 },
    scrollHeight: { value: axis === 'y' ? 300 : 100 },
  });
  scroller.append(content);
  boundary.append(scroller);
  return { boundary, scroller, content };
}

describe('findWheelScroller', () => {
  describe.each([
    {
      direction: 'rtl',
      axis: 'x',
      positions: [0, -100, -200],
      owners: [true, false, true, true, false, true],
    },
    {
      direction: 'ltr',
      axis: 'x',
      positions: [0, 100, 200],
      owners: [false, true, true, true, true, false],
    },
    {
      direction: 'ltr',
      axis: 'y',
      positions: [0, 100, 200],
      owners: [false, true, true, true, true, false],
    },
    {
      direction: 'rtl',
      axis: 'y',
      positions: [0, 100, 200],
      owners: [false, true, true, true, true, false],
    },
  ] as const)('$direction $axis scrolling', ({ direction, axis, positions, owners }) => {
    it.each([
      [0, -20, 0],
      [0, 20, 1],
      [1, -20, 2],
      [1, 20, 3],
      [2, -20, 4],
      [2, 20, 5],
    ] as const)(
      'UIC-DIAGRAM-CANVAS-3.1 routes position %i and physical delta %i',
      (position, delta, owner) => {
        const { boundary, scroller, content } = createScroller({ direction, axis });
        if (axis === 'x') scroller.scrollLeft = positions[position];
        else scroller.scrollTop = positions[position];
        const step = { x: axis === 'x' ? delta : 0, y: axis === 'y' ? delta : 0 };
        expect(findWheelScroller(content, boundary, step)).toBe(owners[owner] ? scroller : null);
      },
    );
  });

  it('UIC-DIAGRAM-CANVAS-3.1 falls back from an exhausted RTL child to its LTR ancestor', () => {
    const { boundary, scroller } = createScroller();
    const child = createScroller({ direction: 'rtl' }).scroller;
    scroller.append(child);
    child.scrollLeft = -200;
    expect(findWheelScroller(child, boundary, { x: -20, y: 0 })).toBeNull();
    scroller.scrollLeft = 100;
    expect(findWheelScroller(child, boundary, { x: -20, y: 0 })).toBe(scroller);
    expect(findWheelScroller(child, boundary, { x: 20, y: 0 })).toBe(child);
  });

  it('UIC-DIAGRAM-CANVAS-3.1 leaves zero steps and axes without overflow to the canvas', () => {
    const { boundary, scroller } = createScroller({ direction: 'rtl' });
    expect(findWheelScroller(scroller, boundary, { x: 0, y: 0 })).toBeNull();
    expect(findWheelScroller(scroller, boundary, { x: 0, y: 20 })).toBeNull();
  });

  it('UIC-DIAGRAM-CANVAS-3.1 leaves hidden overflow to the canvas', () => {
    const { boundary, scroller } = createScroller({ direction: 'rtl' });
    scroller.style.overflowX = 'hidden';
    expect(findWheelScroller(scroller, boundary, { x: -20, y: 0 })).toBeNull();
  });

  it('UIC-DIAGRAM-CANVAS-3.1 excludes the boundary and targets outside it', () => {
    const { boundary, scroller } = createScroller();
    expect(findWheelScroller(scroller, scroller, { x: 20, y: 0 })).toBeNull();
    expect(findWheelScroller(document.createElement('div'), boundary, { x: 20, y: 0 })).toBeNull();
    expect(findWheelScroller(null, boundary, { x: 20, y: 0 })).toBeNull();
  });

  it('UIC-DIAGRAM-CANVAS-3.1 retains the one-pixel tolerance at the RTL end', () => {
    const { boundary, scroller } = createScroller({ direction: 'rtl' });
    scroller.scrollLeft = -198.5;
    expect(findWheelScroller(scroller, boundary, { x: -20, y: 0 })).toBe(scroller);
    scroller.scrollLeft = -199;
    expect(findWheelScroller(scroller, boundary, { x: -20, y: 0 })).toBeNull();
    expect(findWheelScroller(scroller, boundary, { x: 20, y: 0 })).toBe(scroller);
  });
});
