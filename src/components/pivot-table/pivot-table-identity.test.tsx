import { render } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { PivotLayout } from '../../utils/pivot.js';
import type * as TableModule from '../table/table.js';
import { PivotTable, type PivotTableField } from './pivot-table.js';

const tableProps = vi.hoisted(() => [] as Array<Record<string, unknown>>);

// Records the props each render hands the Table, to compare their identities.
vi.mock('../table/table.js', async (importOriginal) => {
  const actual = await importOriginal<typeof TableModule>();
  return {
    ...actual,
    Table: (props: Parameters<typeof actual.Table>[0]) => {
      tableProps.push(props as unknown as Record<string, unknown>);
      return createElement(actual.Table, props);
    },
  };
});

const records = [
  { region: 'North', fruit: 'Apple', boxes: 10, price: 2 },
  { region: 'North', fruit: 'Pear', boxes: 4, price: 3 },
  { region: 'South', fruit: 'Apple', boxes: 12, price: 1.5 },
];
const fields: PivotTableField[] = [
  { id: 'region', label: 'Region' },
  { id: 'fruit', label: 'Fruit' },
  { id: 'boxes', label: 'Boxes' },
  { id: 'price', label: 'Price', formatOptions: { style: 'currency', currency: 'EUR' } },
];
const layout: PivotLayout = {
  rows: ['region', 'fruit'],
  columns: [],
  values: [{ field: 'boxes' }, { field: 'price' }],
};

describe('PivotTable table identity', () => {
  it('UIC-PIVOT-TABLE-2.7 keeps the columns, rows and child rows it hands the table across an unrelated render', () => {
    const tree = (expandedKeys: string[], className: string) => (
      <PivotTable
        aria-label="Sales"
        className={className}
        records={records}
        fields={fields}
        layout={layout}
        expandedKeys={expandedKeys}
      />
    );
    const { rerender } = render(tree([], 'first'));
    const first = tableProps.at(-1);
    rerender(tree(['North'], 'second'));
    const last = tableProps.at(-1);
    expect(last?.expandedKeys).toEqual(['North']);
    expect(last?.columns).toBe(first?.columns);
    expect(last?.columnGroups).toBe(first?.columnGroups);
    expect(last?.rows).toBe(first?.rows);
    expect(last?.getChildRows).toBe(first?.getChildRows);
    const getChildRows = last?.getChildRows as (row: unknown) => unknown;
    const [north] = last?.rows as unknown[];
    expect(getChildRows(north)).toBe(getChildRows(north));
  });
});
