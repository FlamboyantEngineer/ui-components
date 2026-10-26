import { describe, expect, it } from 'vitest';
import { summarizeNumbers } from './summarize-numbers.js';

describe('summarizeNumbers', () => {
  it('UIC-TABLE-13.5 UIC-PIVOT-TABLE-1.2 reads finite numbers without coercing missing values', () => {
    expect(summarizeNumbers([3, null, '', '4', NaN, Infinity, -Infinity, -2, 0])).toEqual({
      count: 3,
      sum: 1,
      min: -2,
      max: 3,
    });
    expect(summarizeNumbers([])).toEqual({ count: 0, sum: 0, min: Infinity, max: -Infinity });
    const zeros = summarizeNumbers([0, -0]);
    expect(zeros.min).toBe(-0);
    expect(zeros.max).toBe(0);
  });

  it('UIC-CHART-6.3 UIC-SPARKLINE-1.2 handles a series beyond function argument limits', () => {
    const values = Array.from({ length: 200_000 }, (_, index) => index - 100_000);
    expect(summarizeNumbers(values)).toEqual({
      count: 200_000,
      sum: -100_000,
      min: -100_000,
      max: 99_999,
    });
  });
});
