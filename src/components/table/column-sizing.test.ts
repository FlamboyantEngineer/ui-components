import { describe, expect, it } from 'vitest';
import {
  clampColumnWidth,
  getColumnBounds,
  isColumnSize,
  pickColumnWidths,
  resolveColumnWidth,
  type TableColumnSizing,
} from './column-sizing.js';

const name: TableColumnSizing = { id: 'name', minWidth: 80, maxWidth: 240 };
const city: TableColumnSizing = { id: 'city', width: '2fr' };

describe('column sizing', () => {
  it('UIC-TABLE-4.4 accepts positive pixels, percentages and shares only', () => {
    for (const value of [120, 0.5, '25%', '2fr', '1.5fr']) expect(isColumnSize(value)).toBe(true);
    for (const value of [
      0,
      -4,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      '0fr',
      '12px',
      'auto',
      null,
      {},
    ]) {
      expect(isColumnSize(value)).toBe(false);
    }
  });

  it('UIC-TABLE-4.1 UIC-TABLE-4.4 never lets the maximum fall below the minimum', () => {
    expect(getColumnBounds(name)).toEqual({ minWidth: 80, maxWidth: 240 });
    expect(getColumnBounds({ id: 'x', minWidth: 120, maxWidth: 60 })).toEqual({
      minWidth: 120,
      maxWidth: 120,
    });
    expect(getColumnBounds({ id: 'x', maxWidth: 60 })).toEqual({
      minWidth: undefined,
      maxWidth: 60,
    });
  });

  it('UIC-TABLE-4.1 UIC-TABLE-4.4 keeps pixel widths inside the bounds', () => {
    expect(clampColumnWidth(20, name)).toBe(80);
    expect(clampColumnWidth(400, name)).toBe(240);
    expect(clampColumnWidth(150, name)).toBe(150);
    expect(clampColumnWidth('3fr', name)).toBe('3fr');
    expect(clampColumnWidth(10, city)).toBe(10);
  });

  it('UIC-TABLE-4.4 resolves a stored width, then the declared width, then an equal share', () => {
    expect(resolveColumnWidth(city)).toBe('2fr');
    expect(resolveColumnWidth(name)).toBe('1fr');
    expect(resolveColumnWidth(name, 500)).toBe(240);
    expect(resolveColumnWidth(city, 'wide')).toBe('2fr');
    expect(resolveColumnWidth({ id: 'x', width: 30, minWidth: 50 })).toBe(50);
  });

  it('UIC-TABLE-4.3 UIC-TABLE-4.4 picks usable widths of known columns from maps and objects', () => {
    const columns = [name, city];
    expect(
      pickColumnWidths(
        new Map<unknown, unknown>([
          ['name', 10],
          ['other', 90],
          ['city', '1fr'],
        ]),
        columns,
      ),
    ).toEqual({ name: 80, city: '1fr' });
    expect(pickColumnWidths({ name: 160, city: 'auto' }, columns)).toEqual({ name: 160 });
    for (const garbage of [null, 'wide', 42, ['name', 100]]) {
      expect(pickColumnWidths(garbage, columns)).toEqual({});
    }
  });
});
