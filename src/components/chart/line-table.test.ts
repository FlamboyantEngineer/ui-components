import { describe, expect, it, vi } from 'vitest';
import { toLineTable } from './line-table.js';
import { createLineXAxis } from './line-x-axis.js';

const xAxis = createLineXAxis({
  values: [0, 4],
  range: [0, 100],
  tickCount: 2,
  locale: 'en-US',
  timeZone: 'UTC',
});
const numbers = new Intl.NumberFormat('en-US');
const options = {
  xAxis,
  writeValue: (datum: { value: number }) => numbers.format(datum.value),
  categoryLabel: 'Day',
};

describe('toLineTable', () => {
  it('UIC-CHART-6.4 keeps the first duplicate, blanks missing values and orders all series by x', () => {
    expect(
      toLineTable(
        [
          {
            id: 'a',
            label: 'First',
            points: [
              { x: 2, y: NaN },
              { x: 2, y: 7 },
              { x: 0, y: 3 },
              { x: 'bad', y: 4 },
            ],
          },
          {
            id: 'b',
            label: 'Second',
            points: [
              { x: 4, y: 9 },
              { x: 2, y: 8 },
            ],
          },
        ],
        options,
      ),
    ).toEqual({
      columns: ['Day', 'First', 'Second'],
      rows: [
        ['0', '3', ''],
        ['2', '', '8'],
        ['4', '', '9'],
      ],
    });
  });

  it('UIC-CHART-6.4 reads each source coordinate once for a large table', () => {
    const read = vi.fn(xAxis.read);
    const series = Array.from({ length: 3 }, (_, index) => ({
      id: index,
      label: String(index),
      points: Array.from({ length: 1000 }, (_, x) => ({ x, y: x })),
    }));
    const table = toLineTable(series, { ...options, xAxis: { ...xAxis, read } });
    expect(table.rows).toHaveLength(1000);
    expect(table.rows[999]).toEqual(['999', '999', '999', '999']);
    expect(read).toHaveBeenCalledTimes(3000);
  });
});
