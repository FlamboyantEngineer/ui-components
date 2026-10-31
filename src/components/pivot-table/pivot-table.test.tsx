import { createRef } from 'react';
import { act, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import type { PivotLayout } from '../../utils/pivot.js';
import { requireDefined } from '../../utils/require-defined.js';
import { PivotTable, type PivotTableField } from './pivot-table.js';

const sales = [
  { region: 'North', fruit: 'Apple', year: 2025, boxes: 10, price: 2 },
  { region: 'North', fruit: 'Pear', year: 2024, boxes: 4, price: 3 },
  { region: 'North', fruit: 'Apple', year: 2024, boxes: 6, price: 2.5 },
  { region: 'South', fruit: 'Apple', year: 2025, boxes: 1200, price: 1.5 },
  { region: '', fruit: 'Plum', year: 2025, boxes: 3, price: 4 },
];

const fields: PivotTableField[] = [
  { id: 'region', label: 'Region' },
  { id: 'fruit', label: 'Fruit' },
  { id: 'year', label: 'Year', formatKey: (key) => `FY${String(key).slice(2)}` },
  { id: 'boxes', label: 'Boxes', aggregate: 'sum' },
  {
    id: 'price',
    label: 'Price',
    formatOptions: { style: 'currency', currency: 'EUR' },
  },
];

const byRegionAndYear: PivotLayout = {
  rows: ['region'],
  columns: ['year'],
  values: [{ field: 'boxes' }],
};

const headerTexts = (container: HTMLElement) =>
  [...container.querySelectorAll('thead tr')].map((row) =>
    [...row.children].map((cell) => cell.textContent),
  );
const rowTexts = (container: HTMLElement) =>
  [...container.querySelectorAll('tbody tr')].map((row) =>
    [...row.children].map((cell) => cell.textContent),
  );
const footerTexts = (container: HTMLElement) =>
  [...container.querySelectorAll('tfoot td, tfoot th')].map((cell) => cell.textContent);

// Full React Aria tables and boards are slow in jsdom on a busy machine.
describe('PivotTable', { timeout: 20_000 }, () => {
  it('UIC-PIVOT-TABLE-2.1 UIC-PIVOT-TABLE-2.2 UIC-PIVOT-TABLE-2.3 draws a row per group and a column per key', () => {
    const { container } = render(
      <PivotTable
        aria-label="Sales"
        records={sales}
        fields={fields}
        defaultLayout={byRegionAndYear}
      />,
    );
    const table = screen.getByRole('grid', { name: 'Sales' });
    expect(table.closest('.ui-pivot-table__table')).toHaveClass('ui-table');
    expect(headerTexts(container)).toEqual([
      ['', 'Sum of Boxes', ''],
      ['Region', 'FY24', 'FY25', 'Total'],
    ]);
    expect(rowTexts(container)).toEqual([
      ['North', '10', '10', '20'],
      ['South', '', '1,200', '1,200'],
      ['(empty)', '', '3', '3'],
    ]);
    expect(screen.getByRole('columnheader', { name: 'Sum of Boxes' })).toHaveAttribute(
      'scope',
      'colgroup',
    );
    expect(screen.getByRole('rowheader', { name: 'North' })).toBeInTheDocument();
    const north = screen.getByRole('row', { name: 'North' });
    expect(north.querySelector('.ui-pivot-table__key')).toHaveTextContent('North');
    const values = [...north.querySelectorAll('.ui-pivot-table__value')];
    expect(values.map((value) => value.hasAttribute('data-total'))).toEqual([false, false, true]);
    expectHooksMatchSpec(container, 'PIVOT-TABLE', { slots: ['table', 'key', 'value'] });
  });

  it('UIC-PIVOT-TABLE-2.2 UIC-PIVOT-TABLE-2.3 groups several values under each column', () => {
    const { container } = render(
      <PivotTable
        aria-label="Sales"
        records={sales}
        fields={fields}
        layout={{
          rows: ['fruit'],
          columns: ['year'],
          values: [
            { field: 'boxes', aggregate: 'count' },
            { field: 'price', aggregate: 'average' },
            { field: 'region', aggregate: (values) => new Set(values).size, label: 'Regions' },
          ],
        }}
      />,
    );
    expect(headerTexts(container)).toEqual([
      ['', 'FY24', 'FY25', 'Total'],
      [
        'Fruit',
        'Count of Boxes',
        'Average of Price',
        'Regions',
        'Count of Boxes',
        'Average of Price',
        'Regions',
        'Count of Boxes',
        'Average of Price',
        'Regions',
      ],
    ]);
    expect(rowTexts(container)[0]).toEqual([
      'Apple',
      '1',
      '€2.50',
      '1',
      '2',
      '€1.75',
      '2',
      '3',
      '€2.00',
      '2',
    ]);
    expect(screen.getByRole('columnheader', { name: 'Total' })).toHaveAttribute(
      'scope',
      'colgroup',
    );
  });

  it('UIC-PIVOT-TABLE-2.4 sums columns in a summary row, or in one row without row fields', () => {
    const { container, rerender } = render(
      <PivotTable aria-label="Sales" records={sales} fields={fields} layout={byRegionAndYear} />,
    );
    expect(footerTexts(container)).toEqual(['Total', '10', '1,213', '1,223']);
    expect(container.querySelector('tfoot .ui-pivot-table__key')).toHaveAttribute(
      'data-total',
      'true',
    );
    rerender(
      <PivotTable
        aria-label="Sales"
        records={sales}
        fields={fields}
        layout={{ rows: [], columns: [], values: [{ field: 'price', aggregate: 'max' }] }}
      />,
    );
    expect(headerTexts(container)).toEqual([['Rows', 'Maximum of Price']]);
    expect(rowTexts(container)).toEqual([['Total', '€4.00']]);
    expect(container.querySelector('tfoot')).toBeNull();
  });

  it('UIC-PIVOT-TABLE-2.3 UIC-PIVOT-TABLE-2.4 marks every cell of the one row without row fields as a total', () => {
    const { container } = render(
      <PivotTable
        aria-label="Sales"
        records={sales}
        fields={fields}
        layout={{ rows: [], columns: ['year'], values: [{ field: 'boxes' }] }}
      />,
    );
    const cells = [
      ...container.querySelectorAll('tbody .ui-pivot-table__key, tbody .ui-pivot-table__value'),
    ];
    expect(cells.map((cell) => `${cell.textContent}:${cell.getAttribute('data-total')}`)).toEqual([
      'Total:true',
      '10:true',
      '1,213:true',
      '1,223:true',
    ]);
  });

  it('UIC-PIVOT-TABLE-2.5 reports and takes group keys that hold spaces as they are', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    const records = [
      { region: 'North East', fruit: 'Apple', boxes: 1 },
      { region: 'South', fruit: 'Pear', boxes: 2 },
    ];
    const layout: PivotLayout = { rows: ['region', 'fruit'], columns: [], values: [] };
    render(
      <PivotTable
        aria-label="Spaced"
        records={records}
        fields={fields}
        layout={layout}
        onExpandedChange={onExpandedChange}
      />,
    );
    const spaced = screen.getByRole('treegrid', { name: 'Spaced' });
    await user.click(within(spaced).getByRole('button', { name: 'Expand North East' }));
    expect(onExpandedChange).toHaveBeenLastCalledWith(new Set(['["North East"]']));
    render(
      <PivotTable
        aria-label="Controlled"
        records={records}
        fields={fields}
        layout={layout}
        expandedKeys={['["North East"]']}
      />,
    );
    const controlled = screen.getByRole('treegrid', { name: 'Controlled' });
    expect(within(controlled).getByRole('row', { name: /Apple$/ })).toBeInTheDocument();
    expect(within(controlled).queryByRole('row', { name: /Pear$/ })).not.toBeInTheDocument();
  });

  it('UIC-PIVOT-TABLE-2.5 nests inner groups under expandable outer groups', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    const layout: PivotLayout = {
      rows: ['region', 'fruit'],
      columns: [],
      values: [{ field: 'boxes' }],
    };
    const { container } = render(
      <PivotTable
        aria-label="Sales"
        records={sales}
        fields={fields}
        layout={layout}
        onExpandedChange={onExpandedChange}
      />,
    );
    expect(screen.getByRole('treegrid', { name: 'Sales' })).toBeInTheDocument();
    expect(rowTexts(container).map((row) => row[0])).toEqual(['North', 'South', '(empty)']);
    const north = screen.getByRole('row', { name: /North$/ });
    expect(north).toHaveAttribute('aria-expanded', 'false');
    await user.click(within(north).getByRole('button', { name: 'Expand North' }));
    expect(onExpandedChange).toHaveBeenLastCalledWith(new Set(['["North"]']));
    expect(rowTexts(container)).toEqual([
      ['North', '20'],
      ['Apple', '16'],
      ['Pear', '4'],
      ['South', '1,200'],
      ['(empty)', '3'],
    ]);
    expect(screen.getByRole('row', { name: /Apple$/ })).toHaveAttribute('aria-level', '2');
    render(
      <PivotTable
        aria-label="Expanded"
        records={sales}
        fields={fields}
        layout={layout}
        defaultExpandedKeys={['["South"]']}
      />,
    );
    const expanded = screen.getByRole('treegrid', { name: 'Expanded' });
    expect(within(expanded).getAllByRole('row', { name: /Apple$/ })).toHaveLength(1);
  });

  it('UIC-PIVOT-TABLE-1.1 UIC-PIVOT-TABLE-1.2 draws fields a record lacks as empty, whatever their names', () => {
    const { container } = render(
      <PivotTable
        aria-label="Notes"
        records={[{}, { constructor: 'Kept', toString: 'yes' }]}
        fields={[
          { id: 'constructor', label: 'Maker' },
          { id: 'toString', label: 'Text' },
        ]}
        layout={{
          rows: ['constructor'],
          columns: [],
          values: [{ field: 'toString', aggregate: 'count' }],
        }}
      />,
    );
    expect(container).not.toHaveTextContent('native code');
    expect(rowTexts(container)).toEqual([
      ['Kept', '1'],
      ['(empty)', '0'],
    ]);
  });

  it('UIC-PIVOT-TABLE-2.6 sorts groups by a column on a header press', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <PivotTable aria-label="Sales" records={sales} fields={fields} layout={byRegionAndYear} />,
    );
    const total = screen.getByRole('columnheader', { name: 'Total' });
    await user.click(total);
    expect(rowTexts(container).map((row) => row[0])).toEqual(['(empty)', 'North', 'South']);
    await user.click(total);
    expect(rowTexts(container).map((row) => row[0])).toEqual(['South', 'North', '(empty)']);
    await user.click(screen.getByRole('columnheader', { name: 'Region' }));
    expect(rowTexts(container).map((row) => row[0])).toEqual(['North', 'South', '(empty)']);
  });

  it('UIC-PIVOT-TABLE-3.1 UIC-PIVOT-TABLE-3.2 draws the field chooser as a board of zones', () => {
    const { container } = render(
      <PivotTable
        aria-label="Sales"
        records={sales}
        fields={fields}
        defaultLayout={{ rows: ['region'], columns: [], values: [{ field: 'boxes' }] }}
        fieldChooser
      />,
    );
    const chooser = screen.getByRole('group', { name: 'Pivot fields' });
    expect(chooser).toHaveClass('ui-board', 'ui-pivot-table__chooser');
    const cards = (zone: string) =>
      [...screen.getByRole('grid', { name: zone }).querySelectorAll('.ui-board__card')].map(
        (row) => row.textContent,
      );
    expect(cards('Fields')).toEqual(['Fruit', 'Year', 'Price']);
    expect(cards('Rows')).toEqual(['Region']);
    expect(cards('Columns')).toEqual([]);
    expect(
      within(screen.getByRole('grid', { name: 'Columns' })).getByText('No fields'),
    ).toBeInTheDocument();
    const value = within(screen.getByRole('grid', { name: 'Values' })).getByRole('row');
    expect(value.querySelector('.ui-pivot-table__field')).toHaveAttribute('data-zone', 'values');
    expect(value.querySelector('.ui-pivot-table__field-label')).toHaveTextContent('Boxes');
    expectHooksMatchSpec(container, 'PIVOT-TABLE', {
      slots: ['chooser', 'field', 'field-label', 'aggregate'],
    });
  });

  it('UIC-PIVOT-TABLE-3.3 moves a field to another zone by keyboard and reports the layout', async () => {
    const user = userEvent.setup();
    const onLayoutChange = vi.fn();
    const { container } = render(
      <PivotTable
        aria-label="Sales"
        records={sales}
        fields={fields}
        defaultLayout={byRegionAndYear}
        onLayoutChange={onLayoutChange}
        fieldChooser
      />,
    );
    act(() => screen.getByRole('row', { name: 'Fruit' }).focus());
    await user.keyboard('{Alt>}{ArrowRight}{/Alt}');
    expect(onLayoutChange).toHaveBeenLastCalledWith({
      rows: ['fruit', 'region'],
      columns: ['year'],
      values: [{ field: 'boxes' }],
    });
    expect(screen.getByRole('treegrid', { name: 'Sales' })).toBeInTheDocument();
    expect(requireDefined(headerTexts(container).at(-1))[0]).toBe('Fruit / Region');
  });

  it('UIC-PIVOT-TABLE-3.4 picks a value aggregation from its card', async () => {
    const user = userEvent.setup();
    const onLayoutChange = vi.fn();
    render(
      <PivotTable
        aria-label="Sales"
        records={sales}
        fields={fields}
        defaultLayout={{
          rows: ['region'],
          columns: [],
          values: [{ field: 'boxes' }, { field: 'price', aggregate: () => 1 }],
        }}
        onLayoutChange={onLayoutChange}
        fieldChooser
      />,
    );
    const picker = screen.getByRole('button', { name: /Aggregation of Boxes/ });
    expect(picker.closest('.ui-pivot-table__aggregate')).toHaveClass('ui-select-field');
    expect(screen.queryByRole('button', { name: /Aggregation of Price/ })).not.toBeInTheDocument();
    await user.click(picker);
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Sum',
      'Count',
      'Minimum',
      'Maximum',
      'Average',
    ]);
    await user.click(screen.getByRole('option', { name: 'Maximum' }));
    expect(requireDefined(onLayoutChange.mock.lastCall)[0].values[0]).toEqual({
      field: 'boxes',
      aggregate: 'max',
    });
    expect(screen.getByRole('columnheader', { name: 'Maximum of Boxes' })).toBeInTheDocument();
  });

  it('UIC-PIVOT-TABLE-4.1 forwards ref to its root', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <PivotTable aria-label="Sales" records={sales} fields={fields} ref={ref} />,
    );
    expect(ref.current).toBe(container.querySelector('.ui-pivot-table'));
  });

  it('UIC-PIVOT-TABLE-4.1 forwards the class name, id and caller data attributes', () => {
    const { container } = render(
      <PivotTable
        aria-label="Sales"
        records={sales}
        fields={fields}
        className="report"
        id="pivot"
        data-testid="pivot"
      />,
    );
    const root = requireDefined(container.firstElementChild);
    expect(root).toHaveClass('ui-pivot-table', 'report');
    expect(root).toHaveAttribute('id', 'pivot');
    expect(root).toHaveAttribute('data-testid', 'pivot');
    expectHooksMatchSpec(container, 'PIVOT-TABLE', { callerAttributes: ['data-testid'] });
  });

  it('UIC-PIVOT-TABLE-2.8 passes virtualization to its table', () => {
    const { container, rerender } = render(
      <PivotTable aria-label="Sales" records={sales} fields={fields} layout={byRegionAndYear} />,
    );
    const table = () => container.querySelector('.ui-pivot-table__table');
    expect(table()).not.toHaveAttribute('data-virtualized');
    rerender(
      <PivotTable
        aria-label="Sales"
        records={sales}
        fields={fields}
        layout={byRegionAndYear}
        virtualized
        rowHeight={36}
      />,
    );
    expect(table()).toHaveAttribute('data-virtualized', 'true');
    expect(screen.getByRole('grid', { name: 'Sales' })).toBeInTheDocument();
  });
});
