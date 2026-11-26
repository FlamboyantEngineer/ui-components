import { expect, it } from 'vitest';
import { createNumericAxis, findAxisExtent, moveChartRange } from './numeric-axis.js';

it('UIC-CHART-14.1 maps equal frequency ratios to equal distances and zooms about the pointer', () => {
  const x = createNumericAxis({ kind: 'log', domain: [1, 1000], range: [0, 300] });
  expect(x.map(10)).toBe(100);
  expect(x.map(100)).toBe(200);
  expect(x.map(0)).toBeNaN();
  expect(x.ticks().map((t) => t.value)).toEqual([1, 10, 100, 1000]);
  const next = moveChartRange(x, x.domain, { anchor: 1 / 3, factor: 0.5, shift: 0 });
  expect(createNumericAxis({ kind: 'log', domain: next, range: x.range }).invert(100)).toBeCloseTo(
    10,
    12,
  );
  expect(findAxisExtent([-5, 0, 1, 100], 'log')).toEqual([1, 100]);
});
