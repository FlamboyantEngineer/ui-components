import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Table, type TableProps } from './table.js';
import type { TableColumn } from './table-rows.js';

interface City {
  id: string;
  code: string;
  name: string;
  country: string;
  people: number;
}

const cities: City[] = [
  { id: 'lisbon', code: 'LIS', name: 'Lisbon', country: 'Portugal', people: 545 },
];
const columns: TableColumn<City>[] = [
  { id: 'name', header: 'Name', pin: 'start', width: 120 },
  { id: 'country', header: 'Country', width: 100 },
  { id: 'people', header: 'People', pin: 'end', width: 90, renderFooter: () => 'Total' },
  { id: 'code', header: 'Code', pin: 'start', width: 60 },
];

const header = (name: string) => screen.getByRole('columnheader', { name: new RegExp(`^${name}`) });
const offset = (element: HTMLElement) => element.style.getPropertyValue('--ui-table-pin-offset');

function renderCities(props: Partial<TableProps<City>> = {}) {
  return render(
    <Table
      aria-label="Cities"
      rows={cities}
      columns={columns}
      selectionMode="multiple"
      renderRowActions={() => null}
      actionsColumnWidth={50}
      {...props}
    />,
  );
}

// Full React Aria tables are slow in jsdom on a busy machine.
describe('Table pinned columns', { timeout: 15_000 }, () => {
  it('UIC-TABLE-8.6 draws pinned columns at their edges with offsets from the column widths', () => {
    const { container } = renderCities();
    const headers = screen.getAllByRole('columnheader').map((cell) => cell.textContent);
    expect(headers).toEqual(['', 'Name', 'Code', 'Country', 'People', 'Actions']);
    expect(header('Name')).toHaveAttribute('data-pinned', 'start');
    expect(offset(header('Name'))).toBe('44px');
    expect(offset(header('Code'))).toBe('164px');
    expect(header('Country')).not.toHaveAttribute('data-pinned');
    expect(offset(header('People'))).toBe('50px');
    expect(header('Actions')).toHaveAttribute('data-pinned', 'end');
    expect(offset(header('Actions'))).toBe('0px');
    const selection = container.querySelector('th[data-kind="selection"]') as HTMLElement;
    expect(selection).toHaveAttribute('data-pinned', 'start');
    expect(offset(selection)).toBe('0px');
    const cell = screen.getByRole('gridcell', { name: 'LIS' });
    expect(cell).toHaveAttribute('data-pinned', 'start');
    expect(offset(cell)).toBe('164px');
    const footer = container.querySelector('.ui-table__footer-cell[data-column="people"]');
    expect(footer).toHaveAttribute('data-pinned', 'end');
    expect(offset(footer as HTMLElement)).toBe('50px');
    expectHooksMatchSpec(container, 'TABLE');
  });

  it('UIC-TABLE-8.6 leaves the fixed columns unpinned without pins at their edge', () => {
    const { container } = renderCities({ columns: columns.slice(0, 2) });
    expect(container.querySelector('th[data-kind="selection"]')).toHaveAttribute(
      'data-pinned',
      'start',
    );
    expect(header('Actions')).not.toHaveAttribute('data-pinned');
  });

  it('UIC-TABLE-8.6 pins nothing in a virtualized table', () => {
    const { container } = renderCities({ virtualized: true });
    expect(container.querySelector('[data-pinned]')).toBeNull();
    expect(container.innerHTML).not.toContain('--ui-table-pin-offset');
  });
});
