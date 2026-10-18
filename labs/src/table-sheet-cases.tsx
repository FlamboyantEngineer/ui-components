// Cases of the table lab for row groups, spreadsheet mode and bulk edit.

import { useState } from 'react';
import type { Key } from '../../src/core/props.js';
import { Button } from '../../src/components/button/button.js';
import { Table } from '../../src/components/table/table.js';
import type { TableCellRange } from '../../src/components/table/table-cell-range.js';
import type { TableGroupBy } from '../../src/components/table/table-groups.js';
import type { TableColumn } from '../../src/components/table/table-rows.js';
import type { TableCellEdit } from '../../src/components/table/use-cell-editing.js';

interface Stock {
  id: string;
  name: string;
  kind: string;
  origin: string;
  weight: number;
  price: number;
  picked: string;
  organic: boolean;
}

const stock: Stock[] = [
  {
    id: 'apple',
    name: 'Apple',
    kind: 'Fruit',
    origin: 'Lisbon',
    weight: 180,
    price: 1.2,
    picked: '2026-10-02',
    organic: true,
  },
  {
    id: 'banana',
    name: 'Banana',
    kind: 'Fruit',
    origin: 'Quito',
    weight: 120,
    price: 0.4,
    picked: '2026-10-05',
    organic: false,
  },
  {
    id: 'carrot',
    name: 'Carrot',
    kind: 'Vegetable',
    origin: 'Porto',
    weight: 70,
    price: 0.3,
    picked: '2026-10-01',
    organic: true,
  },
  {
    id: 'cherry',
    name: 'Cherry',
    kind: 'Fruit',
    origin: 'Lisbon',
    weight: 8,
    price: 4.5,
    picked: '2026-09-28',
    organic: false,
  },
  {
    id: 'leek',
    name: 'Leek',
    kind: 'Vegetable',
    origin: 'Porto',
    weight: 250,
    price: 1.1,
    picked: '2026-10-03',
    organic: false,
  },
  {
    id: 'mint',
    name: 'Mint',
    kind: 'Herb',
    origin: 'Cairo',
    weight: 30,
    price: 0.9,
    picked: '2026-10-06',
    organic: true,
  },
  {
    id: 'onion',
    name: 'Onion',
    kind: 'Vegetable',
    origin: 'Seville',
    weight: 150,
    price: 0.2,
    picked: '2026-09-30',
    organic: true,
  },
  {
    id: 'sage',
    name: 'Sage',
    kind: 'Herb',
    origin: 'Seville',
    weight: 20,
    price: 1.5,
    picked: '2026-10-04',
    organic: false,
  },
];

const price = new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' });

/** Applies a batch of cell edits to rows, as a caller of `onCellsChange` does. */
function applyEdits<T extends { id: Key }>(
  rows: readonly T[],
  edits: readonly TableCellEdit<T>[],
): T[] {
  return rows.map((row) =>
    edits
      .filter((edit) => edit.row.id === row.id)
      .reduce((next, edit) => ({ ...next, [edit.columnId]: edit.value }), row),
  );
}

function describeEdits<T extends { id: Key }>(edits: readonly TableCellEdit<T>[]): string {
  return edits
    .map((edit) => `${String(edit.row.id)}.${edit.columnId}=${String(edit.value)}`)
    .join(', ');
}

function describeRange(range: TableCellRange | null): string {
  if (!range) return 'none';
  const { anchor, focus } = range;
  return `${String(anchor.rowKey)}.${anchor.columnId}:${String(focus.rowKey)}.${focus.columnId}`;
}

const weightClass: TableGroupBy<Stock> = {
  id: 'weight-class',
  label: 'Weight class',
  getValue: (row) => (row.weight >= 100 ? 'Heavy' : 'Light'),
};

const groupings: Readonly<Record<string, readonly TableGroupBy<Stock>[]>> = {
  Kind: ['kind'],
  'Kind, then origin': ['kind', 'origin'],
  'Weight class': [weightClass],
  None: [],
};

const groupedColumns: TableColumn<Stock>[] = [
  { id: 'name', header: 'Name', allowsSorting: true },
  { id: 'kind', header: 'Kind', allowsSorting: true },
  { id: 'origin', header: 'Origin', allowsSorting: true },
  { id: 'weight', header: 'Weight (g)', align: 'end', allowsSorting: true, aggregate: 'sum' },
  {
    id: 'price',
    header: 'Price',
    align: 'end',
    renderCell: (row) => price.format(row.price),
    aggregate: (rows) => `max ${price.format(Math.max(...rows.map((row) => row.price)))}`,
  },
];

const cities = ['Lisbon', 'Oslo', 'Quito', 'Cairo', 'Porto', 'Seville'];
const manyItems = Array.from({ length: 2000 }, (_, index) => ({
  id: `item-${index + 1}`,
  name: `Item ${index + 1}`,
  city: cities[index % cities.length] ?? 'Lisbon',
  amount: (index * 37) % 1000,
}));

export function Grouping() {
  const [choice, setChoice] = useState('Kind');
  const [collapsed, setCollapsed] = useState<Set<Key>>(new Set());
  return (
    <div data-lab="grouping">
      {Object.keys(groupings).map((name) => (
        <Button
          key={name}
          size="sm"
          variant={choice === name ? 'primary' : 'secondary'}
          onPress={() => setChoice(name)}
        >
          {name}
        </Button>
      ))}
      <Table
        aria-label="Stock, grouped"
        rows={stock}
        columns={groupedColumns}
        groupBy={groupings[choice]}
        collapsedGroups={collapsed}
        onCollapsedGroupsChange={setCollapsed}
        selectionMode="multiple"
        size="sm"
      />
      <output
        data-lab-output
      >{`Collapsed: ${[...collapsed].map(String).join(', ') || 'none'}`}</output>
      <h3>Virtualized groups</h3>
      <div data-lab="grouping-virtualized" style={{ height: 280 }}>
        <Table
          aria-label="Items, grouped by city"
          rows={manyItems}
          columns={[
            { id: 'name', header: 'Name' },
            { id: 'city', header: 'City' },
            { id: 'amount', header: 'Amount', align: 'end', aggregate: 'sum' },
          ]}
          groupBy={['city']}
          defaultCollapsedGroups={['ui-table-group:city=Oslo']}
          renderGroupLabel={(group) => `${String(group.value)} (${group.rows.length} items)`}
          virtualized
          rowHeight={32}
          size="sm"
        />
      </div>
    </div>
  );
}

const sheetColumns: TableColumn<Stock>[] = [
  { id: 'id', header: 'Code' },
  { id: 'name', header: 'Name', allowsEditing: true },
  {
    id: 'weight',
    header: 'Weight (g)',
    align: 'end',
    allowsEditing: true,
    validateValue: (value) =>
      typeof value === 'number' && value >= 0 ? null : 'Enter a weight of 0 or more.',
  },
  {
    id: 'price',
    header: 'Price',
    align: 'end',
    allowsEditing: true,
    parseValue: (text) => (text.trim() === '' ? null : Number(text)),
    validateValue: (value) =>
      value === null || (typeof value === 'number' && Number.isFinite(value))
        ? null
        : 'Enter a price.',
  },
  { id: 'origin', header: 'Origin', allowsEditing: true },
];

export function Spreadsheet() {
  const [rows, setRows] = useState(stock.slice(0, 6));
  const [range, setRange] = useState<TableCellRange | null>(null);
  const [last, setLast] = useState('none');
  return (
    <div data-lab="spreadsheet">
      <Table
        aria-label="Stock, spreadsheet"
        rows={rows}
        columns={sheetColumns}
        cellSelection="range"
        selectedRange={range}
        onSelectedRangeChange={setRange}
        onCellEdit={(edit) => {
          setRows((current) => applyEdits(current, [edit]));
          setLast(describeEdits([edit]));
        }}
        onCellsChange={(edits) => {
          setRows((current) => applyEdits(current, edits));
          setLast(describeEdits(edits));
        }}
        size="sm"
      />
      <output data-lab-output>{`Range: ${describeRange(range)} · Last change: ${last}`}</output>
      <h3>One cell at a time</h3>
      <Table
        aria-label="Stock, one cell at a time"
        rows={stock.slice(0, 3)}
        columns={sheetColumns.slice(0, 3)}
        cellSelection="cell"
        defaultSelectedRange={{
          anchor: { rowKey: 'apple', columnId: 'name' },
          focus: { rowKey: 'apple', columnId: 'name' },
        }}
        size="sm"
      />
    </div>
  );
}

const bulkColumns: TableColumn<Stock>[] = [
  { id: 'name', header: 'Name' },
  {
    id: 'kind',
    header: 'Kind',
    bulkEdit: { type: 'choice', options: ['Fruit', 'Vegetable', 'Herb'] },
  },
  { id: 'origin', header: 'Origin', bulkEdit: { type: 'text' } },
  { id: 'weight', header: 'Weight (g)', align: 'end', bulkEdit: { type: 'number' } },
  { id: 'picked', header: 'Picked', bulkEdit: { type: 'date' } },
  {
    id: 'organic',
    header: 'Organic',
    renderCell: (row) => (row.organic ? 'Yes' : 'No'),
    bulkEdit: { type: 'boolean' },
  },
];

export function BulkEdit() {
  const [rows, setRows] = useState(stock);
  const [selected, setSelected] = useState<Set<Key> | 'all'>(new Set());
  const [last, setLast] = useState('none');
  return (
    <div data-lab="bulk-edit">
      <Table
        aria-label="Stock, bulk edit"
        rows={rows}
        columns={bulkColumns}
        selectionMode="multiple"
        selectedKeys={selected}
        onSelectionChange={setSelected}
        selectionActions={[
          {
            verb: 'delete',
            label: 'Delete selected',
            onPress: () => {
              setRows((current) =>
                current.filter((row) => selected !== 'all' && !selected.has(row.id)),
              );
              setSelected(new Set());
            },
          },
        ]}
        onCellsChange={(edits) => {
          setRows((current) => applyEdits(current, edits));
          setLast(describeEdits(edits));
        }}
        size="sm"
      />
      <output data-lab-output>{`Last change: ${last}`}</output>
    </div>
  );
}
