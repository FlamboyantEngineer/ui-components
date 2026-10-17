import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { SortDescriptor } from 'react-aria-components';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Table } from './table.js';
import type { TableColumn } from './table-rows.js';

interface Fruit {
  id: string;
  name: string;
  colour: string;
  weight: number;
}

const fruit: Fruit[] = [
  { id: 'banana', name: 'Banana', colour: 'Yellow', weight: 120 },
  { id: 'apple', name: 'Apple', colour: 'Red', weight: 30 },
  { id: 'cherry', name: 'Cherry', colour: 'Red', weight: 100 },
  { id: 'lemon', name: 'Lemon', colour: 'Yellow', weight: 100 },
];
const columns: TableColumn<Fruit>[] = [
  { id: 'name', header: 'Name', allowsSorting: true },
  { id: 'colour', header: 'Colour', allowsSorting: true },
  { id: 'weight', header: 'Weight', allowsSorting: true },
];

const names = () => screen.getAllByRole('rowheader').map((cell) => cell.textContent);
const header = (name: string) => screen.getByRole('columnheader', { name: new RegExp(`^${name}`) });

// Full React Aria tables driven by userEvent are slow in jsdom on a busy machine.
describe('Table sorting by several columns', { timeout: 15_000 }, () => {
  it('UIC-TABLE-2.6 adds columns with Shift, shows their priority and orders the rows', async () => {
    const user = userEvent.setup();
    const onSortDescriptorsChange = vi.fn();
    const { container } = render(
      <Table
        aria-label="Fruit"
        rows={fruit}
        columns={columns}
        defaultSortDescriptors={[]}
        onSortDescriptorsChange={onSortDescriptorsChange}
      />,
    );
    await user.click(header('Colour'));
    await user.keyboard('{Shift>}');
    await user.click(header('Weight'));
    await user.click(header('Weight'));
    await user.keyboard('{/Shift}');
    expect(onSortDescriptorsChange).toHaveBeenLastCalledWith([
      { column: 'colour', direction: 'ascending' },
      { column: 'weight', direction: 'descending' },
    ]);
    expect(names()).toEqual(['Cherry', 'Apple', 'Banana', 'Lemon']);
    expect(header('Colour')).toHaveAttribute('data-sort-priority', '1');
    expect(header('Colour')).toHaveAttribute('aria-sort', 'ascending');
    expect(header('Weight')).toHaveAttribute('data-sort-priority', '2');
    expect(header('Weight')).toHaveAttribute('aria-sort', 'none');
    expect(header('Weight').querySelector('[data-glyph]')).toHaveAttribute(
      'data-glyph',
      'sort-descending',
    );
    expect(header('Name')).not.toHaveAttribute('data-sort-priority');
    expectHooksMatchSpec(container, 'TABLE');
  });

  it('UIC-TABLE-2.6 sorts by one column again on a plain press and with Shift+Enter', async () => {
    const user = userEvent.setup();
    const onSortDescriptorsChange = vi.fn();
    render(
      <Table
        aria-label="Fruit"
        rows={fruit}
        columns={columns}
        defaultSortDescriptors={[
          { column: 'colour', direction: 'ascending' },
          { column: 'weight', direction: 'ascending' },
        ]}
        onSortDescriptorsChange={onSortDescriptorsChange}
      />,
    );
    expect(names()).toEqual(['Apple', 'Cherry', 'Lemon', 'Banana']);
    await user.click(header('Name'));
    expect(onSortDescriptorsChange).toHaveBeenLastCalledWith([
      { column: 'name', direction: 'ascending' },
    ]);
    expect(header('Colour')).not.toHaveAttribute('data-sort-priority');
    header('Colour').focus();
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    expect(onSortDescriptorsChange).toHaveBeenLastCalledWith([
      { column: 'name', direction: 'ascending' },
      { column: 'colour', direction: 'ascending' },
    ]);
  });

  it('UIC-TABLE-2.6 leaves a caller-owned sort list to the caller', async () => {
    const user = userEvent.setup();
    const onSortDescriptorsChange = vi.fn();
    const sort: SortDescriptor[] = [{ column: 'weight', direction: 'descending' }];
    render(
      <Table
        aria-label="Fruit"
        rows={fruit}
        columns={columns}
        sortDescriptors={sort}
        onSortDescriptorsChange={onSortDescriptorsChange}
      />,
    );
    expect(names()).toEqual(['Banana', 'Apple', 'Cherry', 'Lemon']);
    expect(header('Weight')).toHaveAttribute('aria-sort', 'descending');
    await user.click(header('Weight'));
    expect(onSortDescriptorsChange).toHaveBeenCalledWith([]);
    expect(header('Weight')).toHaveAttribute('data-sort-priority', '1');
  });
});
