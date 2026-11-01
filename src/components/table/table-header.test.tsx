import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { requireDefined } from '../../utils/require-defined.js';
import { Table, type TableProps } from './table.js';
import type { TableColumn, TableColumnGroup } from './index.js';

interface Fruit {
  id: string;
  name: string;
  weight: number;
  price: number;
  origin: string;
}

const fruit: Fruit[] = [{ id: 'fig', name: 'Fig', weight: 50, price: 2, origin: 'Izmir' }];
const columns: TableColumn<Fruit>[] = [
  { id: 'name', header: 'Name' },
  { id: 'weight', header: 'Weight' },
  { id: 'price', header: 'Price' },
  { id: 'origin', header: 'Origin' },
];
const groups: TableColumnGroup[] = [
  { id: 'measures', header: 'Measures', columns: ['weight', 'price'] },
];

function renderFruit(props: Partial<TableProps<Fruit>> = {}) {
  return render(
    <Table aria-label="Fruit" rows={fruit} columns={columns} columnGroups={groups} {...props} />,
  );
}

// Full React Aria tables are slow in jsdom on a busy machine.
describe('Table column groups', { timeout: 15_000 }, () => {
  it('UIC-TABLE-8.7 draws a group row over runs of grouped columns', () => {
    const { container } = renderFruit({ selectionMode: 'multiple', renderRowActions: () => null });
    const rows = within(requireDefined(container.querySelector('thead'))).getAllByRole('row', {
      hidden: true,
    });
    expect(rows).toHaveLength(2);
    const cells = [...requireDefined(rows[0]).children] as HTMLElement[];
    expect(
      cells.map((cell) => [cell.tagName, cell.textContent, cell.getAttribute('colspan')]),
    ).toEqual([
      ['TD', '', '2'],
      ['TH', 'Measures', '2'],
      ['TD', '', '2'],
    ]);
    const group = screen.getByRole('columnheader', { name: 'Measures' });
    expect(group).toHaveAttribute('scope', 'colgroup');
    expect(group).toHaveClass('ui-table__column-group');
    expect(cells[0]).toHaveAttribute('aria-hidden', 'true');
    expect(cells[0]).toHaveAttribute('data-ungrouped', 'true');
    expect(screen.getAllByRole('columnheader')).toHaveLength(7);
    expectHooksMatchSpec(container, 'TABLE', { slots: ['column-group'] });
  });

  it('UIC-TABLE-8.7 splits a group whose columns are moved apart', () => {
    const { container } = renderFruit({ columnLayout: { order: ['weight', 'name', 'price'] } });
    const row = requireDefined(container.querySelector('thead tr'));
    expect([...row.children].map((cell) => cell.textContent)).toEqual([
      'Measures',
      '',
      'Measures',
      '',
    ]);
  });

  it('UIC-TABLE-8.7 draws no group row without groups', () => {
    const { container } = renderFruit({ columnGroups: [] });
    expect(container.querySelectorAll('thead tr')).toHaveLength(1);
  });

  it('UIC-TABLE-8.7 draws the group row in a virtualized table, spanning its columns', () => {
    const { container } = renderFruit({ virtualized: true });
    const group = screen.getByRole('columnheader', { name: 'Measures' });
    expect(group).toHaveClass('ui-table__column-group');
    expect(group).toHaveAttribute('aria-colindex', '2');
    expect(group).toHaveAttribute('aria-colspan', '2');
    const gaps = container.querySelectorAll('.ui-table__column-group[data-ungrouped]');
    expect([...gaps].map((gap) => gap.getAttribute('aria-hidden'))).toEqual(['true', 'true']);
    expectHooksMatchSpec(container, 'TABLE', { slots: ['column-group'] });
  });
});
