import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import type { Selection, SortDescriptor } from '../../core/props.js';
import { requireDefined } from '../../utils/require-defined.js';
import { Button } from '../button/button.js';
import { Checkbox } from '../checkbox/checkbox.js';
import { Table } from './table.js';
import type { TableColumn } from './table-rows.js';

interface Fruit {
  id: string;
  name: string;
  colour: string;
  weight: number;
}

const fruit: readonly Fruit[] = Object.freeze([
  { id: 'banana', name: 'Banana', colour: 'Yellow', weight: 120 },
  { id: 'apple', name: 'Apple', colour: 'Red', weight: 30 },
  { id: 'cherry', name: 'Cherry', colour: 'Red', weight: 100 },
]);

const columns: TableColumn<Fruit>[] = [
  { id: 'name', header: 'Name', allowsSorting: true },
  { id: 'colour', header: 'Colour' },
  { id: 'weight', header: 'Weight', align: 'end', allowsSorting: true },
];

const names = () => screen.getAllByRole('rowheader').map((cell) => cell.textContent);
const header = (name: string) => screen.getByRole('columnheader', { name: new RegExp(`^${name}`) });
/** The column tracks a static table draws (UIC-TABLE-4.6). */
const tracks = () => screen.getByRole('grid').style.getPropertyValue('--ui-table-columns');

// Full React Aria tables driven by userEvent are slow in jsdom on a busy machine.
describe('Table', { timeout: 15_000 }, () => {
  it('UIC-TABLE-4.5 publishes content and default flex sizing without changing row values', () => {
    const { container } = render(
      <Table
        aria-label="Content-sized fruit"
        rows={fruit}
        columns={[
          { id: 'name', header: 'Name', width: 'content', minWidth: 100 },
          { id: 'colour', header: 'Colour' },
        ]}
      />,
    );
    expect(header('Name')).toHaveAttribute('data-sizing', 'content');
    expect(tracks()).toBe('100px minmax(75px, 1fr)');
    expect(header('Colour')).toHaveAttribute('data-sizing', 'flex');
    expect(names()).toEqual(['Banana', 'Apple', 'Cherry']);
    expectHooksMatchSpec(container, 'TABLE');
  });
  it('UIC-TABLE-3.1 preserves Shift range anchors while a caller controls typed row selections', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const rows = [
      { id: 1, name: 'Numeric' },
      { id: '1', name: 'Textual' },
      { id: 'a b', name: 'Spaced' },
      { id: 'ab', name: 'Compact' },
    ];
    function Controlled() {
      const [selected, setSelected] = useState<Selection>(new Set());
      return (
        <Table
          aria-label="Keys"
          rows={rows}
          columns={[{ id: 'name', header: 'Name' }]}
          selectionMode="multiple"
          selectionBehavior="replace"
          selectedKeys={selected}
          onSelectionChange={(keys) => {
            setSelected(keys);
            onSelectionChange(keys);
          }}
        />
      );
    }
    render(<Controlled />);
    await user.click(screen.getByRole('row', { name: 'Numeric' }));
    await user.keyboard('{Shift>}');
    await user.click(screen.getByRole('row', { name: 'Compact' }));
    await user.keyboard('{/Shift}');
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set([1, '1', 'a b', 'ab']));
  });
  it('UIC-TABLE-1.7 keeps trailing actions reachable without selecting a row', async () => {
    const user = userEvent.setup();
    const add = vi.fn();
    const select = vi.fn();
    const action = vi.fn();
    const { container } = render(
      <Table
        aria-label="Items"
        rows={fruit}
        columns={columns}
        selectionMode="single"
        onSelectionChange={select}
        onRowAction={action}
        trailingContent={<Button onPress={add}>Add item</Button>}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Add item' }));
    expect(add).toHaveBeenCalledTimes(1);
    expect(select).not.toHaveBeenCalled();
    expect(action).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Add item' }).closest('td')).toHaveAttribute(
      'colspan',
      '3',
    );
    expectHooksMatchSpec(container, 'TABLE', { slots: ['action-row', 'action-cell'] });
  });
  it('UIC-TABLE-1.1 renders one row per item and one cell per column as React nodes', () => {
    const { container } = render(
      <Table
        aria-label="Fruit"
        rows={fruit}
        columns={[
          ...columns,
          { id: 'note', header: 'Note', renderCell: (row) => <em>{`<b>${row.name}</b>`}</em> },
        ]}
      />,
    );
    const grid = screen.getByRole('grid', { name: 'Fruit' });
    expect(within(grid).getAllByRole('columnheader')).toHaveLength(4);
    expect(within(grid).getAllByRole('row')).toHaveLength(4);
    expect(names()).toEqual(['Banana', 'Apple', 'Cherry']);
    expect(screen.getAllByRole('gridcell').map((cell) => cell.textContent)).toEqual([
      'Yellow',
      '120',
      '<b>Banana</b>',
      'Red',
      '30',
      '<b>Apple</b>',
      'Red',
      '100',
      '<b>Cherry</b>',
    ]);
    expect(container.querySelector('b')).toBeNull();
    expectHooksMatchSpec(container, 'TABLE', {
      slots: [
        'scroll',
        'grid',
        'header',
        'column',
        'column-label',
        'sort-icon',
        'body',
        'row',
        'cell',
      ],
    });
  });

  it('UIC-TABLE-1.1 names rows by the columns marked as row headers', () => {
    render(
      <Table
        aria-label="Fruit"
        rows={fruit}
        columns={[requireDefined(columns[1]), { ...requireDefined(columns[0]), isRowHeader: true }]}
      />,
    );
    expect(names()).toEqual(['Banana', 'Apple', 'Cherry']);
    expect(screen.getAllByRole('row')[1]).toHaveAccessibleName('Banana');
  });

  it('UIC-TABLE-1.2 publishes the kind, alignment and id of each column on headers and cells', () => {
    render(<Table aria-label="Fruit" rows={fruit} columns={columns} />);
    expect(header('Weight')).toHaveAttribute('data-align', 'end');
    expect(header('Weight')).toHaveAttribute('data-column', 'weight');
    expect(header('Name')).toHaveAttribute('data-align', 'start');
    const weight = screen.getByRole('gridcell', { name: '30' });
    expect(weight).toHaveAttribute('data-kind', 'data');
    expect(weight).toHaveAttribute('data-align', 'end');
    expect(weight).toHaveAttribute('data-column', 'weight');
  });

  it('UIC-TABLE-1.6 publishes nowrap on every data cell by default', () => {
    render(<Table aria-label="Fruit" rows={fruit} columns={columns} />);
    for (const cell of screen.getAllByRole('gridcell')) {
      expect(cell).toHaveAttribute('data-wrap', 'nowrap');
    }
    expect(header('Name')).not.toHaveAttribute('data-wrap');
  });

  it('UIC-TABLE-1.6 resolves column overrides over the table default in every row', async () => {
    const user = userEvent.setup();
    const onRowAction = vi.fn();
    render(
      <Table
        aria-label="Fruit"
        rows={fruit}
        cellWrap="wrap"
        selectionMode="multiple"
        onRowAction={onRowAction}
        renderRowActions={() => null}
        columns={[
          { id: 'name', header: 'Name', cellWrap: 'nowrap' },
          { id: 'colour', header: 'Colour', renderCell: (row) => <em>{row.colour}</em> },
          { id: 'id', header: 'Id', cellWrap: 'anywhere', renderFooter: () => 'All' },
        ]}
      />,
    );
    const wraps = (columnId: string) =>
      [...document.querySelectorAll(`.ui-table__cell[data-column="${columnId}"]`)].map((cell) =>
        cell.getAttribute('data-wrap'),
      );
    expect(wraps('name')).toEqual(['nowrap', 'nowrap', 'nowrap']);
    expect(wraps('colour')).toEqual(['wrap', 'wrap', 'wrap']);
    expect(wraps('id')).toEqual(['anywhere', 'anywhere', 'anywhere']);
    expect(screen.getByRole('gridcell', { name: 'All' })).toHaveAttribute('data-wrap', 'anywhere');
    const selection = document.querySelector('.ui-table__cell[data-kind="selection"]');
    expect(selection).not.toHaveAttribute('data-wrap');
    const yellow = screen.getByRole('gridcell', { name: 'Yellow' });
    expect(yellow.querySelector('em')).toHaveTextContent('Yellow');
    await user.click(yellow);
    expect(onRowAction).toHaveBeenCalledWith('banana');
  });

  it('UIC-TABLE-1.3 names columns from their header text or textValue', async () => {
    const user = userEvent.setup();
    render(
      <Table
        aria-label="Fruit"
        rows={fruit}
        columns={[
          {
            id: 'name',
            header: <strong>Name</strong>,
            textValue: 'Fruit name',
            allowsSorting: true,
            allowsResizing: true,
          },
        ]}
        renderRowActions={() => null}
      />,
    );
    expect(screen.getByRole('slider', { name: /^Resize Name/ })).toBeInTheDocument();
    expect(header('Actions').querySelector('.ui-table__column-label')).toHaveTextContent('Actions');
    expect(header('Actions')).toHaveAttribute('data-kind', 'actions');
    await user.click(header('Name'));
    await waitFor(() => expect(document.body).toHaveTextContent(/sorted by column Fruit name/));
  });

  it('UIC-TABLE-1.3 takes a free checkbox and button in header content', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onPress = vi.fn();
    const onSelectionChange = vi.fn();
    render(
      <Table
        aria-label="Fruit"
        rows={fruit}
        selectionMode="multiple"
        onSelectionChange={onSelectionChange}
        columns={[
          {
            id: 'name',
            textValue: 'Name',
            header: (
              <>
                Name <Checkbox onChange={onChange}>Exact</Checkbox>{' '}
                <Button variant="bare" size="xs" onPress={onPress}>
                  Help
                </Button>
              </>
            ),
          },
        ]}
      />,
    );
    await user.click(screen.getByRole('checkbox', { name: 'Exact' }));
    expect(onChange).toHaveBeenCalledWith(true);
    await user.click(screen.getByRole('button', { name: 'Help' }));
    expect(onPress).toHaveBeenCalledOnce();
    expect(onSelectionChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole('checkbox', { name: 'Select All' }));
    expect(onSelectionChange).toHaveBeenCalledOnce();
  });

  it('UIC-TABLE-1.4 forwards ref to its root', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <Table aria-label="Fruit" rows={fruit} columns={columns} ref={ref} />,
    );
    expect(ref.current).toBe(container.querySelector('.ui-table'));
  });

  it('UIC-TABLE-1.4 UIC-TABLE-7.1 appends the class, forwards id and data attributes to the root', () => {
    const { container, rerender } = render(
      <Table
        aria-label="Fruit"
        rows={fruit}
        columns={columns}
        className="caller"
        id="fruit-table"
        data-testid="probe"
        aria-describedby="fruit-help"
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass('ui-table', 'caller');
    expect(root).toHaveAttribute('id', 'fruit-table');
    expect(root).toHaveAttribute('data-testid', 'probe');
    expect(root).toHaveAttribute('data-size', 'md');
    expect(screen.getByRole('grid')).toHaveAttribute('aria-describedby', 'fruit-help');
    expect(screen.getByRole('grid')).not.toHaveAttribute('data-testid');
    rerender(<Table aria-label="Fruit" rows={fruit} columns={columns} size="sm" />);
    expect(container.firstElementChild).toHaveAttribute('data-size', 'sm');
    expectHooksMatchSpec(container, 'TABLE');
  });

  it('UIC-TABLE-2.1 cycles a header through ascending, descending and unsorted', async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    render(<Table aria-label="Fruit" rows={fruit} columns={columns} onSortChange={onSortChange} />);
    await user.click(header('Name'));
    expect(header('Name')).toHaveAttribute('aria-sort', 'ascending');
    expect(header('Name')).toHaveAttribute('data-sort-direction', 'ascending');
    expect(header('Weight')).toHaveAttribute('aria-sort', 'none');
    expect(names()).toEqual(['Apple', 'Banana', 'Cherry']);
    await user.keyboard('{Enter}');
    expect(header('Name')).toHaveAttribute('aria-sort', 'descending');
    expect(names()).toEqual(['Cherry', 'Banana', 'Apple']);
    await user.keyboard('{Enter}');
    expect(header('Name')).toHaveAttribute('aria-sort', 'none');
    expect(names()).toEqual(['Banana', 'Apple', 'Cherry']);
    expect(onSortChange.mock.calls).toEqual([
      [{ column: 'name', direction: 'ascending' }],
      [{ column: 'name', direction: 'descending' }],
      [null],
    ]);
  });

  it('UIC-TABLE-2.2 orders its own rows numerically from a default sort without mutating them', async () => {
    const user = userEvent.setup();
    render(
      <Table
        aria-label="Fruit"
        rows={fruit}
        columns={columns}
        defaultSortDescriptor={{ column: 'weight', direction: 'ascending' }}
      />,
    );
    expect(names()).toEqual(['Apple', 'Cherry', 'Banana']);
    await user.click(header('Weight'));
    expect(names()).toEqual(['Banana', 'Cherry', 'Apple']);
    expect(fruit.map((row) => row.id)).toEqual(['banana', 'apple', 'cherry']);
  });

  it('UIC-TABLE-2.3 renders rows as given while the caller owns the sort', async () => {
    const user = userEvent.setup();
    function Owner() {
      const [sort, setSort] = useState<SortDescriptor | null>(null);
      return (
        <Table
          aria-label="Fruit"
          rows={fruit}
          columns={columns}
          sortDescriptor={sort}
          onSortChange={setSort}
        />
      );
    }
    render(<Owner />);
    await user.click(header('Name'));
    expect(header('Name')).toHaveAttribute('aria-sort', 'ascending');
    expect(names()).toEqual(['Banana', 'Apple', 'Cherry']);
  });

  it('UIC-TABLE-2.4 shows one decorative sort glyph per sortable header', async () => {
    const user = userEvent.setup();
    render(<Table aria-label="Fruit" rows={fruit} columns={columns} />);
    const glyph = (name: string) => header(name).querySelectorAll('.ui-table__sort-icon');
    expect(glyph('Name')).toHaveLength(1);
    expect(glyph('Colour')).toHaveLength(0);
    expect(glyph('Name')[0]).toHaveAttribute('data-glyph', 'sort-none');
    expect(glyph('Name')[0]).toHaveAttribute('aria-hidden', 'true');
    await user.click(header('Name'));
    expect(glyph('Name')[0]).toHaveAttribute('data-glyph', 'sort-ascending');
    await user.click(header('Name'));
    expect(glyph('Name')[0]).toHaveAttribute('data-glyph', 'sort-descending');
    expect(glyph('Name')).toHaveLength(1);
  });

  it('UIC-TABLE-2.5 narrows the rows to those holding every term and clears with Escape', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Table aria-label="Fruit" rows={fruit} columns={columns} filterable />,
    );
    const search = screen.getByRole('searchbox', { name: 'Filter rows' });
    expect(search).toHaveAttribute('placeholder', 'Filter rows');
    await user.type(search, 'red 10');
    expect(names()).toEqual(['Cherry']);
    await user.clear(search);
    await user.type(search, 'plum');
    expect(screen.getByRole('row', { name: 'No results' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(names()).toEqual(['Banana', 'Apple', 'Cherry']);
    expectHooksMatchSpec(container, 'TABLE', {
      slots: ['filter', 'filter-icon', 'filter-input', 'filter-clear'],
    });
  });

  it('UIC-TABLE-2.5 sets the query aside while the search box is gone', async () => {
    const user = userEvent.setup();
    const table = (filterable: boolean) => (
      <Table aria-label="Fruit" rows={fruit} columns={columns} filterable={filterable} />
    );
    const { rerender } = render(table(true));
    await user.type(screen.getByRole('searchbox', { name: 'Filter rows' }), 'cherry');
    expect(names()).toEqual(['Cherry']);
    rerender(table(false));
    expect(names()).toEqual(['Banana', 'Apple', 'Cherry']);
    rerender(table(true));
    expect(screen.getByRole('searchbox', { name: 'Filter rows' })).toHaveValue('cherry');
    expect(names()).toEqual(['Cherry']);
  });

  it('UIC-TABLE-2.5 names the search box with filterLabel', () => {
    render(
      <Table
        aria-label="Fruit"
        rows={fruit}
        columns={columns}
        filterable
        filterLabel="Find fruit"
      />,
    );
    expect(screen.getByRole('searchbox', { name: 'Find fruit' })).toBeInTheDocument();
  });

  it('UIC-TABLE-3.1 selects rows with checkboxes and a select-all box with check and minus glyphs', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const { container } = render(
      <Table
        aria-label="Fruit"
        rows={fruit}
        columns={columns}
        selectionMode="multiple"
        disabledKeys={['cherry']}
        onSelectionChange={onSelectionChange}
      />,
    );
    const boxes = screen.getAllByRole('checkbox');
    expect(boxes).toHaveLength(4);
    expect(boxes[0]).toHaveAccessibleName('Select All');
    expect(boxes[1]).toHaveAccessibleName('Select Banana');
    await user.click(requireDefined(boxes[1]));
    expect(new Set(onSelectionChange.mock.lastCall?.[0])).toEqual(new Set(['banana']));
    const selectAll = container.querySelector('th .ui-table__checkbox') as HTMLElement;
    expect(selectAll).toHaveAttribute('data-indeterminate', 'true');
    expect(selectAll.querySelector('[data-glyph="minus"]')).not.toBeNull();
    expect(screen.getAllByRole('row')[1]).toHaveAttribute('data-selected', 'true');
    expect(container.querySelector('td [data-glyph="check"]')).not.toBeNull();
    await user.click(requireDefined(boxes[0]));
    expect(onSelectionChange.mock.lastCall?.[0]).toBe('all');
    expect(screen.getByRole('row', { name: 'Cherry' })).toHaveAttribute('aria-selected', 'false');
    expectHooksMatchSpec(container, 'TABLE', { slots: ['checkbox', 'checkbox-box'] });
  });

  it('UIC-TABLE-3.1 selects one row without a checkbox column in single mode', async () => {
    const user = userEvent.setup();
    render(
      <Table
        aria-label="Fruit"
        rows={fruit}
        columns={columns}
        selectionMode="single"
        defaultSelectedKeys={['apple']}
      />,
    );
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.getByRole('row', { name: 'Apple' })).toHaveAttribute('aria-selected', 'true');
    await user.click(screen.getByRole('rowheader', { name: 'Cherry' }));
    expect(screen.getByRole('row', { name: 'Cherry' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('row', { name: 'Apple' })).toHaveAttribute('aria-selected', 'false');
  });

  it('UIC-TABLE-3.2 reports the activated row key', async () => {
    const user = userEvent.setup();
    const onRowAction = vi.fn();
    render(<Table aria-label="Fruit" rows={fruit} columns={columns} onRowAction={onRowAction} />);
    await user.click(screen.getByRole('rowheader', { name: 'Apple' }));
    expect(onRowAction).toHaveBeenCalledWith('apple');
  });

  it('UIC-TABLE-3.3 draws row actions in a fixed column without activating the row', async () => {
    const user = userEvent.setup();
    const onRowAction = vi.fn();
    const onSelectionChange = vi.fn();
    const onEdit = vi.fn();
    render(
      <Table
        aria-label="Fruit"
        rows={fruit}
        columns={columns}
        selectionMode="multiple"
        onSelectionChange={onSelectionChange}
        onRowAction={onRowAction}
        actionsColumnWidth={72}
        renderRowActions={(row) => (
          <button onClick={() => onEdit(row.id)}>{`Edit ${row.name}`}</button>
        )}
      />,
    );
    expect(tracks()).toMatch(/ 72px$/);
    await user.click(screen.getByRole('button', { name: 'Edit Apple' }));
    expect(onEdit).toHaveBeenCalledWith('apple');
    expect(onRowAction).not.toHaveBeenCalled();
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Edit Apple' }).closest('td')).toHaveAttribute(
      'data-kind',
      'actions',
    );
  });

  it('UIC-TABLE-4.1 sizes columns from their widths and bounds, with fixed extra columns', () => {
    render(
      <Table
        aria-label="Fruit"
        rows={fruit}
        columns={[
          {
            id: 'name',
            header: 'Name',
            width: 160,
            minWidth: 100,
            maxWidth: 300,
            allowsResizing: true,
          },
          { id: 'weight', header: 'Weight', width: 40, minWidth: 90 },
        ]}
        selectionMode="multiple"
      />,
    );
    expect(tracks()).toBe('44px 160px 90px');
    const resizer = screen.getByRole('slider', { name: /^Resize Name/ });
    expect(resizer).toHaveAttribute('min', '100');
    expect(resizer).toHaveAttribute('max', '300');
  });

  it('UIC-TABLE-7.2 marks a sticky header on the root', () => {
    const { container } = render(
      <Table aria-label="Fruit" rows={fruit} columns={columns} stickyHeader />,
    );
    expect(container.firstElementChild).toHaveAttribute('data-sticky-header', 'true');
  });

  it('UIC-TABLE-7.3 renders only the fixed-height rows in view when virtualized', () => {
    // React Aria's virtualizer treats an unmocked test DOM as infinitely large.
    const sizes = { clientWidth: 600, clientHeight: 200 };
    for (const [name, value] of Object.entries(sizes)) {
      Object.defineProperty(HTMLElement.prototype, name, { configurable: true, get: () => value });
    }
    const many = Array.from({ length: 500 }, (_, index) => ({
      id: `row-${index}`,
      name: `Fruit ${index + 1}`,
      colour: 'Green',
      weight: index,
    }));
    try {
      const { container } = render(
        <Table aria-label="Many" rows={many} columns={columns} virtualized rowHeight={28} />,
      );
      expect(container.firstElementChild).toHaveAttribute('data-virtualized', 'true');
      const grid = screen.getByRole('grid', { name: 'Many' });
      expect(grid.tagName).toBe('DIV');
      expect(grid).toHaveAttribute('aria-rowcount', '501');
      const rows = within(grid).getAllByRole('row').slice(1);
      expect(rows.length).toBeGreaterThan(5);
      expect(rows.length).toBeLessThan(40);
      expect(rows[0]?.parentElement?.style.height).toBe('28px');
      expectHooksMatchSpec(container, 'TABLE', { slots: ['grid', 'header', 'column', 'row'] });
    } finally {
      for (const name of Object.keys(sizes)) {
        Reflect.deleteProperty(HTMLElement.prototype, name);
      }
    }
  });
});
