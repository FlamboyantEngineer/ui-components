import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { PivotLayout, PivotRecord } from '../../utils/pivot.js';
import { getValueIds } from './pivot-columns.js';
import { PivotTable, type PivotTableField } from './pivot-table.js';

const fields: PivotTableField[] = [
  { id: 'team', label: 'Team' },
  { id: 'region', label: 'Region' },
  { id: 'amount', label: 'Amount' },
  { id: 'units', label: 'Units' },
];
const records = [
  { team: 'A', region: 'North', amount: 100, units: 1 },
  { team: 'A', region: 'South', amount: 1, units: 9 },
  { team: 'B', region: 'North', amount: 10, units: 2 },
  { team: 'B', region: 'South', amount: 2, units: 3 },
];
const east = [
  { team: 'A', region: 'East', amount: 50, units: 5 },
  { team: 'B', region: 'East', amount: 60, units: 6 },
];
const byRegion: PivotLayout = {
  rows: ['team'],
  columns: ['region'],
  values: [{ field: 'amount' }],
};

// The group rows' headers, without the summary row's.
const teams = () =>
  screen
    .getAllByRole('rowheader')
    .map((cell) => cell.textContent)
    .filter((text) => text !== 'Total');
const sorted = () =>
  screen
    .getAllByRole('columnheader')
    .filter((cell) => cell.getAttribute('aria-sort') === 'ascending')
    .map((cell) => cell.textContent);

function view(rows: readonly PivotRecord[], layout: PivotLayout) {
  return <PivotTable aria-label="Totals" records={rows} fields={fields} layout={layout} />;
}

// Full React Aria tables driven by userEvent are slow in jsdom on a busy machine.
describe('PivotTable column identity', { timeout: 20_000 }, () => {
  it('UIC-PIVOT-TABLE-2.6 keeps a sort on its column key when key groups arrive or leave before it', async () => {
    const user = userEvent.setup();
    const { rerender } = render(view(records, byRegion));
    await user.click(screen.getByRole('columnheader', { name: 'South' }));
    expect(sorted()).toEqual(['South']);
    expect(teams()).toEqual(['A', 'B']);
    rerender(view([...records, ...east], byRegion));
    expect(sorted()).toEqual(['South']);
    expect(teams()).toEqual(['A', 'B']);
    rerender(view(records.slice(1), byRegion));
    expect(sorted()).toEqual(['South']);
  });

  it('UIC-PIVOT-TABLE-2.6 drops a sort whose column leaves, so another key never takes it', async () => {
    const user = userEvent.setup();
    const { rerender } = render(view(records, byRegion));
    await user.click(screen.getByRole('columnheader', { name: 'North' }));
    expect(sorted()).toEqual(['North']);
    const withoutNorth = records.filter((record) => record.region !== 'North');
    rerender(view(withoutNorth, byRegion));
    expect(sorted()).toEqual([]);
    rerender(view(records, byRegion));
    expect(sorted()).toEqual([]);
  });

  it('UIC-PIVOT-TABLE-2.6 keeps a sort on its value when the values change places', async () => {
    const user = userEvent.setup();
    const values = [{ field: 'amount' }, { field: 'units' }];
    const layout = { rows: ['team'], columns: [], values };
    const { rerender } = render(view(records, layout));
    await user.click(screen.getByRole('columnheader', { name: 'Sum of Units' }));
    expect(teams()).toEqual(['B', 'A']);
    rerender(view(records, { ...layout, values: [...values].reverse() }));
    expect(sorted()).toEqual(['Sum of Units']);
    expect(teams()).toEqual(['B', 'A']);
  });

  it('UIC-PIVOT-TABLE-2.6 names values by id, else field, aggregation and label, then by place', () => {
    const custom = () => 1;
    expect(
      getValueIds([
        { field: 'amount' },
        { field: 'amount', aggregate: 'sum' },
        { field: 'amount', aggregate: 'max' },
        { field: 'amount', aggregate: custom },
        { field: 'amount', aggregate: custom, id: 'first' },
        { field: 'amount', label: 'Spend' },
      ]),
    ).toEqual([
      '["amount","sum",null]',
      '["amount","sum",null]#2',
      '["amount","max",null]',
      '["amount","custom",null]',
      '"first"',
      '["amount","sum","Spend"]',
    ]);
  });
});
