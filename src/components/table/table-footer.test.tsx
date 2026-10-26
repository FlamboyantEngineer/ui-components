import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { requireDefined } from '../../utils/require-defined.js';
import { Table, type TableProps } from './table.js';
import type { TableColumn } from './table-rows.js';

interface Fruit {
  id: string;
  name: string;
  weight: number;
}

const fruit: Fruit[] = [
  { id: 'apple', name: 'Apple', weight: 30 },
  { id: 'pear', name: 'Pear', weight: 60 },
  { id: 'fig', name: 'Fig', weight: 50 },
];
const columns: TableColumn<Fruit>[] = [
  { id: 'name', header: 'Name', renderFooter: (rows) => `${rows.length} fruit` },
  {
    id: 'weight',
    header: 'Weight',
    align: 'end',
    renderFooter: (rows) => `${rows.reduce((total, row) => total + row.weight, 0)} g`,
  },
];

function renderFruit(props: Partial<TableProps<Fruit>> = {}) {
  return render(<Table aria-label="Fruit" rows={fruit} columns={columns} {...props} />);
}

// Full React Aria tables driven by userEvent are slow in jsdom on a busy machine.
describe('Table summary row', { timeout: 15_000 }, () => {
  it('UIC-TABLE-12.1 sums every presented row in a footer row under the rows', async () => {
    const user = userEvent.setup();
    const onRowAction = vi.fn();
    const { container } = renderFruit({
      selectionMode: 'multiple',
      onRowAction,
      renderRowActions: () => null,
      pagination: { pageSize: 1 },
      defaultFilter: { query: 'p' },
    });
    const footer = container.querySelector('tfoot.ui-table__footer') as HTMLElement;
    const row = footer.querySelector('.ui-table__footer-row') as HTMLElement;
    const cells = [...row.querySelectorAll('.ui-table__footer-cell')];
    expect(cells.map((cell) => cell.textContent)).toEqual(['', '2 fruit', '90 g', '']);
    expect(cells.map((cell) => cell.getAttribute('data-kind'))).toEqual([
      'selection',
      'data',
      'data',
      'actions',
    ]);
    expect(cells[2]).toHaveAttribute('data-align', 'end');
    expect(cells[2]).toHaveAttribute('data-column', 'weight');
    expect(row.querySelector('[role="checkbox"], input')).toBeNull();
    await user.click(screen.getByRole('checkbox', { name: 'Select All' }));
    expect(row).toHaveAttribute('aria-selected', 'false');
    await user.click(requireDefined(cells[1]));
    await user.keyboard('{Enter}');
    expect(onRowAction).not.toHaveBeenCalled();
    expectHooksMatchSpec(container, 'TABLE', { slots: ['footer', 'footer-row', 'footer-cell'] });
  });

  it('UIC-TABLE-12.1 keeps the summary row of nested rows out of the tree positions', () => {
    const { container } = renderFruit({
      getChildRows: (row) => (row.id === 'apple' ? [{ id: 'crab', name: 'Crab', weight: 5 }] : []),
    });
    expect(screen.getByRole('treegrid', { name: 'Fruit' })).toBeInTheDocument();
    const row = container.querySelector('.ui-table__footer-row') as HTMLElement;
    expect(row).toHaveTextContent('3 fruit');
    expect(row).not.toHaveAttribute('aria-posinset');
    expect(row).not.toHaveAttribute('aria-setsize');
  });

  it('UIC-TABLE-12.1 draws no summary row without footers or while a notice shows', () => {
    const { container } = renderFruit({ columns: [{ id: 'name', header: 'Name' }] });
    expect(container.querySelector('.ui-table__footer')).toBeNull();
    const { container: empty } = renderFruit({ rows: [] });
    expect(empty.querySelector('.ui-table__footer')).toBeNull();
  });
});
