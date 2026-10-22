import { describe, expect, it, vi } from 'vitest';
import { resolveAmountShares } from './resolve-amount-shares.js';

const read = (value: number) => value;

describe('resolveAmountShares', () => {
  it('UIC-CHART-7.1 UIC-SEGMENTED-BAR-1.2 preserves proportions when finite amounts overflow their sum', () => {
    const values = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE / 2];
    const resolved = resolveAmountShares(values, read);
    expect(resolved.total).toBe(Infinity);
    expect(resolved.amounts.map(({ value }) => value)).toEqual(values);
    expect(resolved.amounts.map(({ share }) => share)).toEqual([0.4, 0.4, 0.2]);
  });

  it('UIC-CHART-7.1 UIC-SEGMENTED-BAR-1.2 keeps subnormal amounts and zeroes invalid values', () => {
    const resolved = resolveAmountShares(
      [Number.MIN_VALUE, Number.MIN_VALUE, 0, -1, NaN, Infinity],
      read,
    );
    expect(resolved.total).toBe(Number.MIN_VALUE * 2);
    expect(resolved.amounts.map(({ share }) => share)).toEqual([0.5, 0.5, 0, 0, 0, 0]);
    expect(resolveAmountShares([], read)).toEqual({ amounts: [], total: 0 });
    expect(
      resolveAmountShares([0, NaN, -Infinity], read).amounts.map(({ share }) => share),
    ).toEqual([0, 0, 0]);
  });

  it('UIC-SEGMENTED-BAR-1.2 respects a finite explicit whole without lowering the sum', () => {
    expect(
      resolveAmountShares([Number.MIN_VALUE], read, Number.MIN_VALUE * 2).amounts[0]?.share,
    ).toBe(0.5);
    expect(
      resolveAmountShares([Number.MAX_VALUE / 2], read, Number.MAX_VALUE).amounts[0]?.share,
    ).toBe(0.5);
    expect(
      resolveAmountShares([Number.MAX_VALUE, Number.MAX_VALUE], read, Number.MAX_VALUE).amounts.map(
        ({ share }) => share,
      ),
    ).toEqual([0.5, 0.5]);
    expect(resolveAmountShares([1, 2], read, Infinity).total).toBe(3);
    expect(resolveAmountShares([], read, 10)).toEqual({ amounts: [], total: 10 });
  });

  it('UIC-CHART-7.1 UIC-SEGMENTED-BAR-1.2 reads each amount once and retains ordinary rounding', () => {
    const getValue = vi.fn(read);
    const values = [0.1, 0.2, 0.3];
    const resolved = resolveAmountShares(values, getValue);
    const total = values.reduce((sum, value) => sum + value, 0);
    expect(resolved.total).toBe(total);
    expect(resolved.amounts.map(({ share }) => share)).toEqual(
      values.map((value) => value / total),
    );
    expect(getValue).toHaveBeenCalledTimes(values.length);
  });
});
