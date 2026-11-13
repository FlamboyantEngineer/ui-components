import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

/**
 * jsdom lays nothing out: a cell is as wide as its pixel track in the grid's
 * `--ui-table-columns`, as the reference stylesheet's grid draws it (UIC-TABLE-4.6).
 */
function drawTracks() {
  return vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    const row = this.closest('tr');
    const grid = this.closest<HTMLElement>('table');
    if (!(this instanceof HTMLTableCellElement) || !row || !grid) return 0;
    const tracks = grid.style.getPropertyValue('--ui-table-columns').split(' ');
    return Number.parseFloat(tracks[[...row.cells].indexOf(this)] ?? '0') || 0;
  });
}

// Full React Aria tables are slow in jsdom on a busy machine.
describe('Table pinned columns', { timeout: 15_000 }, () => {
  let tracks: ReturnType<typeof drawTracks>;
  beforeEach(() => {
    tracks = drawTracks();
  });
  afterEach(() => tracks.mockRestore());

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

  it('UIC-TABLE-8.6 keeps watching the header cells across renders without watching them again', () => {
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
      const { rerender } = renderCities();
      const headerCells = () => watched.filter((element) => element.matches('th')).length;
      const before = headerCells();
      expect(before).toBeGreaterThan(0);
      rerender(
        <Table
          aria-label="Cities"
          rows={[...cities]}
          columns={columns}
          selectionMode="multiple"
          renderRowActions={() => null}
          actionsColumnWidth={50}
        />,
      );
      expect(headerCells()).toBe(before);
      expect(offset(header('Code'))).toBe('164px');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('UIC-TABLE-8.6 pins, sizes and filters columns with prototype-named ids', () => {
    interface Odd {
      id: string;
      __proto__: string;
      constructor: string;
    }
    const odd = [{ id: 'one' }] as unknown as Odd[];
    render(
      <Table<Odd>
        aria-label="Odd ids"
        rows={odd}
        columns={[
          { id: '__proto__', header: 'Proto', pin: 'start', width: 100, renderCell: () => 'P' },
          { id: 'constructor', header: 'Maker', pin: 'start', width: 80, renderCell: () => 'M' },
          {
            id: 'valueOf',
            header: 'Value',
            width: 90,
            filter: { type: 'text' },
            renderCell: () => 'V',
          },
        ]}
        defaultFilter={{ columns: JSON.parse('{"valueOf":"zz"}') as Record<string, string> }}
      />,
    );
    expect(header('Proto')).toHaveAttribute('data-pinned', 'start');
    expect(offset(header('Proto'))).toBe('0px');
    expect(offset(header('Maker'))).toBe('100px');
    expect(header('Value')).not.toHaveAttribute('data-pinned');
    // The filter on `valueOf` reads the filter's own value, not the object's method.
    expect(header('Value')).toHaveAttribute('data-filtered');
    expect(header('Proto')).not.toHaveAttribute('data-filtered');
    expect(screen.queryByRole('gridcell', { name: 'P' })).not.toBeInTheDocument();
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
