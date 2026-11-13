import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '../button/button.js';
import { Table, type TableProps } from './table.js';
import { type TableEditHistoryOptions, useTableEditHistory } from './table-edit-history.js';
import type { TableColumn } from './table-rows.js';
import type { TableCellEdit } from './use-cell-editing.js';

interface Item {
  id: string;
  name: string;
  count: number;
}

const items: Item[] = [
  { id: 'a', name: 'Apple', count: 1 },
  { id: 'b', name: 'Pear', count: 2 },
  { id: 'c', name: 'Plum', count: 3 },
];

const columns: TableColumn<Item>[] = [
  { id: 'name', header: 'Name', allowsEditing: true, allowsSorting: true },
  {
    id: 'count',
    header: 'Count',
    allowsEditing: true,
    validateValue: (value) => (typeof value === 'number' && value < 0 ? 'Not below zero' : null),
    bulkEdit: { type: 'number' },
  },
];

interface SheetProps extends Partial<TableProps<Item>> {
  history?: TableEditHistoryOptions;
  onBatch?: (edits: readonly TableCellEdit<Item>[]) => void;
}

function Sheet({ history: historyOptions, onBatch, ...props }: SheetProps) {
  const [rows, setRows] = useState(items);
  const [resetKey, setResetKey] = useState(0);
  const history = useTableEditHistory({ resetKey, ...historyOptions });
  const apply = (edits: readonly TableCellEdit<Item>[]) => {
    onBatch?.(edits);
    setRows((current) =>
      current.map((row) => {
        const changes = edits.filter((edit) => edit.row.id === row.id);
        return changes.reduce((next, edit) => ({ ...next, [edit.columnId]: edit.value }), row);
      }),
    );
  };
  return (
    <>
      <Button isDisabled={!history.canUndo} onPress={history.undo}>
        Undo
      </Button>
      <Button isDisabled={!history.canRedo} onPress={history.redo}>
        Redo
      </Button>
      <Button
        onPress={() =>
          setRows((current) => current.map((row) => (row.id === 'a' ? { ...row, count: 9 } : row)))
        }
      >
        Change Apple elsewhere
      </Button>
      <Button onPress={() => setRows((current) => current.filter((row) => row.id !== 'b'))}>
        Remove Pear
      </Button>
      <Button onPress={() => setResetKey((key) => key + 1)}>Replace the data</Button>
      <Table
        aria-label="Items"
        rows={rows}
        columns={columns}
        cellSelection="range"
        editHistory={history}
        onCellsChange={apply}
        {...props}
      />
    </>
  );
}

const cell = (rowName: string, columnId: string) => {
  const row = screen.getByRole('row', { name: rowName });
  return row.querySelector(`.ui-table__cell[data-column="${columnId}"]`) as HTMLElement;
};
const button = (name: string) => screen.getByRole('button', { name });

async function editCell(
  user: ReturnType<typeof userEvent.setup>,
  target: HTMLElement,
  text: string,
) {
  await user.click(target);
  await user.keyboard('{F2}');
  const input = within(target).getByRole('textbox');
  await user.clear(input);
  await user.type(input, `${text}{Enter}`);
}

// Full React Aria tables driven by userEvent are slow in jsdom on a busy machine.
describe('Table edit history', { timeout: 15_000 }, () => {
  it('UIC-TABLE-17.1 undoes and redoes a single edit by its row and column', async () => {
    const user = userEvent.setup();
    const onBatch = vi.fn();
    render(<Sheet onBatch={onBatch} />);
    expect(button('Undo')).toBeDisabled();
    await editCell(user, cell('Apple', 'count'), '5');
    expect(cell('Apple', 'count')).toHaveTextContent('5');
    expect(button('Undo')).toBeEnabled();
    await user.click(button('Undo'));
    expect(cell('Apple', 'count')).toHaveTextContent('1');
    expect(onBatch).toHaveBeenLastCalledWith([
      { row: expect.objectContaining({ id: 'a', count: 5 }), columnId: 'count', value: 1 },
    ]);
    expect(button('Undo')).toBeDisabled();
    await user.click(button('Redo'));
    expect(cell('Apple', 'count')).toHaveTextContent('5');
    expect(button('Redo')).toBeDisabled();
  });

  it('UIC-TABLE-17.1 undoes a multi-cell paste, clear and bulk edit each as one entry', async () => {
    const user = userEvent.setup();
    render(<Sheet selectionMode="multiple" />);
    await user.click(cell('Apple', 'name'));
    await user.paste('Kiwi\t7\nLime\t8');
    expect(cell('Kiwi', 'count')).toHaveTextContent('7');
    await user.click(cell('Plum', 'count'));
    await user.keyboard('{Delete}');
    expect(cell('Plum', 'count')).toHaveTextContent('');
    await user.click(
      screen.getByRole('row', { name: 'Kiwi' }).querySelector('.ui-table__checkbox') as HTMLElement,
    );
    await user.click(button('Edit selected'));
    const dialog = screen.getByRole('dialog', { name: 'Edit 1 row' });
    await user.type(within(dialog).getByRole('textbox', { name: 'Count' }), '40');
    await user.click(within(dialog).getByRole('button', { name: 'Apply' }));
    expect(cell('Kiwi', 'count')).toHaveTextContent('40');
    await user.click(button('Undo'));
    expect(cell('Kiwi', 'count')).toHaveTextContent('7');
    await user.click(button('Undo'));
    expect(cell('Plum', 'count')).toHaveTextContent('3');
    await user.click(button('Undo'));
    expect(cell('Apple', 'count')).toHaveTextContent('1');
    expect(cell('Pear', 'count')).toHaveTextContent('2');
    expect(button('Undo')).toBeDisabled();
  });

  it('UIC-TABLE-17.3 undoes a bulk edit of a column that offers only bulk editing', async () => {
    const user = userEvent.setup();
    render(
      <Sheet
        selectionMode="multiple"
        columns={[
          { id: 'name', header: 'Name', allowsEditing: true },
          { id: 'count', header: 'Count', bulkEdit: { type: 'number' } },
        ]}
      />,
    );
    await editCell(user, cell('Apple', 'name'), 'Kiwi');
    await user.click(
      screen.getByRole('row', { name: 'Pear' }).querySelector('.ui-table__checkbox') as HTMLElement,
    );
    await user.click(button('Edit selected'));
    const dialog = screen.getByRole('dialog', { name: 'Edit 1 row' });
    await user.type(within(dialog).getByRole('textbox', { name: 'Count' }), '40');
    await user.click(within(dialog).getByRole('button', { name: 'Apply' }));
    expect(cell('Pear', 'count')).toHaveTextContent('40');
    await user.click(button('Undo'));
    expect(cell('Pear', 'count')).toHaveTextContent('2');
    expect(cell('Kiwi', 'name')).toBeInTheDocument();
    await user.click(button('Undo'));
    expect(cell('Apple', 'name')).toBeInTheDocument();
  });

  it('UIC-TABLE-17.1 records no entry for a refused or unchanged edit', async () => {
    const user = userEvent.setup();
    render(<Sheet />);
    await user.click(cell('Apple', 'count'));
    await user.paste('-4');
    await editCell(user, cell('Pear', 'count'), '2');
    expect(cell('Apple', 'count')).toHaveTextContent('1');
    expect(button('Undo')).toBeDisabled();
  });

  it('UIC-TABLE-17.2 undoes with Control+Z on the grid and redoes with Shift or Y, leaving editors their keys', async () => {
    const user = userEvent.setup();
    render(<Sheet />);
    await editCell(user, cell('Apple', 'count'), '5');
    await user.click(cell('Pear', 'name'));
    await user.keyboard('{Control>}z{/Control}');
    expect(cell('Apple', 'count')).toHaveTextContent('1');
    await user.keyboard('{Control>}{Shift>}z{/Shift}{/Control}');
    expect(cell('Apple', 'count')).toHaveTextContent('5');
    await user.keyboard('{Meta>}z{/Meta}');
    expect(cell('Apple', 'count')).toHaveTextContent('1');
    await user.keyboard('{Control>}y{/Control}');
    expect(cell('Apple', 'count')).toHaveTextContent('5');
    await user.click(cell('Pear', 'name'));
    await user.keyboard('{F2}');
    const input = within(cell('Pear', 'name')).getByRole('textbox');
    await user.keyboard('{Control>}z{/Control}');
    expect(input).toBeInTheDocument();
    expect(cell('Apple', 'count')).toHaveTextContent('5');
  });

  it('UIC-TABLE-17.3 skips cells changed elsewhere and rows that are gone', async () => {
    const user = userEvent.setup();
    render(<Sheet />);
    await user.click(cell('Apple', 'count'));
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}');
    await user.paste('0');
    await user.click(button('Change Apple elsewhere'));
    await user.click(button('Undo'));
    expect(cell('Apple', 'count')).toHaveTextContent('9');
    expect(cell('Pear', 'count')).toHaveTextContent('2');
    await user.click(button('Redo'));
    expect(cell('Pear', 'count')).toHaveTextContent('0');
    await user.click(button('Remove Pear'));
    await user.click(button('Undo'));
    expect(button('Undo')).toBeDisabled();
    expect(button('Redo')).toBeDisabled();
    expect(cell('Apple', 'count')).toHaveTextContent('9');
  });

  it('UIC-TABLE-17.3 skips revoked edits and moves on to an entry that still applies', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Sheet />);
    await editCell(user, cell('Apple', 'name'), 'Kiwi');
    await editCell(user, cell('Pear', 'count'), '6');
    rerender(<Sheet disabledKeys={['b']} />);
    await user.click(button('Undo'));
    expect(cell('Pear', 'count')).toHaveTextContent('6');
    expect(cell('Apple', 'name')).toHaveTextContent('Apple');
  });

  it('UIC-TABLE-17.3 keeps the latest entries up to its limit and forgets them on a reset', async () => {
    const user = userEvent.setup();
    render(<Sheet history={{ limit: 2 }} />);
    await editCell(user, cell('Apple', 'count'), '4');
    await editCell(user, cell('Pear', 'count'), '5');
    await editCell(user, cell('Plum', 'count'), '6');
    await user.click(button('Undo'));
    await user.click(button('Undo'));
    expect(button('Undo')).toBeDisabled();
    expect(cell('Apple', 'count')).toHaveTextContent('4');
    expect(cell('Pear', 'count')).toHaveTextContent('2');
    await user.click(button('Replace the data'));
    expect(button('Redo')).toBeDisabled();
  });

  it('UIC-TABLE-17.3 follows rows by id when the table sorts them', async () => {
    const user = userEvent.setup();
    render(<Sheet />);
    await editCell(user, cell('Apple', 'name'), 'Zucchini');
    await user.click(screen.getByRole('columnheader', { name: /Name/ }));
    await user.click(button('Undo'));
    expect(screen.getAllByRole('rowheader').map((header) => header.textContent)).toEqual([
      'Apple',
      'Pear',
      'Plum',
    ]);
  });
});
