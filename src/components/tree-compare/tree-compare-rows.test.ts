import { describe, expect, it } from 'vitest';
import type { ComparedTreeRow } from '../../utils/compare-trees.js';
import {
  collectKeysAboveChanges,
  filterChangedRows,
  findNextChange,
  indexRows,
} from './tree-compare-rows.js';

function row(
  id: number,
  change: ComparedTreeRow['change'],
  children: ComparedTreeRow[] = [],
): ComparedTreeRow {
  return { id, nodeId: id, change, children };
}

describe('tree comparison rows', () => {
  it('UIC-TREE-COMPARE-3.1 UIC-TREE-COMPARE-3.2 UIC-TREE-COMPARE-4.1 keeps deep context and one parent link per row', () => {
    let rows = [row(19_999, 'changed')];
    for (let id = 19_998; id >= 0; id -= 1) rows = [row(id, 'unchanged', rows)];
    const filtered = filterChangedRows(rows);
    const index = indexRows(filtered);
    const expanded = collectKeysAboveChanges(rows);
    expect(index.order).toHaveLength(20_000);
    expect(index.parent.size).toBe(19_999);
    expect(index.parent.get(19_999)).toBe(19_998);
    expect(index.parent.has(0)).toBe(false);
    expect(expanded.size).toBe(19_999);
    expect(expanded.has(0)).toBe(true);
    expect(expanded.has(19_999)).toBe(false);
    expect(findNextChange(index, { from: 0, step: 1 })?.id).toBe(19_999);
  });

  it('UIC-TREE-COMPARE-3.1 UIC-TREE-COMPARE-3.2 removes deep trees with no changes', () => {
    let rows: ComparedTreeRow[] = [];
    for (let id = 19_999; id >= 0; id -= 1) rows = [row(id, 'unchanged', rows)];
    expect(filterChangedRows(rows)).toEqual([]);
    expect(collectKeysAboveChanges(rows).size).toBe(0);
  });

  it('UIC-TREE-COMPARE-4.1 wraps in both directions and starts from the requested end', () => {
    const index = indexRows([row(0, 'changed'), row(1, 'unchanged'), row(2, 'added')]);
    expect(findNextChange(index, { from: 2, step: 1 })?.id).toBe(0);
    expect(findNextChange(index, { from: 0, step: -1 })?.id).toBe(2);
    expect(findNextChange(index, { from: null, step: 1 })?.id).toBe(0);
    expect(findNextChange(index, { from: 'unknown', step: -1 })?.id).toBe(2);
    expect(findNextChange(indexRows([]), { from: null, step: -1 })).toBeUndefined();
    expect(findNextChange(indexRows([row(0, 'unchanged')]), { from: 0, step: 1 })).toBeUndefined();
  });
});
