import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Table } from './table.js';

interface NestedRow {
  id: string;
  name: string;
  kind: string;
  children?: NestedRow[];
}

describe('table column identities', () => {
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
