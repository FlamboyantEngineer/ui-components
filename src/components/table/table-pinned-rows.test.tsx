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
  count: number;
  parts?: Item[];
}

const items: Item[] = [
  { id: 'a', name: 'Apple', kind: 'Fruit', count: 4 },
  { id: 'b', name: 'Basil', kind: 'Herb', count: 2 },
  { id: 'c', name: 'Cherry', kind: 'Fruit', count: 9 },
  { id: 'd', name: 'Dill', kind: 'Herb', count: 1 },
  {
    id: 'e',
    name: 'Eggplant',
    kind: 'Vegetable',
    count: 6,
    parts: [{ id: 'e1', name: 'Eggplant seed', kind: 'Vegetable', count: 1 }],
  },
];

const columns: TableColumn<Item>[] = [
  { id: 'name', header: 'Name', allowsSorting: true, allowsEditing: true },
  { id: 'kind', header: 'Kind' },
  { id: 'count', header: 'Count', align: 'end', allowsSorting: true },
];

function renderPinned(props: Partial<TableProps<Item>> = {}) {
  return render(
    <Table
      aria-label="Items"
      rows={items}
      columns={columns}
      pinnedRows={{ top: ['c'], bottom: ['a'] }}
      {...props}
    />,
  );
}

const names = () => screen.getAllByRole('rowheader').map((header) => header.textContent);
const row = (name: string) => screen.getByRole('row', { name });

// Full React Aria tables driven by userEvent are slow in jsdom on a busy machine.
describe('Table pinned rows', { timeout: 15_000 }, () => {
  it('UIC-TABLE-18.1 draws pinned rows once, at their edges, in the keys’ order', () => {
    const { container } = renderPinned({
      pinnedRows: { top: ['d', 'missing', 'c', 'e1'], bottom: ['c', 'a'] },
    });
    expect(names()).toEqual(['Dill', 'Cherry', 'Basil', 'Eggplant', 'Apple']);
    expect(row('Dill')).toHaveAttribute('data-pinned', 'top');
    expect(row('Cherry')).toHaveAttribute('data-pinned', 'top');
    expect(row('Apple')).toHaveAttribute('data-pinned', 'bottom');
    expect(row('Basil')).not.toHaveAttribute('data-pinned');
    expect(container.querySelectorAll('.ui-table__body > .ui-table__row')).toHaveLength(5);
    expectHooksMatchSpec(container, 'TABLE', { slots: ['row', 'cell'] });
  });

  it('UIC-TABLE-18.2 keeps pinned rows out of the filter, the sort and the pages', async () => {
    const user = userEvent.setup();
    renderPinned({ filterable: true, pagination: { pageSize: 2 } });
    expect(names()).toEqual(['Cherry', 'Basil', 'Dill', 'Apple']);
    expect(screen.getByRole('button', { name: /page 2/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /page 3/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole('columnheader', { name: /Count/ }));
    expect(names()).toEqual(['Cherry', 'Dill', 'Basil', 'Apple']);
    await user.type(screen.getByRole('searchbox', { name: 'Filter rows' }), 'egg');
    expect(names()).toEqual(['Cherry', 'Eggplant', 'Apple']);
    await user.clear(screen.getByRole('searchbox', { name: 'Filter rows' }));
    await user.type(screen.getByRole('searchbox', { name: 'Filter rows' }), 'zzz');
    expect(names()).toEqual(['Cherry', 'Apple']);
  });

  it('UIC-TABLE-18.2 draws a pinned row without its child and detail rows, outside groups', () => {
    renderPinned({
      pinnedRows: { top: ['e'] },
      getChildRows: (item) => item.parts,
      defaultExpandedKeys: ['e'],
      renderRowDetail: (item) => `About ${item.name}`,
      groupBy: ['kind'],
    });
    const pinned = row('Eggplant');
    expect(pinned).toHaveAttribute('data-pinned', 'top');
    expect(pinned.querySelector('.ui-table__expand')).toBeNull();
    expect(screen.queryByText('About Eggplant')).not.toBeInTheDocument();
    expect(screen.queryByRole('row', { name: 'Eggplant seed' })).not.toBeInTheDocument();
    expect(screen.getByRole('treegrid').querySelector('.ui-table__body > [role="row"]')).toBe(
      pinned,
    );
    expect(screen.getAllByRole('row', { name: /Kind:/ })).toHaveLength(2);
  });

  it('UIC-TABLE-18.3 selects, edits and acts on pinned rows; reordering never moves them', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const onCellsChange = vi.fn();
    const onRowAction = vi.fn();
    renderPinned({
      selectionMode: 'multiple',
      onSelectionChange,
      onCellsChange: onCellsChange,
      onRowAction,
      reorder: { onMove: vi.fn(), dragTrigger: 'handle' },
    });
    await user.click(row('Cherry').querySelector('.ui-table__checkbox') as HTMLElement);
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['c']));
    const cell = within(row('Apple')).getByRole('rowheader');
    await user.dblClick(cell);
    await user.keyboard('{Control>}a{/Control}Avocado{Enter}');
    expect(onCellsChange).toHaveBeenCalledWith([
      { row: items[0], columnId: 'name', value: 'Avocado' },
    ]);
    const handle = (name: string) => within(row(name)).getByRole('button', { name: /Drag/ });
    expect(handle('Cherry')).toBeDisabled();
    expect(handle('Basil')).toBeEnabled();
  });

  it('UIC-TABLE-18.4 publishes each pinned row’s offset past the sticky header and earlier pins', () => {
    const heights = vi
      .spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
      .mockImplementation(function measure(this: HTMLElement) {
        if (this.classList.contains('ui-table__header')) return 30;
        if (this.classList.contains('ui-table__footer')) return 25;
        return this.classList.contains('ui-table__row') ? 40 : 0;
      });
    try {
      const sticky: TableColumn<Item>[] = [
        ...columns,
        { id: 'total', header: 'Total', renderFooter: (rows) => rows.length },
      ];
      const { rerender } = renderPinned({
        stickyHeader: true,
        columns: sticky,
        pinnedRows: { top: ['c', 'd'], bottom: ['a', 'b'] },
      });
      const offset = (name: string) => row(name).style.getPropertyValue('--ui-table-row-offset');
      expect(offset('Cherry')).toBe('30px');
      expect(offset('Dill')).toBe('70px');
      expect(offset('Basil')).toBe('25px');
      expect(offset('Apple')).toBe('65px');
      expect(row('Eggplant').style.getPropertyValue('--ui-table-row-offset')).toBe('');
      rerender(
        <Table
          aria-label="Items"
          rows={items}
          columns={sticky}
          pinnedRows={{ top: ['c', 'd'], bottom: ['a', 'b'] }}
        />,
      );
      expect(offset('Cherry')).toBe('0px');
      expect(offset('Dill')).toBe('40px');
      expect(offset('Basil')).toBe('0px');
    } finally {
      heights.mockRestore();
    }
  });

  it('UIC-TABLE-18.4 keeps watching the pinned rows across renders without watching them again', () => {
    const watched: Element[] = [];
    class CountingObserver {
      observe(element: Element) {
        watched.push(element);
      }
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', CountingObserver);
    try {
      const pinned = { top: ['c'], bottom: ['a'] };
      const { rerender } = renderPinned({ pinnedRows: pinned });
      const pinnedRows = () =>
        watched.filter((element) => element.matches('.ui-table__row[data-pinned]')).length;
      const before = pinnedRows();
      expect(before).toBeGreaterThan(0);
      rerender(
        <Table aria-label="Items" rows={[...items]} columns={columns} pinnedRows={pinned} />,
      );
      expect(pinnedRows()).toBe(before);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('UIC-TABLE-18.4 orders pinned rows in a virtualized table without offsets', () => {
    const sizes = { clientWidth: 600, clientHeight: 400 };
    for (const [name, value] of Object.entries(sizes)) {
      Object.defineProperty(HTMLElement.prototype, name, { configurable: true, get: () => value });
    }
    try {
      renderPinned({ virtualized: true, rowHeight: 30 });
      expect(names()).toEqual(['Cherry', 'Basil', 'Dill', 'Eggplant', 'Apple']);
      expect(row('Cherry')).toHaveAttribute('data-pinned', 'top');
      expect(row('Cherry').style.getPropertyValue('--ui-table-row-offset')).toBe('');
    } finally {
      for (const name of Object.keys(sizes)) Reflect.deleteProperty(HTMLElement.prototype, name);
    }
  });
});
