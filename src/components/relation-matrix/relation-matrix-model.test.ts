import { describe, expect, it } from 'vitest';
import { indexRelations, toggleRelation } from './relation-matrix-model.js';

const rows = [{ id: 'r1' }, { id: 'r2' }, { id: 3 }];
const columns = [{ id: 'c1' }, { id: 'c2' }];

describe('relation matrix model', () => {
  it('UIC-RELATION-MATRIX-1.2 indexes relations by cell and counts rows and columns', () => {
    const index = indexRelations(
      [
        { row: 'r1', column: 'c1', kind: 'verifies' },
        { row: 'r1', column: 'c1', kind: 'derives' },
        { row: 'r1', column: 'c2' },
        { row: 3, column: 'c2' },
        { row: 'gone', column: 'c1' },
        { row: 'r2', column: 'gone' },
      ],
      { rows, columns },
    );
    expect(index.get('r1', 'c1')).toEqual({ row: 'r1', column: 'c1', kind: 'verifies' });
    expect(index.get('r2', 'c1')).toBeUndefined();
    expect(index.get('3', 'c2')).toBeUndefined();
    expect(index.get(3, 'c2')).toEqual({ row: 3, column: 'c2' });
    expect([index.countRow('r1'), index.countRow('r2'), index.countRow(3)]).toEqual([2, 0, 1]);
    expect([index.countColumn('c1'), index.countColumn('c2')]).toEqual([1, 2]);
  });

  it('UIC-RELATION-MATRIX-2.2 toggles the relation of one cell', () => {
    const relations = [{ row: 'r1', column: 'c1' }];
    expect(toggleRelation(relations, { row: 'r1', column: 'c1' })).toEqual([]);
    expect(toggleRelation(relations, { row: 'r2', column: 'c1', kind: 'verifies' })).toEqual([
      { row: 'r1', column: 'c1' },
      { row: 'r2', column: 'c1', kind: 'verifies' },
    ]);
    expect(toggleRelation([], { row: 'r2', column: 'c2' })).toEqual([{ row: 'r2', column: 'c2' }]);
  });
});
