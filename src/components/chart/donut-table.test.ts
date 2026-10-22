import { describe, expect, it, vi } from 'vitest';
import { toDonutTable } from './donut-table.js';

const options = {
  formats: {
    value: new Intl.NumberFormat('en-US'),
    share: new Intl.NumberFormat('en-US', { style: 'percent' }),
  },
  headings: ['Category', 'Value', 'Share'],
};

describe('toDonutTable', () => {
  it('UIC-CHART-7.2 keeps segment order and normalizes missing amounts like the drawing', () => {
    const segments = [
      { id: 'a', label: 'First', value: 1 },
      { id: 'b', label: 'Negative', value: -2 },
      { id: 'c', label: 'Infinite', value: Infinity },
      { id: 'd', label: 'Missing', value: NaN },
      { id: 'e', label: 'Last', value: 3 },
    ];
    expect(toDonutTable(segments, options)).toEqual({
      columns: options.headings,
      rows: [
        ['First', '1', '25%'],
        ['Negative', '0', '0%'],
        ['Infinite', '0', '0%'],
        ['Missing', '0', '0%'],
        ['Last', '3', '75%'],
      ],
    });
  });

  it('UIC-CHART-7.2 builds a large table without calculating slice paths', () => {
    const count = 20_000;
    const sine = vi.spyOn(Math, 'sin');
    let reads = 0;
    const segments = Array.from({ length: count }, (_, id) => ({
      id,
      label: String(id),
      get value() {
        reads += 1;
        return 1;
      },
    }));
    const table = toDonutTable(segments, options);
    expect(table.rows).toHaveLength(count);
    expect(table.rows.at(-1)).toEqual(['19999', '1', '0%']);
    expect(reads).toBe(count);
    expect(sine).not.toHaveBeenCalled();
  });

  it('UIC-CHART-7.2 gives zero shares when no amount contributes to the total', () => {
    expect(toDonutTable([{ id: 'empty', label: 'Empty', value: 0 }], options).rows).toEqual([
      ['Empty', '0', '0%'],
    ]);
  });

  it('UIC-CHART-7.2 keeps finite extreme amounts at their share of an overflowing whole', () => {
    const table = toDonutTable(
      [
        { id: 'a', label: 'First', value: Number.MAX_VALUE },
        { id: 'b', label: 'Second', value: Number.MAX_VALUE },
      ],
      options,
    );
    expect(table.rows.map((row) => row[2])).toEqual(['50%', '50%']);
  });
});
