import { describe, expect, it } from 'vitest';
import {
  applyColumnMove,
  arrangeColumns,
  groupColumnCells,
  orderColumns,
  readColumnLayout,
  stepColumnMove,
} from './table-columns.js';
import type { TableColumnPin } from './table-rows.js';

const column = (id: string, pin?: TableColumnPin) => ({ id, pin });
const columns = [
  column('name'),
  column('colour'),
  column('weight', 'end'),
  column('id', 'start'),
  column('origin'),
];
const ids = (list: readonly { id: string }[]) => list.map((item) => item.id);

describe('table column layout helpers', () => {
  it('UIC-TABLE-8.8 orders listed columns first and the others in declared order', () => {
    expect(ids(orderColumns(columns, ['origin', 'name']))).toEqual([
      'origin',
      'name',
      'colour',
      'weight',
      'id',
    ]);
    expect(ids(orderColumns(columns, undefined))).toEqual(ids(columns));
  });

  it('UIC-TABLE-8.8 drops hidden columns and puts pinned columns at their edges', () => {
    const arranged = arrangeColumns(columns, { order: ['origin'], hidden: ['colour'] });
    expect(ids(arranged)).toEqual(['id', 'origin', 'name', 'weight']);
  });

  it('UIC-TABLE-8.8 moves a column beside another of its pinned group only', () => {
    expect(
      applyColumnMove(columns, {}, { id: 'name', targetId: 'origin', position: 'after' }),
    ).toEqual(['colour', 'weight', 'id', 'origin', 'name']);
    expect(
      applyColumnMove(columns, {}, { id: 'origin', targetId: 'name', position: 'before' }),
    ).toEqual(['origin', 'name', 'colour', 'weight', 'id']);
    expect(applyColumnMove(columns, {}, { id: 'name', targetId: 'id', position: 'before' })).toBe(
      null,
    );
    expect(applyColumnMove(columns, {}, { id: 'name', targetId: 'name', position: 'after' })).toBe(
      null,
    );
  });

  it('UIC-TABLE-8.8 steps a column along the drawn columns within its pinned group', () => {
    const drawn = arrangeColumns(columns, {});
    expect(stepColumnMove(drawn, 'name', 1)).toEqual({
      id: 'name',
      targetId: 'colour',
      position: 'after',
    });
    expect(stepColumnMove(drawn, 'colour', -1)).toEqual({
      id: 'colour',
      targetId: 'name',
      position: 'before',
    });
    expect(stepColumnMove(drawn, 'name', -1)).toBeNull();
    expect(stepColumnMove(drawn, 'origin', 1)).toBeNull();
    expect(stepColumnMove(drawn, 'missing', 1)).toBeNull();
  });

  it('UIC-TABLE-8.8 keeps only lists of known ids from a stored layout', () => {
    expect(
      readColumnLayout({ order: ['origin', 7, 'gone', 'origin'], hidden: 'name' }, columns),
    ).toEqual({ order: ['origin'], hidden: undefined });
    expect(readColumnLayout('broken', columns)).toEqual({});
    expect(readColumnLayout(null, columns)).toEqual({});
  });

  it('UIC-TABLE-8.8 covers runs of one group and merges the gaps between them', () => {
    const size = { id: 'size', header: 'Size', columns: ['weight', 'colour'] };
    const cells = groupColumnCells(arrangeColumns(columns, {}), [size], {
      leading: 1,
      trailing: 1,
    });
    expect(cells.map((cell) => [cell.group?.id ?? null, cell.span])).toEqual([
      [null, 3],
      ['size', 1],
      [null, 1],
      ['size', 1],
      [null, 1],
    ]);
    expect(new Set(cells.map((cell) => cell.key)).size).toBe(cells.length);
  });
});
