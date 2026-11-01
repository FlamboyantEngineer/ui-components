import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Table, type TableProps } from './table.js';
import type { TableColumn } from './table-rows.js';

interface Item {
  id: string;
  name: string;
  kind: string;
  origin: string;
  weight: number | null;
  picked: string;
  organic: boolean;
}

const items: Item[] = [
  {
    id: 'a',
    name: 'Apple',
    kind: 'Fruit',
    origin: 'Oslo',
    weight: 3,
    picked: '2026-10-01',
    organic: false,
  },
  {
    id: 'b',
    name: 'Mint',
    kind: 'Herb',
    origin: 'Lima',
    weight: 1,
    picked: '2026-10-02',
    organic: true,
  },
  {
    id: 'c',
    name: 'Pear',
    kind: 'Fruit',
    origin: 'Oslo',
    weight: 5,
    picked: '2026-10-03',
    organic: false,
  },
];

const columns: TableColumn<Item>[] = [
  { id: 'name', header: 'Name' },
  { id: 'kind', header: 'Kind', bulkEdit: { type: 'choice', options: ['Fruit', 'Herb'] } },
  {
    id: 'origin',
    header: 'Origin',
    bulkEdit: { type: 'text' },
    validateValue: (value, row) => (row.id === 'c' && value === 'Rome' ? 'Not here' : null),
  },
  { id: 'weight', header: 'Weight', bulkEdit: { type: 'number' } },
  { id: 'picked', header: 'Picked', bulkEdit: { type: 'date' } },
  {
    id: 'organic',
    header: 'Organic',
    getValue: (row) => row.organic,
    bulkEdit: { type: 'boolean' },
  },
];

function renderItems(props: Partial<TableProps<Item>> = {}) {
  return render(
    <Table aria-label="Items" rows={items} columns={columns} selectionMode="multiple" {...props} />,
  );
}

const check = (name: string) =>
  screen.getByRole('row', { name }).querySelector('.ui-table__checkbox') as HTMLElement;

async function openBulkEdit(user: ReturnType<typeof userEvent.setup>, names: string[]) {
  for (const name of names) await user.click(check(name));
  await user.click(screen.getByRole('button', { name: 'Edit selected' }));
  return screen.getByRole('dialog', { name: `Edit ${names.length} rows` });
}

async function chooseField(
  user: ReturnType<typeof userEvent.setup>,
  dialog: HTMLElement,
  field: string,
) {
  await user.click(within(dialog).getAllByRole('button')[0] as HTMLElement);
  await user.click(screen.getByRole('option', { name: field }));
}

// Full React Aria tables and dialogs driven by userEvent are slow in jsdom on a busy machine.
describe('Table selection bar and bulk edit', { timeout: 30_000 }, () => {
  it('UIC-TABLE-15.1 draws a selection bar with the count, the caller actions and a clear button', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const onSelectionChange = vi.fn();
    const { container } = renderItems({
      columns: columns.map(({ bulkEdit: _bulkEdit, ...column }) => column),
      selectionActions: [{ verb: 'delete', label: 'Delete selected', onPress: onDelete }],
      onSelectionChange,
    });
    expect(container.querySelector('.ui-table__selection-bar')).toBeNull();
    await user.click(check('Apple'));
    await user.click(check('Pear'));
    const bar = container.querySelector('.ui-table__selection-bar') as HTMLElement;
    expect(bar).toHaveClass('ui-action-row');
    expect(within(bar).getByRole('status')).toHaveTextContent('2 selected');
    expect(within(bar).queryByRole('button', { name: 'Edit selected' })).not.toBeInTheDocument();
    await user.click(within(bar).getByRole('button', { name: 'Delete selected' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
    expectHooksMatchSpec(container, 'TABLE', { slots: ['selection-bar'] });
    await user.click(within(bar).getByRole('button', { name: 'Clear selection' }));
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set());
    expect(container.querySelector('.ui-table__selection-bar')).toBeNull();
  });

  it('UIC-TABLE-15.1 counts every enabled row for a selection of all and draws no bar without bulk actions', async () => {
    const user = userEvent.setup();
    const { container, unmount } = renderItems({ disabledKeys: ['b'] });
    await user.click(container.querySelector('th .ui-table__checkbox') as HTMLElement);
    expect(
      within(container.querySelector('.ui-table__selection-bar') as HTMLElement).getByRole(
        'status',
      ),
    ).toHaveTextContent('2 selected');
    unmount();
    const { container: plain } = renderItems({ columns: [{ id: 'name', header: 'Name' }] });
    await user.click(check('Apple'));
    expect(plain.querySelector('.ui-table__selection-bar')).toBeNull();
  });

  it('UIC-TABLE-15.2 sets a choice across the selected rows in one batch', async () => {
    const user = userEvent.setup();
    const onCellsChange = vi.fn();
    const { container } = renderItems({ onCellsChange });
    const dialog = await openBulkEdit(user, ['Apple', 'Mint']);
    expectHooksMatchSpec(document.body, 'TABLE', { slots: ['bulk-edit'] });
    expect(within(dialog).getAllByRole('button')[0]).toHaveTextContent('Kind');
    await user.click(within(dialog).getAllByRole('button')[1] as HTMLElement);
    await user.click(screen.getByRole('option', { name: 'Herb' }));
    await user.click(within(dialog).getByRole('button', { name: 'Apply' }));
    expect(onCellsChange).toHaveBeenCalledTimes(1);
    expect(onCellsChange).toHaveBeenCalledWith([
      { row: items[0], columnId: 'kind', value: 'Herb' },
    ]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(container.querySelector('.ui-table__selection-bar')).not.toBeNull();
  });

  it('UIC-TABLE-15.2 sets text, skipping refused values, and starts afresh at each opening', async () => {
    const user = userEvent.setup();
    const onCellsChange = vi.fn();
    renderItems({ onCellsChange });
    let dialog = await openBulkEdit(user, ['Apple', 'Pear']);
    await chooseField(user, dialog, 'Origin');
    await user.type(within(dialog).getByRole('textbox', { name: 'Origin' }), 'Rome');
    await user.click(within(dialog).getByRole('button', { name: 'Apply' }));
    expect(onCellsChange).toHaveBeenLastCalledWith([
      { row: items[0], columnId: 'origin', value: 'Rome' },
    ]);
    await user.click(screen.getByRole('button', { name: 'Edit selected' }));
    dialog = screen.getByRole('dialog', { name: 'Edit 2 rows' });
    expect(within(dialog).getAllByRole('button')[0]).toHaveTextContent('Kind');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(onCellsChange).toHaveBeenCalledTimes(1);
  });

  it('UIC-TABLE-15.2 sets numbers, dates and booleans with fields of their types', async () => {
    const user = userEvent.setup();
    const onCellsChange = vi.fn();
    renderItems({ onCellsChange });
    let dialog = await openBulkEdit(user, ['Apple', 'Mint']);
    await chooseField(user, dialog, 'Weight');
    const weight = within(dialog).getByRole('textbox', { name: 'Weight' });
    await user.type(weight, '8');
    await user.tab();
    await user.click(within(dialog).getByRole('button', { name: 'Apply' }));
    expect(onCellsChange).toHaveBeenLastCalledWith([
      { row: items[0], columnId: 'weight', value: 8 },
      { row: items[1], columnId: 'weight', value: 8 },
    ]);

    await user.click(screen.getByRole('button', { name: 'Edit selected' }));
    dialog = screen.getByRole('dialog', { name: 'Edit 2 rows' });
    await chooseField(user, dialog, 'Organic');
    await user.click(within(dialog).getByRole('checkbox', { name: 'Organic' }));
    await user.click(within(dialog).getByRole('button', { name: 'Apply' }));
    expect(onCellsChange).toHaveBeenLastCalledWith([
      { row: items[0], columnId: 'organic', value: true },
    ]);

    await user.click(screen.getByRole('button', { name: 'Edit selected' }));
    dialog = screen.getByRole('dialog', { name: 'Edit 2 rows' });
    await chooseField(user, dialog, 'Picked');
    const [month] = within(dialog).getAllByRole('spinbutton');
    await user.click(month as HTMLElement);
    await user.keyboard('10092026');
    await user.click(within(dialog).getByRole('button', { name: 'Apply' }));
    expect(onCellsChange).toHaveBeenLastCalledWith([
      { row: items[0], columnId: 'picked', value: '2026-10-09' },
      { row: items[1], columnId: 'picked', value: '2026-10-09' },
    ]);
  });

  it('UIC-TABLE-15.2 keeps the dialog open on a partly entered date and clears on an empty one', async () => {
    const user = userEvent.setup();
    const onCellsChange = vi.fn();
    renderItems({ onCellsChange });
    let dialog = await openBulkEdit(user, ['Apple', 'Mint']);
    await chooseField(user, dialog, 'Picked');
    const [month] = within(dialog).getAllByRole('spinbutton');
    await user.click(month as HTMLElement);
    await user.keyboard('12');
    await user.click(within(dialog).getByRole('button', { name: 'Apply' }));
    expect(onCellsChange).not.toHaveBeenCalled();
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('Finish entering the date.')).toBeInTheDocument();
    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('button', { name: 'Edit selected' }));
    dialog = screen.getByRole('dialog', { name: 'Edit 2 rows' });
    await chooseField(user, dialog, 'Picked');
    await user.click(within(dialog).getByRole('button', { name: 'Apply' }));
    expect(onCellsChange).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
