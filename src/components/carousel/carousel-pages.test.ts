import { describe, expect, it } from 'vitest';
import {
  type CarouselPaging,
  findPage,
  listPageStarts,
  resolveMove,
  toSlideCount,
} from './carousel-pages.js';

const threeByTwo: CarouselPaging = { count: 7, perPage: 3, perMove: 2, loop: false };

describe('carousel pages', () => {
  it('UIC-CAROUSEL-1.5 starts pages every move and ends the last page on the last slide', () => {
    expect(listPageStarts(threeByTwo)).toEqual([0, 2, 4]);
    expect(listPageStarts({ count: 8, perPage: 3, perMove: 3 })).toEqual([0, 3, 5]);
    expect(listPageStarts({ count: 4, perPage: 1, perMove: 1 })).toEqual([0, 1, 2, 3]);
    expect(listPageStarts({ count: 2, perPage: 3, perMove: 3 })).toEqual([0]);
    expect(findPage([0, 2, 4], 3)).toBe(1);
    expect(findPage([0, 2, 4], 4)).toBe(2);
  });

  it('UIC-CAROUSEL-1.5 moves by perMove, stopping at the ends or looping', () => {
    expect(resolveMove(threeByTwo, 0, 1)).toBe(2);
    expect(resolveMove(threeByTwo, 2, 1)).toBe(4);
    expect(resolveMove(threeByTwo, 4, 1)).toBeNull();
    expect(resolveMove(threeByTwo, 4, -1)).toBe(2);
    expect(resolveMove(threeByTwo, 1, -1)).toBe(0);
    expect(resolveMove(threeByTwo, 0, -1)).toBeNull();
    const looping = { ...threeByTwo, loop: true };
    expect(resolveMove(looping, 4, 1)).toBe(0);
    expect(resolveMove(looping, 0, -1)).toBe(4);
    expect(resolveMove({ ...looping, count: 3 }, 0, 1)).toBeNull();
  });

  it('UIC-CAROUSEL-1.5 counts slides as whole numbers from 1', () => {
    expect(toSlideCount(undefined)).toBe(1);
    expect(toSlideCount(0)).toBe(1);
    expect(toSlideCount(Number.NaN)).toBe(1);
    expect(toSlideCount(2.7)).toBe(2);
  });
});
