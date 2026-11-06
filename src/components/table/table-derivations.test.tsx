import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { StrictMode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Table, type TableProps } from './table.js';
import type { TableColumn } from './table-rows.js';

interface Part {
  id: string;
  name: string;
  weight: number;
  parts?: Part[];
}

const parts: Part[] = [
  { id: 'frame', name: 'Frame', weight: 30, parts: [{ id: 'bolt', name: 'Bolt', weight: 1 }] },
  { id: 'wheel', name: 'Wheel', weight: 12 },
  { id: 'seat', name: 'Seat', weight: 4 },
  { id: 'chain', name: 'Chain', weight: 2 },
];

function setup(props: Partial<TableProps<Part>> = {}) {
  const getChildRows = vi.fn((row: Part) => row.parts);
  const readWeight = vi.fn((row: Part) => row.weight);
  // A hidden column draws no cell, so only the filter reads its value.
  const readCode = vi.fn((row: Part) => row.weight * 10);
  const columns: TableColumn<Part>[] = [
    { id: 'name', header: 'Name', allowsSorting: true },
    { id: 'weight', header: 'Weight', allowsSorting: true, getValue: readWeight },
    { id: 'code', header: 'Code', getValue: readCode },
  ];
  const element = (extra: Partial<TableProps<Part>> = {}) => (
    <Table
      aria-label="Parts"
      rows={parts}
      columns={columns}
      getChildRows={getChildRows}
      defaultColumnLayout={{ hidden: ['code'] }}
      filterable
      {...props}
      {...extra}
    />
  );
  const utils = render(element());
  return { ...utils, element, getChildRows, readWeight, readCode };
}

const names = () => screen.queryAllByRole('rowheader').map((cell) => cell.textContent);

// Full React Aria tables driven by userEvent are slow in jsdom on a busy machine.
describe('Table derivations', { timeout: 15_000 }, () => {
  it('UIC-TABLE-2.11 sorts again without rebuilding or filtering the rows again', async () => {
    const user = userEvent.setup();
    const { getChildRows, readCode } = setup({ defaultFilter: { query: 'e' } });
    expect(names()).toEqual(['Frame', 'Wheel', 'Seat']);
    expect(readCode).toHaveBeenCalled();
    getChildRows.mockClear();
    readCode.mockClear();
    await user.click(screen.getByRole('columnheader', { name: 'Name' }));
    expect(names()).toEqual(['Frame', 'Seat', 'Wheel']);
    await user.click(screen.getByRole('columnheader', { name: 'Weight' }));
    expect(names()).toEqual(['Seat', 'Wheel', 'Frame']);
    expect(getChildRows).not.toHaveBeenCalled();
    expect(readCode).not.toHaveBeenCalled();
  });

  it('UIC-TABLE-2.11 filters again without rebuilding the rows', async () => {
    const user = userEvent.setup();
    const { getChildRows, readCode } = setup();
    getChildRows.mockClear();
    await user.type(screen.getByRole('searchbox'), 'wh');
    expect(names()).toEqual(['Wheel']);
    expect(readCode).toHaveBeenCalled();
    expect(getChildRows).not.toHaveBeenCalled();
  });

  it('UIC-TABLE-2.11 builds, filters and sorts again for new rows', () => {
    const { getChildRows, readWeight, rerender, element } = setup({
      defaultSortDescriptor: { column: 'weight', direction: 'ascending' },
    });
    getChildRows.mockClear();
    readWeight.mockClear();
    const lighter = [...parts, { id: 'bell', name: 'Bell', weight: 0.5 }];
    rerender(element({ rows: lighter }));
    expect(names()).toEqual(['Bell', 'Chain', 'Seat', 'Wheel', 'Frame']);
    expect(getChildRows).toHaveBeenCalled();
    expect(readWeight).toHaveBeenCalled();
    expect(parts).toHaveLength(4);
  });

  it('UIC-TABLE-2.11 presents the same rows under Strict Mode', async () => {
    const user = userEvent.setup();
    render(
      <StrictMode>
        <Table
          aria-label="Strict parts"
          rows={parts}
          columns={[
            { id: 'name', header: 'Name', allowsSorting: true },
            { id: 'weight', header: 'Weight', allowsSorting: true },
          ]}
          getChildRows={(row) => row.parts}
        />
      </StrictMode>,
    );
    await user.click(screen.getByRole('columnheader', { name: 'Weight' }));
    expect(names()).toEqual(['Chain', 'Seat', 'Wheel', 'Frame']);
    await user.click(screen.getByRole('columnheader', { name: 'Weight' }));
    expect(names()).toEqual(['Frame', 'Wheel', 'Seat', 'Chain']);
  });
});
