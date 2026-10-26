import { describe, expect, it } from 'vitest';
import { formatCellReference, parseCellReference } from './cell-reference.js';

describe('formatCellReference', () => {
  it('UIC-FORMULA-BAR-1.1 writes column letters then the one-based row number', () => {
    expect(formatCellReference({ row: 0, column: 0 })).toBe('A1');
    expect(formatCellReference({ row: 11, column: 2 })).toBe('C12');
    expect(formatCellReference({ row: 4, column: 25 })).toBe('Z5');
    expect(formatCellReference({ row: 0, column: 26 })).toBe('AA1');
    expect(formatCellReference({ row: 0, column: 51 })).toBe('AZ1');
    expect(formatCellReference({ row: 0, column: 52 })).toBe('BA1');
    expect(formatCellReference({ row: 99, column: 701 })).toBe('ZZ100');
    expect(formatCellReference({ row: 0, column: 702 })).toBe('AAA1');
  });
});

describe('parseCellReference', () => {
  it('UIC-FORMULA-BAR-1.2 reads a reference back, ignoring case, spaces and absolute marks', () => {
    expect(parseCellReference('A1')).toEqual({ row: 0, column: 0 });
    expect(parseCellReference(' c12 ')).toEqual({ row: 11, column: 2 });
    expect(parseCellReference('$AA$1')).toEqual({ row: 0, column: 26 });
    expect(parseCellReference('B$3')).toEqual({ row: 2, column: 1 });
    expect(parseCellReference('zz100')).toEqual({ row: 99, column: 701 });
  });

  it('UIC-FORMULA-BAR-1.2 refuses text that is not one cell', () => {
    for (const text of ['', 'A', '12', 'A0', 'A01', '1A', 'A1:B2', 'A-1', 'Ä1', 'A 1', '$$A1']) {
      expect(parseCellReference(text)).toBeNull();
    }
  });

  it('UIC-FORMULA-BAR-1.2 round-trips every formatted reference', () => {
    for (const column of [0, 1, 25, 26, 27, 700, 701, 702, 18277]) {
      for (const row of [0, 9, 1048575]) {
        expect(parseCellReference(formatCellReference({ row, column }))).toEqual({ row, column });
      }
    }
  });
});
