import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Table, type TableProps } from './table.js';
import type { TableColumn } from './table-rows.js';

interface Fruit {
  id: string;
  name: string;
  colour: string;
  weight: number;
  picked: string;
}

const fruit: Fruit[] = [
  { id: 'banana', name: 'Banana', colour: 'Yellow', weight: 120, picked: '2026-10-02' },
  { id: 'apple', name: 'Apple', colour: 'Red', weight: 30, picked: '2026-10-10' },
  { id: 'cherry', name: 'Cherry', colour: 'Red', weight: 100, picked: '2026-10-20' },
];
const columns: TableColumn<Fruit>[] = [
  { id: 'name', header: 'Name', filter: { type: 'text' } },
  { id: 'colour', header: 'Colour', filter: { type: 'set' } },
  { id: 'weight', header: 'Weight', filter: { type: 'number' } },
  { id: 'picked', header: 'Picked', filter: { type: 'date' } },
];

// An open filter dialog hides the page from assistive technology, so queries include hidden rows.
const names = () =>
  screen.queryAllByRole('rowheader', { hidden: true }).map((cell) => cell.textContent);
const header = (name: string) =>
  screen.getByRole('columnheader', { name: new RegExp(`^${name}`), hidden: true });

function renderFruit(props: Partial<TableProps<Fruit>> = {}) {
  return render(<Table aria-label="Fruit" rows={fruit} columns={columns} {...props} />);
}

async function openFilter(name: string) {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: `Filter ${name.toLowerCase()}` }));
  return { user, dialog: screen.getByRole('dialog', { name: `Filter ${name.toLowerCase()}` }) };
}

// Full React Aria tables and fields driven by userEvent are slow in jsdom on a busy machine.
describe('Table column filters', { timeout: 20_000 }, () => {
  it('UIC-TABLE-2.8 filters by a text column from the header button and clears it', async () => {
    const onFilterChange = vi.fn();
    const { container } = renderFruit({ onFilterChange });
    const button = screen.getByRole('button', { name: 'Filter name' });
    expect(button.querySelector('[data-glyph]')).toHaveAttribute('data-glyph', 'filter');
    expect(button).toHaveClass('ui-table__column-filter', 'ui-button');
    const { user, dialog } = await openFilter('Name');
    expect(dialog.closest('.ui-table__column-filter-dialog')).not.toBeNull();
    await user.type(within(dialog).getByRole('textbox', { name: 'Contains' }), 'err');
    expect(names()).toEqual(['Cherry']);
    expect(onFilterChange).toHaveBeenLastCalledWith({ columns: { name: 'err' } });
    expect(header('Name')).toHaveAttribute('data-filtered', 'true');
    expectHooksMatchSpec(container, 'TABLE', { slots: ['column-filter'] });
    await user.click(within(dialog).getByRole('button', { name: 'Clear filter' }));
    expect(names()).toEqual(['Banana', 'Apple', 'Cherry']);
    expect(header('Name')).not.toHaveAttribute('data-filtered');
    expect(onFilterChange).toHaveBeenLastCalledWith({ columns: {} });
  });

  it('UIC-TABLE-2.8 filters by ticked values listed from the rows', async () => {
    renderFruit();
    const { user, dialog } = await openFilter('Colour');
    const group = within(dialog).getByRole('group', { name: 'Colour' });
    expect(
      within(group)
        .getAllByRole('checkbox')
        .map((box) => box.getAttribute('value')),
    ).toEqual(['Red', 'Yellow']);
    await user.click(within(group).getByRole('checkbox', { name: 'Yellow' }));
    expect(names()).toEqual(['Banana']);
  });

  it('UIC-TABLE-2.8 filters a number column by its bounds', async () => {
    renderFruit();
    const { user, dialog } = await openFilter('Weight');
    const from = within(dialog).getByRole('textbox', { name: 'From' });
    await user.type(from, '50');
    await user.tab();
    expect(names()).toEqual(['Banana', 'Cherry']);
    await user.type(within(dialog).getByRole('textbox', { name: 'To' }), '110');
    await user.tab();
    expect(names()).toEqual(['Cherry']);
  });

  it('UIC-TABLE-2.8 offers a date range field for a date column', async () => {
    renderFruit({
      defaultFilter: { columns: { picked: { start: '2026-10-05', end: '2026-10-15' } } },
    });
    expect(names()).toEqual(['Apple']);
    const { dialog } = await openFilter('Picked');
    expect(within(dialog).getByRole('group', { name: 'Picked' })).toBeInTheDocument();
    expect(header('Picked')).toHaveAttribute('data-filtered', 'true');
  });

  it('UIC-TABLE-2.7 shows a caller-owned filter and leaves the rows to the caller', async () => {
    const onFilterChange = vi.fn();
    renderFruit({
      filterable: true,
      filter: { query: 'zzz', columns: { colour: ['Red'] } },
      onFilterChange,
    });
    expect(names()).toEqual(['Banana', 'Apple', 'Cherry']);
    const search = screen.getByRole('searchbox', { name: 'Filter rows' });
    expect(search).toHaveValue('zzz');
    expect(header('Colour')).toHaveAttribute('data-filtered', 'true');
    const user = userEvent.setup();
    await user.type(search, 'y');
    expect(onFilterChange).toHaveBeenLastCalledWith({
      query: 'zzzy',
      columns: { colour: ['Red'] },
    });
    expect(names()).toEqual(['Banana', 'Apple', 'Cherry']);
  });

  it('UIC-TABLE-2.7 starts a table-owned filter from defaultFilter', () => {
    renderFruit({ filterable: true, defaultFilter: { query: 'an' } });
    expect(screen.getByRole('searchbox', { name: 'Filter rows' })).toHaveValue('an');
    expect(names()).toEqual(['Banana']);
  });
});
