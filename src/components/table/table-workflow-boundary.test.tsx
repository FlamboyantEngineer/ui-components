import { render, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import { Table } from './table.js';

it('UIC-TABLE-14.1 UIC-TABLE-14.2 UIC-TABLE-14.3 UIC-TABLE-14.4 UIC-TABLE-14.5 UIC-TABLE-14.6 UIC-TABLE-14.8 UIC-TABLE-15.1 UIC-TABLE-15.2 UIC-TABLE-16.3 UIC-TABLE-16.4 leaves spreadsheet, export and bulk workflows to the host', () => {
  render(
    <Table
      aria-label="Records"
      rows={[{ id: 'a', name: 'Maple' }]}
      columns={[{ id: 'name', header: 'Name', allowsEditing: true }]}
      selectionMode="multiple"
      defaultSelectedKeys={['a']}
    />,
  );
  expect(screen.getByRole('grid', { name: 'Records' })).toBeInTheDocument();
  expect(within(screen.getByRole('row', { name: 'Maple' })).getByRole('checkbox')).toBeChecked();
  expect(screen.queryByRole('button', { name: /Export CSV|Bulk edit/ })).not.toBeInTheDocument();
  expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
});
