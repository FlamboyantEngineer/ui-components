import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Table, type TableProps } from './table.js';
import type { TableColumn } from './table-rows.js';

interface Item {
  id: string;
  name: string;
  amount: number;
}

const items: Item[] = Array.from({ length: 7 }, (_, index) => ({
  id: `item-${index + 1}`,
  name: `Item ${index + 1}`,
  amount: (index * 3) % 7,
}));
const columns: TableColumn<Item>[] = [
  { id: 'name', header: 'Name', allowsSorting: true },
  { id: 'amount', header: 'Amount', allowsSorting: true },
];

const names = () => screen.queryAllByRole('rowheader').map((cell) => cell.textContent);
const pages = () => screen.getByRole('navigation', { name: 'Items pagination' });

function renderItems(props: Partial<TableProps<Item>> = {}) {
  return render(<Table aria-label="Items" rows={items} columns={columns} {...props} />);
}

function ControlledPages({ onPageChange }: { onPageChange: (page: number) => void }) {
  const [page, setPage] = useState(3);
  return (
    <Table
      aria-label="Items"
      rows={items}
      columns={columns}
      filterable
      pagination={{
        pageSize: 2,
        page,
        onPageChange: (next) => {
          setPage(next);
          onPageChange(next);
        },
      }}
    />
  );
}

// Full React Aria tables driven by userEvent are slow in jsdom on a busy machine.
describe('Table pagination', { timeout: 15_000 }, () => {
  it('UIC-TABLE-10.1 shows one page of rows under a named page navigation', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    const { container } = renderItems({ pagination: { pageSize: 3, onPageChange } });
    expect(names()).toEqual(['Item 1', 'Item 2', 'Item 3']);
    const navigation = pages();
    expect(navigation).toHaveClass('ui-pagination', 'ui-table__pagination');
    expect(within(navigation).getAllByRole('button', { name: /^Page/ })).toHaveLength(3);
    await user.click(within(navigation).getByRole('button', { name: 'Page 3' }));
    expect(names()).toEqual(['Item 7']);
    expect(onPageChange).toHaveBeenLastCalledWith(3);
    await user.click(within(navigation).getByRole('button', { name: 'Previous page' }));
    expect(names()).toEqual(['Item 4', 'Item 5', 'Item 6']);
    expectHooksMatchSpec(container, 'TABLE', { slots: ['pagination'] });
  });

  it('UIC-TABLE-10.1 pages the sorted and filtered rows and clamps a page beyond the last', () => {
    renderItems({
      pagination: { pageSize: 2, page: 9 },
      defaultSortDescriptor: { column: 'amount', direction: 'descending' },
      filterable: true,
      defaultFilter: { query: 'item' },
    });
    expect(names()).toEqual(['Item 1']);
    expect(within(pages()).getByRole('button', { name: 'Page 4' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('UIC-TABLE-10.2 shows rows paged by the caller as given, counting pages from rowCount', () => {
    renderItems({ rows: items.slice(0, 2), pagination: { pageSize: 2, page: 2, rowCount: 41 } });
    expect(names()).toEqual(['Item 1', 'Item 2']);
    expect(within(pages()).getByRole('button', { name: 'Page 21' })).toBeInTheDocument();
    expect(within(pages()).getByRole('button', { name: 'Page 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('UIC-TABLE-10.3 returns to the first page when the sort or the filter changes', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<ControlledPages onPageChange={onPageChange} />);
    expect(names()).toEqual(['Item 5', 'Item 6']);
    await user.click(screen.getByRole('columnheader', { name: /^Amount/ }));
    expect(onPageChange).toHaveBeenLastCalledWith(1);
    expect(names()).toEqual(['Item 1', 'Item 6']);
    await user.click(within(pages()).getByRole('button', { name: 'Page 2' }));
    expect(onPageChange).toHaveBeenLastCalledWith(2);
    await user.type(screen.getByRole('searchbox'), '7');
    expect(onPageChange).toHaveBeenLastCalledWith(1);
    expect(names()).toEqual(['Item 7']);
  });
});
