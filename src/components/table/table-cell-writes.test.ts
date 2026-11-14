import { describe, expect, it } from 'vitest';
import { formatCellText, parseCellText, readCellText } from './table-cell-writes.js';
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
describe('table cell write helpers', () => {
  it('UIC-TABLE-14.8 writes values as text and reads text as values', () => {
    expect(formatCellText(new Date('2026-10-02T00:00:00Z'))).toBe('2026-10-02T00:00:00.000Z');
    expect(formatCellText(null)).toBe('');
    expect(formatCellText(new Date(Number.NaN))).toBe('');
    expect(formatCellText(false)).toBe('false');
    expect(parseCellText('42', 7)).toBe(42);
    expect(parseCellText('42', 'seven')).toBe('42');
    expect(parseCellText(' ', 7)).toBe(' ');
  });

  it('UIC-TABLE-11.2 reads only plain decimal text of a safe size as a number', () => {
    expect(['-1.5', '+3', '.5', '2.', ' 8 '].map((text) => parseCellText(text, 7))).toEqual([
      -1.5, 3, 0.5, 2, 8,
    ]);
    const unsafe = '9007199254740993';
    for (const text of ['0x10', '0b11', '0o7', '1e3', 'Infinity', unsafe]) {
      expect(parseCellText(text, 7)).toBe(text);
    }
    expect(parseCellText(String(Number.MAX_SAFE_INTEGER), 7)).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('UIC-TABLE-14.7 reads text through the column and reports its refusal', () => {
    const [name, count] = columns;
    if (!name || !count) throw new Error('columns');
    expect(readCellText(rows[0] as Row, count, '4')).toEqual({ value: 4, error: null });
    expect(readCellText(rows[0] as Row, count, '-4')).toEqual({ value: -4, error: 'Positive' });
    expect(readCellText(rows[0] as Row, name, 'Kiwi')).toEqual({ value: 'Kiwi', error: null });
  });
});
