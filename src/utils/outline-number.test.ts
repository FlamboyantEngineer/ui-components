import { describe, expect, it } from 'vitest';
import { formatOutlineNumber } from './outline-number.js';

describe('formatOutlineNumber', () => {
  it('UIC-OUTLINE-NUMBER-1.1 numbers each level from one and joins the levels with dots', () => {
    expect(formatOutlineNumber([0])).toBe('1');
    expect(formatOutlineNumber([0, 1])).toBe('1.2');
    expect(formatOutlineNumber([0, 1, 2])).toBe('1.2.3');
    expect(formatOutlineNumber([11, 0, 9])).toBe('12.1.10');
    expect(formatOutlineNumber([])).toBe('');
  });

  it('UIC-OUTLINE-NUMBER-1.1 reads positions as whole numbers of at least zero', () => {
    expect(formatOutlineNumber([1.8, -3])).toBe('2.1');
  });

  it('UIC-OUTLINE-NUMBER-1.2 writes each level in its style and repeats the last style deeper', () => {
    expect(
      formatOutlineNumber([2, 3, 8, 0], {
        styles: ['upper-roman', 'upper-alpha', 'decimal', 'lower-alpha'],
      }),
    ).toBe('III.D.9.a');
    expect(formatOutlineNumber([0, 1, 2, 3], { styles: ['decimal', 'lower-roman'] })).toBe(
      '1.ii.iii.iv',
    );
    expect(formatOutlineNumber([25, 26, 701, 702], { styles: ['lower-alpha'] })).toBe(
      'z.aa.zz.aaa',
    );
    expect(formatOutlineNumber([3, 8, 13, 39, 1993], { styles: ['lower-roman'] })).toBe(
      'iv.ix.xiv.xl.mcmxciv',
    );
    expect(formatOutlineNumber([3998, 3999], { styles: ['upper-roman'] })).toBe('MMMCMXCIX.4000');
    expect(formatOutlineNumber([0], { styles: [] })).toBe('1');
  });

  it('UIC-OUTLINE-NUMBER-1.3 starts every level at the start number and joins with the separator', () => {
    expect(formatOutlineNumber([0, 1, 2], { start: 0 })).toBe('0.1.2');
    expect(formatOutlineNumber([0, 0], { start: 0, styles: ['upper-alpha', 'decimal'] })).toBe(
      '0.0',
    );
    expect(
      formatOutlineNumber([0, 4], { styles: ['upper-alpha', 'decimal'], separator: '-' }),
    ).toBe('A-5');
  });
});
