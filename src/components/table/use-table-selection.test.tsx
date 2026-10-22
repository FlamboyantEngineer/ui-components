import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { TableNode } from './table-tree.js';
import { useTableSelection } from './use-table-selection.js';

describe('table selection', () => {
  it('UIC-TABLE-15.1 collects nested selections in reading order and excludes disabled rows', () => {
    const nodes = [
      { id: 1, row: { id: 1 }, children: [{ id: 2, row: { id: 2 }, children: [] }] },
      { id: 3, row: { id: 3 }, children: [] },
    ];
    const { result, rerender } = renderHook(
      ({ selectedKeys }: { selectedKeys: 'all' | number[] }) =>
        useTableSelection({ selectedKeys, disabledKeys: ['2'] }, nodes),
      { initialProps: { selectedKeys: 'all' as 'all' | number[] } },
    );
    expect(result.current.selectedRows.map((row) => row.id)).toEqual([1, 3]);
    rerender({ selectedKeys: [3, 2, 1] });
    expect(result.current.selectedRows.map((row) => row.id)).toEqual([1, 3]);
  });

  it('UIC-TABLE-15.1 does not read presented rows when the selection is empty', () => {
    const nodes = [
      {
        id: 1,
        get row(): { id: number } {
          throw new Error('No row should be read');
        },
        children: [],
      },
    ];
    const { result } = renderHook(() => useTableSelection({}, nodes));
    expect(result.current.selectedRows).toEqual([]);
  });

  it('UIC-TABLE-15.1 collects a deep selection without repeated descendant arrays', () => {
    let node: TableNode<{ id: number }> = { id: 20_000, row: { id: 20_000 }, children: [] };
    for (let id = 19_999; id >= 0; id -= 1) node = { id, row: { id }, children: [node] };
    const { result } = renderHook(() => useTableSelection({ selectedKeys: 'all' }, [node]));
    expect(result.current.selectedRows).toHaveLength(20_001);
    expect(result.current.selectedRows[0]?.id).toBe(0);
    expect(result.current.selectedRows.at(-1)?.id).toBe(20_000);
  });
});
