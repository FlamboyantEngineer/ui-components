import { describe, expect, it } from 'vitest';
import { createCellGrid } from './table-cell-range.js';
import {
  copyBounds,
  extendSeries,
  formatCellText,
  parseCellText,
  planClear,
  planFill,
  planPaste,
  readCellText,
  resolveCellWrites,
  resolveFillTarget,
  type CellWrite,
} from './table-cell-writes.js';
import type { TableColumn } from './table-rows.js';

interface Row {
  id: string;
  name: string;
  count: number | null;
  note: string;
}

const rows: Row[] = [
  { id: 'r1', name: 'Apple', count: 1, note: '<b>&' },
  { id: 'r2', name: 'Pear', count: 3, note: '' },
  { id: 'r3', name: 'Plum', count: 5, note: 'x' },
  { id: 'r4', name: 'Fig', count: null, note: 'y' },
];
const columns: TableColumn<Row>[] = [
  { id: 'name', header: 'Name', allowsEditing: true },
  {
    id: 'count',
    header: 'Count',
    allowsEditing: true,
    parseValue: (text) => (text === '' ? null : Number(text)),
    validateValue: (value) =>
      value === null || (typeof value === 'number' && value >= 0) ? null : 'Positive',
  },
  { id: 'note', header: 'Note' },
];
const grid = createCellGrid(rows, columns);
const texts = (writes: CellWrite<Row>[]) =>
  writes.map((write) => `${write.row.id}.${write.column.id}=${write.text}`);

describe('table cell write helpers', () => {
  it('UIC-TABLE-14.8 writes values as text and reads text as values', () => {
    expect(formatCellText(new Date('2026-10-02T00:00:00Z'))).toBe('2026-10-02T00:00:00.000Z');
    expect(formatCellText(null)).toBe('');
    expect(formatCellText(false)).toBe('false');
    expect(parseCellText('42', 7)).toBe(42);
    expect(parseCellText('42', 'seven')).toBe('42');
    expect(parseCellText(' ', 7)).toBe(' ');
  });

  it('UIC-TABLE-14.7 reads text through the column and reports its refusal', () => {
    const [name, count] = columns;
    if (!name || !count) throw new Error('columns');
    expect(readCellText(rows[0] as Row, count, '4')).toEqual({ value: 4, error: null });
    expect(readCellText(rows[0] as Row, count, '-4')).toEqual({ value: -4, error: 'Positive' });
    expect(readCellText(rows[0] as Row, name, 'Kiwi')).toEqual({ value: 'Kiwi', error: null });
  });

  it('UIC-TABLE-14.3 UIC-TABLE-14.7 keeps only accepted, changed values of editable cells in enabled rows', () => {
    const [name, count, note] = columns as [TableColumn<Row>, TableColumn<Row>, TableColumn<Row>];
    const edits = resolveCellWrites<Row>(
      [
        { row: rows[0] as Row, column: name, text: 'Kiwi' },
        { row: rows[0] as Row, column: count, text: '-1' },
        { row: rows[1] as Row, column: count, text: '3' },
        { row: rows[1] as Row, column: note, text: 'z' },
        { row: rows[2] as Row, column: name, text: 'Lime' },
      ],
      (row) => row.id === 'r3',
    );
    expect(edits).toEqual([{ row: rows[0], columnId: 'name', value: 'Kiwi' }]);
  });

  it('UIC-TABLE-14.2 copies cells as tab-separated text and an escaped HTML table', () => {
    expect(copyBounds(grid, { top: 0, bottom: 1, start: 1, end: 2 })).toEqual({
      text: '1\t<b>&\n3\t',
      html: '<table><tbody><tr><td>1</td><td>&lt;b&gt;&amp;</td></tr><tr><td>3</td><td></td></tr></tbody></table>',
    });
  });

  it('UIC-TABLE-14.3 pastes one value into the whole range and blocks from its top start cell', () => {
    const range = { top: 0, bottom: 1, start: 0, end: 1 };
    expect(texts(planPaste(grid, range, [['7']])?.writes ?? [])).toEqual([
      'r1.name=7',
      'r1.count=7',
      'r2.name=7',
      'r2.count=7',
    ]);
    const block = planPaste(grid, { top: 2, bottom: 2, start: 1, end: 1 }, [
      ['a', 'b', 'c'],
      ['d'],
      ['e'],
      ['f'],
    ]);
    expect(block?.bounds).toEqual({ top: 2, bottom: 3, start: 1, end: 2 });
    expect(texts(block?.writes ?? [])).toEqual([
      'r3.count=a',
      'r3.note=b',
      'r4.count=d',
      'r4.note=',
    ]);
    expect(planPaste(grid, range, [])).toBeNull();
  });

  it('UIC-TABLE-14.4 empties every cell of the range', () => {
    expect(texts(planClear(grid, { top: 3, bottom: 3, start: 0, end: 1 }))).toEqual([
      'r4.name=',
      'r4.count=',
    ]);
  });

  it('UIC-TABLE-14.5 continues evenly spaced numbers and repeats anything else', () => {
    expect(extendSeries([1, 3], 3)).toEqual([5, 7, 9]);
    expect(extendSeries([0.1, 0.2], 2)).toEqual([0.3, 0.4]);
    expect(extendSeries([5], 2)).toEqual([5, 5]);
    expect(extendSeries([1, 2, 4], 4)).toEqual([1, 2, 4, 1]);
    expect(extendSeries(['a', 'b'], 3)).toEqual(['a', 'b', 'a']);
    expect(extendSeries([], 2)).toEqual([]);
  });

  it('UIC-TABLE-14.5 fills down column by column and right row by row', () => {
    const down = planFill(
      grid,
      { top: 0, bottom: 1, start: 0, end: 1 },
      { top: 0, bottom: 3, start: 0, end: 1 },
    );
    expect(texts(down)).toEqual(['r3.name=Apple', 'r4.name=Pear', 'r3.count=5', 'r4.count=7']);
    const right = planFill(
      grid,
      { top: 0, bottom: 1, start: 0, end: 0 },
      { top: 0, bottom: 1, start: 0, end: 2 },
    );
    expect(texts(right)).toEqual([
      'r1.count=Apple',
      'r1.note=Apple',
      'r2.count=Pear',
      'r2.note=Pear',
    ]);
    expect(
      planFill(
        grid,
        { top: 0, bottom: 0, start: 0, end: 0 },
        { top: 0, bottom: 0, start: 0, end: 0 },
      ),
    ).toEqual([]);
  });

  it('UIC-TABLE-14.5 extends a fill towards the cell further away, down or towards the end', () => {
    const source = { top: 0, bottom: 1, start: 0, end: 0 };
    expect(resolveFillTarget(source, { row: 3, column: 1 })).toEqual({ ...source, bottom: 3 });
    expect(resolveFillTarget(source, { row: 3, column: 2 })).toEqual({ ...source, bottom: 3 });
    expect(resolveFillTarget(source, { row: 1, column: 2 })).toEqual({ ...source, end: 2 });
    expect(resolveFillTarget(source, { row: 0, column: 0 })).toBeNull();
  });
  it('UIC-TABLE-14.3 pastes a large source block while clipping writes to the grid', () => {
    const block = Array.from({ length: 200_000 }, () => ['7']);
    const paste = planPaste(grid, { top: 0, bottom: 0, start: 1, end: 1 }, block);
    expect(paste?.bounds).toEqual({ top: 0, bottom: 3, start: 1, end: 1 });
    expect(paste?.writes).toHaveLength(4);
  });

  it('UIC-TABLE-14.5 fills small scientific-notation steps without rounding them to zero', () => {
    expect(extendSeries([1e-7, 2e-7], 2)).toEqual([3e-7, 4e-7]);
    expect(extendSeries([1e-12, 2e-12], 2)).toEqual([3e-12, 4e-12]);
    expect(extendSeries([Number.MIN_VALUE, Number.MIN_VALUE * 2], 2)).toEqual([
      Number.MIN_VALUE * 3,
      Number.MIN_VALUE * 4,
    ]);
    expect(extendSeries([1e-12, 2e-12, 100e-12], 3)).toEqual([1e-12, 2e-12, 100e-12]);
  });

  it('UIC-TABLE-14.5 extends a large series without spreading its decimal precisions', () => {
    expect(
      extendSeries(
        Array.from({ length: 200_000 }, (_, index) => index),
        2,
      ),
    ).toEqual([200_000, 200_001]);
  });
});
