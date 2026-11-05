import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { Key } from '../../core/props.js';
import { Table, type TableProps } from './table.js';
import type { TableGroup } from './table-groups.js';

interface NestedRow {
  id: string;
  name: string;
  kind: string;
  children?: NestedRow[];
}

interface CodedRow {
  id: string;
  name: string;
  code: number | string | Date;
}

const codedRows: CodedRow[] = [
  { id: 'number', name: 'Number reading', code: 1 },
  { id: 'text', name: 'Text reading', code: '1' },
];
const numericKey = 'ui-table-group:code=1:number';
const textKey = 'ui-table-group:code=1';

function labelGroup(group: TableGroup<CodedRow>) {
  const value = group.rows[0]?.code;
  const kind = value instanceof Date ? 'Date' : typeof value === 'number' ? 'Number' : 'Text';
  return `${kind} ${group.level === 2 ? 'secondary' : 'group'}`;
}

function IdentityTable(props: Partial<TableProps<CodedRow>>) {
  return (
    <Table
      aria-label="Typed groups"
      rows={codedRows}
      columns={[
        { id: 'name', header: 'Name' },
        { id: 'code', header: 'Code', allowsSorting: true, renderCell: (row) => String(row.code) },
      ]}
      groupBy={['code']}
      renderGroupLabel={labelGroup}
      {...props}
    />
  );
}

function ControlledNestedTable() {
  const [collapsed, setCollapsed] = useState<Set<Key>>(new Set());
  return (
    <IdentityTable
      rows={[
        { id: 'date', name: 'Date reading', code: new Date(2024, 4, 1, 8) },
        { id: 'text', name: 'Text reading', code: '2024-05-01' },
      ]}
      groupBy={['code', { id: 'secondary', label: 'Secondary', getValue: () => 'same' }]}
      collapsedGroups={collapsed}
      onCollapsedGroupsChange={setCollapsed}
    />
  );
}

function groupButton(name: RegExp) {
  return within(screen.getByRole('row', { name })).getByRole('button');
}

describe('table column identities', () => {
  it('UIC-TABLE-13.1 UIC-TABLE-13.4 holds numeric collapse when a text peer appears and disappears', async () => {
    const user = userEvent.setup();
    const onCollapsedGroupsChange = vi.fn();
    const { rerender } = render(
      <IdentityTable
        rows={codedRows.slice(0, 1)}
        onCollapsedGroupsChange={onCollapsedGroupsChange}
      />,
    );
    await user.click(groupButton(/^Number group/));
    expect(onCollapsedGroupsChange).toHaveBeenLastCalledWith(new Set([numericKey]));
    rerender(<IdentityTable onCollapsedGroupsChange={onCollapsedGroupsChange} />);
    expect(screen.queryByRole('row', { name: 'Number reading' })).not.toBeInTheDocument();
    expect(screen.getByRole('row', { name: 'Text reading' })).toBeVisible();
    rerender(<IdentityTable rows={codedRows.slice(0, 1)} />);
    expect(screen.queryByRole('row', { name: 'Number reading' })).not.toBeInTheDocument();
    rerender(<IdentityTable onCollapsedGroupsChange={onCollapsedGroupsChange} />);
    await user.click(groupButton(/^Text group/));
    expect(onCollapsedGroupsChange).toHaveBeenLastCalledWith(new Set([numericKey, textKey]));
  });

  it('UIC-TABLE-13.1 UIC-TABLE-13.4 holds numeric collapse while either typed peer is filtered away', async () => {
    const user = userEvent.setup();
    const onCollapsedGroupsChange = vi.fn();
    render(<IdentityTable filterable onCollapsedGroupsChange={onCollapsedGroupsChange} />);
    await user.click(groupButton(/^Number group/));
    const search = screen.getByRole('searchbox', { name: 'Filter rows' });
    await user.type(search, 'Text');
    expect(screen.getByRole('row', { name: 'Text reading' })).toBeVisible();
    await user.click(groupButton(/^Text group/));
    expect(onCollapsedGroupsChange).toHaveBeenLastCalledWith(new Set([numericKey, textKey]));
    await user.click(groupButton(/^Text group/));
    await user.clear(search);
    await user.type(search, 'Number');
    expect(screen.queryByRole('row', { name: 'Number reading' })).not.toBeInTheDocument();
    expect(screen.queryByRole('row', { name: /^Text group/ })).not.toBeInTheDocument();
    await user.clear(search);
    expect(screen.queryByRole('row', { name: 'Number reading' })).not.toBeInTheDocument();
    expect(screen.getByRole('row', { name: 'Text reading' })).toBeVisible();
  });

  it('UIC-TABLE-13.1 UIC-TABLE-13.4 retains off-page collapse through client paging', async () => {
    const user = userEvent.setup();
    const onCollapsedGroupsChange = vi.fn();
    render(
      <IdentityTable
        pagination={{ pageSize: 1 }}
        onCollapsedGroupsChange={onCollapsedGroupsChange}
      />,
    );
    await user.click(groupButton(/^Number group/));
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByRole('row', { name: 'Text reading' })).toBeVisible();
    await user.click(groupButton(/^Text group/));
    expect(onCollapsedGroupsChange).toHaveBeenLastCalledWith(new Set([numericKey, textKey]));
    await user.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(screen.queryByRole('row', { name: 'Number reading' })).not.toBeInTheDocument();
    expect(groupButton(/^Number group/)).toHaveAccessibleName(/^Expand/);
  });

  it('UIC-TABLE-13.1 UIC-TABLE-13.4 retains typed collapse when the caller replaces the page', async () => {
    const user = userEvent.setup();
    const onCollapsedGroupsChange = vi.fn();
    const page = (number: number) => (
      <IdentityTable
        rows={codedRows.slice(number - 1, number)}
        pagination={{ page: number, pageSize: 1, rowCount: 2 }}
        onCollapsedGroupsChange={onCollapsedGroupsChange}
      />
    );
    const { rerender } = render(page(1));
    await user.click(groupButton(/^Number group/));
    rerender(page(2));
    expect(screen.getByRole('row', { name: 'Text reading' })).toBeVisible();
    await user.click(groupButton(/^Text group/));
    expect(onCollapsedGroupsChange).toHaveBeenLastCalledWith(new Set([numericKey, textKey]));
    rerender(page(1));
    expect(groupButton(/^Number group/)).toHaveAccessibleName(/^Expand/);
    expect(screen.queryByRole('row', { name: 'Number reading' })).not.toBeInTheDocument();
  });

  it('UIC-TABLE-13.1 UIC-TABLE-13.4 keeps controlled date and text descendants independent when sorting reverses', async () => {
    const user = userEvent.setup();
    render(<ControlledNestedTable />);
    await user.click(groupButton(/^Date secondary/));
    const header = screen.getByRole('columnheader', { name: 'Code' });
    await user.click(header);
    await user.click(header);
    expect(header).toHaveAttribute('aria-sort', 'descending');
    expect(screen.queryByRole('row', { name: 'Date reading' })).not.toBeInTheDocument();
    expect(screen.getByRole('row', { name: 'Text reading' })).toBeVisible();
    expect(groupButton(/^Date secondary/)).toHaveAccessibleName(/^Expand/);
    expect(groupButton(/^Text secondary/)).toHaveAccessibleName(/^Collapse/);
  });

  it('UIC-TABLE-9.1 UIC-TABLE-13.1 UIC-TABLE-13.4 expands a row independently from a group whose key resembles its id', async () => {
    const user = userEvent.setup();
    const base = 'ui-table-group:kind=Fruit';
    const onExpandedChange = vi.fn();
    const onCollapsedGroupsChange = vi.fn();
    const rows: NestedRow[] = [
      {
        id: base,
        name: 'Parent',
        kind: 'Fruit',
        children: [{ id: `${base}:1`, name: 'Child', kind: 'Fruit' }],
      },
    ];
    render(
      <Table
        aria-label="Reserved row keys"
        rows={rows}
        columns={[
          { id: 'name', header: 'Name' },
          { id: 'kind', header: 'Kind' },
        ]}
        groupBy={['kind']}
        getChildRows={(row) => row.children}
        onExpandedChange={onExpandedChange}
        onCollapsedGroupsChange={onCollapsedGroupsChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Expand Parent' }));
    expect(onExpandedChange).toHaveBeenLastCalledWith(new Set([base]));
    expect(screen.getByRole('row', { name: 'Child' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: /^Collapse Kind: Fruit/ }));
    expect(onCollapsedGroupsChange).toHaveBeenLastCalledWith(new Set([`${base}:2`]));
    expect(onExpandedChange).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: /^Expand Kind: Fruit/ }));
    expect(screen.getByRole('row', { name: 'Child' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Collapse Parent' }));
    expect(onExpandedChange).toHaveBeenLastCalledWith(new Set());
    expect(screen.queryByRole('row', { name: 'Child' })).not.toBeInTheDocument();
  });

  it('UIC-TABLE-1.1 UIC-TABLE-2.1 UIC-TABLE-11.1 preserves spaced column ids through names, sorting and editing', async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    render(
      <Table
        aria-label="Spaced columns"
        rows={[{ id: 'row', name: 'First row', 'a b': 10, ab: 20 }]}
        columns={[
          { id: 'name', header: 'Name' },
          { id: 'a b', header: 'Spaced', allowsSorting: true, allowsEditing: true },
          { id: 'ab', header: 'Joined', allowsSorting: true, allowsEditing: true },
        ]}
        onSortChange={onSortChange}
      />,
    );
    const spaced = screen.getByRole('columnheader', { name: 'Spaced' });
    const joined = screen.getByRole('columnheader', { name: 'Joined' });
    expect(spaced.id).not.toBe(joined.id);
    await user.click(spaced);
    expect(onSortChange).toHaveBeenLastCalledWith({ column: 'a b', direction: 'ascending' });
    const row = screen.getByRole('row', { name: 'First row' });
    within(row).getByRole('gridcell', { name: '20' }).focus();
    await user.keyboard('{F2}');
    expect(screen.getByRole('textbox', { name: 'Joined' })).toHaveValue('20');
    expect(screen.queryByRole('textbox', { name: 'Spaced' })).not.toBeInTheDocument();
  });
});
