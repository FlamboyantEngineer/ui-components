import { act, render, renderHook, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Table } from './table.js';
import { applyTableMove, type TableMove } from './table-rows.js';
import { useTableReorder } from './use-table-reorder.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';

const entries = [
  { id: 'pear', name: 'Pear', kind: 'Fruit', isFixed: false },
  { id: 'lime', name: 'Lime', kind: 'Fruit', isFixed: false },
  { id: 'basil', name: 'Basil', kind: 'Herb', isFixed: true },
  { id: 'mint', name: 'Mint', kind: 'Herb', isFixed: false },
];

function GroupedEntries({ onMove }: { onMove: (move: TableMove) => void }) {
  const [rows, setRows] = useState(entries);
  return (
    <Table
      aria-label="Grouped entries"
      rows={rows}
      columns={[
        { id: 'name', header: 'Name' },
        { id: 'kind', header: 'Kind' },
      ]}
      groupBy={['kind']}
      getRowAttributes={(row) => ({ 'data-entry': row.id })}
      reorder={{
        grouped: 'within-group',
        canMove: (row) => !row.isFixed,
        onMove: (move) => {
          onMove(move);
          setRows((current) => applyTableMove(current, move));
        },
      }}
    />
  );
}

describe('grouped row reordering', { timeout: 15_000 }, () => {
  it('UIC-TABLE-5.7 draws only eligible data-row handles and stops Alt+Arrow at a group boundary', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<GroupedEntries onMove={onMove} />);
    expect(screen.getByRole('button', { name: 'Drag Pear' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Drag Basil' })).not.toBeInTheDocument();
    expect(document.querySelector('.ui-table__group-row .ui-table__drag-handle')).toBeNull();
    const lime = screen.getByRole('row', { name: 'Lime' });
    lime.focus();
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
    expect(onMove).not.toHaveBeenCalled();
    await user.keyboard('{Alt>}{ArrowUp}{/Alt}');
    expect(onMove).toHaveBeenCalledWith({ keys: ['lime'], targetKey: 'pear', position: 'before' });
    expect(lime).toHaveAttribute('data-entry', 'lime');
    expect(lime).toHaveFocus();
  });

  it('UIC-TABLE-5.7 revalidates same-group drops and rejects fixed rows and synthetic destinations', () => {
    const onMove = vi.fn();
    const groups = new Map([
      ['pear', 'Fruit'],
      ['lime', 'Fruit'],
      ['basil', 'Herb'],
      ['mint', 'Herb'],
    ]);
    const { result, rerender } = renderHook(
      ({ groupKeys }) =>
        useTableReorder({
          rows: entries,
          groupKeys,
          isRowDisabled: () => false,
          reorder: { grouped: 'within-group', canMove: (row) => !row.isFixed, onMove },
        }),
      { initialProps: { groupKeys: groups } },
    );
    const drop = (key: string, target: string) =>
      act(() =>
        result.current.dragAndDrop.onMove({
          keys: new Set([toCollectionKey(key)]),
          target: { type: 'item', key: toCollectionKey(target), dropPosition: 'after' },
        }),
      );
    drop('lime', 'pear');
    expect(onMove).not.toHaveBeenCalled();
    drop('pear', 'lime');
    expect(onMove).toHaveBeenCalledTimes(1);
    drop('pear', 'mint');
    drop('basil', 'mint');
    drop('pear', 'ui-table-group:kind=Fruit');
    expect(onMove).toHaveBeenCalledTimes(1);
    rerender({ groupKeys: new Map([...groups, ['pear', 'Herb']]) });
    drop('pear', 'lime');
    expect(onMove).toHaveBeenCalledTimes(1);
  });
});
