import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { Table, type TableProps } from './table.js';
import type { TableColumn } from './table-rows.js';

interface Item {
  id: string;
  name: string;
  kind: string;
  city: string;
  weight: number;
}

const items: Item[] = [
  { id: 'apple', name: 'Apple', kind: 'Fruit', city: 'Oslo', weight: 1200 },
  { id: 'mint', name: 'Mint', kind: 'Herb', city: 'Lima', weight: 30 },
  { id: 'pear', name: 'Pear', kind: 'Fruit', city: 'Lima', weight: 300 },
  { id: 'kale', name: 'Kale', kind: '', city: 'Oslo', weight: 70 },
];

const columns: TableColumn<Item>[] = [
  { id: 'name', header: 'Name', allowsSorting: true },
  { id: 'kind', header: 'Kind' },
  { id: 'city', header: 'City', aggregate: 'count' },
  { id: 'weight', header: 'Weight', align: 'end', aggregate: 'sum', allowsSorting: true },
  { id: 'max', header: 'Heaviest', getValue: (row) => row.weight, aggregate: 'max' },
  { id: 'min', header: 'Lightest', getValue: (row) => row.weight, aggregate: 'min' },
  { id: 'note', header: 'Note', aggregate: (rows) => `${rows.length} noted` },
];

function renderItems(props: Partial<TableProps<Item>> = {}) {
  return render(
    <Table aria-label="Items" rows={items} columns={columns} groupBy={['kind']} {...props} />,
  );
}

// A group row is named by its expand button, label and count.
const groupRow = (name: RegExp) => screen.getByRole('row', { name });
const dataNames = () =>
  [...document.querySelectorAll('.ui-table__row [role="rowheader"]')].map(
    (cell) => cell.textContent,
  );

// Full React Aria tables driven by userEvent are slow in jsdom on a busy machine.
describe('Table row groups', { timeout: 20_000 }, () => {
  it('UIC-TABLE-13.1 UIC-TABLE-13.2 UIC-TABLE-13.3 draws group header rows with counts and aggregates', () => {
    const { container } = renderItems({ selectionMode: 'multiple', renderRowActions: () => 'act' });
    expect(screen.getByRole('treegrid', { name: 'Items' })).toBeInTheDocument();
    const fruit = groupRow(/^Collapse Kind: Fruit 2 items$/);
    expect(fruit).toHaveClass('ui-table__group-row');
    expect(fruit).toHaveAttribute('aria-level', '1');
    expect(fruit).toHaveAttribute('aria-expanded', 'true');
    const label = within(fruit).getByText('Kind: Fruit');
    expect(label).toHaveClass('ui-table__group-label');
    const cell = label.closest('[role="rowheader"]');
    expect(cell).toHaveClass('ui-table__group-cell');
    expect(cell).toHaveAttribute('data-column', 'name');
    expect((cell as HTMLElement).style.getPropertyValue('--ui-table-level')).toBe('1');
    expect(
      within(fruit).getByText('2', { selector: '.ui-table__group-count' }),
    ).toBeInTheDocument();
    const aggregates = [...fruit.querySelectorAll('.ui-table__aggregate-cell')].map(
      (element) => `${element.getAttribute('data-kind')}:${element.textContent}`,
    );
    expect(aggregates).toEqual([
      'selection:',
      'data:',
      'data:2',
      'data:1,500',
      'data:1,200',
      'data:300',
      'data:2 noted',
      'actions:',
    ]);
    expect(groupRow(/Kind: Empty 1 item$/)).toBeInTheDocument();
    expect(dataNames()).toEqual(['Apple', 'Pear', 'Mint', 'Kale']);
    expect(screen.getByRole('row', { name: 'Apple' })).toHaveAttribute('aria-level', '2');
    expectHooksMatchSpec(container, 'TABLE', {
      slots: ['group-row', 'group-cell', 'group-label', 'group-count', 'aggregate-cell'],
    });
  });

  it('UIC-TABLE-13.1 nests groupings under group rows of each level', () => {
    renderItems({
      groupBy: [{ id: 'heavy', label: 'Heavy', getValue: (row) => row.weight >= 300 }, 'city'],
      defaultSortDescriptor: { column: 'name', direction: 'descending' },
    });
    const levels = screen
      .getAllByRole('row')
      .slice(1)
      .map((row) => row.getAttribute('aria-level'));
    expect(levels).toEqual(['1', '2', '3', '2', '3', '1', '2', '3', '2', '3']);
    expect(dataNames()).toEqual(['Mint', 'Kale', 'Pear', 'Apple']);
    expect(groupRow(/Heavy: false/)).toBeInTheDocument();
    const lima = screen.getAllByRole('row', { name: /City: Lima 1 item$/ });
    expect(lima.map((row) => row.getAttribute('aria-level'))).toEqual(['2', '2']);
  });

  it('UIC-TABLE-13.1 orders groups by the sort of their column and sorts rows inside groups', async () => {
    const user = userEvent.setup();
    renderItems({
      defaultSortDescriptors: [
        { column: 'kind', direction: 'descending' },
        { column: 'name', direction: 'descending' },
      ],
    });
    const groups = () =>
      [...document.querySelectorAll('.ui-table__group-label')].map((label) => label.textContent);
    expect(groups()).toEqual(['Kind: Herb', 'Kind: Fruit', 'Kind: Empty']);
    expect(dataNames()).toEqual(['Mint', 'Pear', 'Apple', 'Kale']);
    await user.click(screen.getByRole('columnheader', { name: /^Weight/ }));
    expect(groups()).toEqual(['Kind: Fruit', 'Kind: Herb', 'Kind: Empty']);
    expect(dataNames()).toEqual(['Pear', 'Apple', 'Mint', 'Kale']);
  });

  it('UIC-TABLE-13.4 collapses groups from the button and the arrow keys, reporting the collapsed keys', async () => {
    const user = userEvent.setup();
    const onCollapsedGroupsChange = vi.fn();
    const onExpandedChange = vi.fn();
    renderItems({ onCollapsedGroupsChange, onExpandedChange });
    const fruit = groupRow(/Kind: Fruit/);
    await user.click(within(fruit).getByRole('button', { name: /^Collapse Kind: Fruit/ }));
    expect(onCollapsedGroupsChange).toHaveBeenLastCalledWith(
      new Set(['ui-table-group:kind=Fruit']),
    );
    expect(onExpandedChange).not.toHaveBeenCalled();
    expect(fruit).toHaveAttribute('aria-expanded', 'false');
    expect(dataNames()).toEqual(['Mint', 'Kale']);
    fruit.focus();
    await user.keyboard('{ArrowRight}');
    expect(dataNames()).toEqual(['Apple', 'Pear', 'Mint', 'Kale']);
    expect(onCollapsedGroupsChange).toHaveBeenLastCalledWith(new Set());
    groupRow(/Kind: Herb/).focus();
    await user.keyboard('{ArrowLeft}');
    expect(dataNames()).toEqual(['Apple', 'Pear', 'Kale']);
  });

  it('UIC-TABLE-13.4 takes controlled and default collapsed groups and keeps keys of groups not drawn', async () => {
    const user = userEvent.setup();
    const onCollapsedGroupsChange = vi.fn();
    const { unmount } = renderItems({
      collapsedGroups: ['ui-table-group:kind=Herb', 'ui-table-group:kind=Gone'],
      onCollapsedGroupsChange,
    });
    expect(dataNames()).toEqual(['Apple', 'Pear', 'Kale']);
    await user.click(screen.getByRole('button', { name: /^Collapse Kind: Empty/ }));
    expect(onCollapsedGroupsChange).toHaveBeenLastCalledWith(
      new Set(['ui-table-group:kind=Herb', 'ui-table-group:kind=Gone', 'ui-table-group:kind=']),
    );
    expect(dataNames()).toEqual(['Apple', 'Pear', 'Kale']);
    unmount();
    renderItems({ defaultCollapsedGroups: ['ui-table-group:kind=Fruit'] });
    expect(dataNames()).toEqual(['Mint', 'Kale']);
  });

  it('UIC-TABLE-13.2 never selects, activates or drags group rows, and labels them through the caller', async () => {
    const user = userEvent.setup();
    const onRowAction = vi.fn();
    const onSelectionChange = vi.fn();
    renderItems({
      selectionMode: 'multiple',
      selectionBehavior: 'replace',
      onRowAction,
      onSelectionChange,
      reorder: { onMove: () => {} },
      renderGroupLabel: (group) => <em>{`${group.label} is ${String(group.value)}`}</em>,
    });
    expect(screen.getByText('Kind is Fruit').tagName).toBe('EM');
    const fruit = groupRow(/Kind is Fruit 2 items$/);
    await user.click(screen.getByText('Kind is Fruit'));
    expect(onSelectionChange).not.toHaveBeenCalled();
    fruit.focus();
    await user.keyboard('{Enter}');
    expect(onRowAction).not.toHaveBeenCalled();
    expect(document.querySelector('.ui-table__drag-handle')).toBeNull();
    await user.dblClick(screen.getByRole('row', { name: 'Apple' }));
    expect(onRowAction).toHaveBeenCalledWith('apple');
  });

  it('UIC-TABLE-13.3 formats built-in aggregates for the provider locale', () => {
    render(
      <UiProvider locale="de-DE">
        <Table aria-label="Items" rows={items} columns={columns} groupBy={['kind']} />
      </UiProvider>,
    );
    expect(within(groupRow(/Kind: Fruit/)).getByText('1.500')).toBeInTheDocument();
  });

  it('UIC-TABLE-13.1 groups the rows of the current page and leaves an empty table ungrouped', () => {
    const { rerender } = renderItems({ pagination: { pageSize: 2 } });
    expect(dataNames()).toEqual(['Apple', 'Mint']);
    expect(screen.getAllByRole('row', { name: /Kind:/ })).toHaveLength(2);
    rerender(<Table aria-label="Items" rows={[]} columns={columns} groupBy={['kind']} />);
    expect(screen.getByRole('grid', { name: 'Items' })).toBeInTheDocument();
  });
});
