// Cases of the table lab for row groups.
import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import type { TableColumn, TableGroupBy } from '../../src/components/table/index.js';
import { Table } from '../../src/components/table/table.js';
import type { Key } from '../../src/core/props.js';
import { GroupParentIdentity, GroupPeerIdentity } from './table-group-identity-cases.js';

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

const price = new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' });

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

interface CodedReading {
  id: string;
  name: string;
  code: string | number | boolean;
  amount: number;
}

// Imported data can mix a number with the text of the same number: each keeps its own group.
const codedReadings: CodedReading[] = [
  { id: 'r1', name: 'First reading', code: 1, amount: 10 },
  { id: 'r2', name: 'Second reading', code: '1', amount: 20 },
  { id: 'r3', name: 'Third reading', code: true, amount: 30 },
  { id: 'r4', name: 'Fourth reading', code: 'true', amount: 40 },
];

interface Delivery {
  id: string;
  name: string;
  due: Date;
}

const ancient = new Date(2024, 4, 1, 12);
ancient.setFullYear(999);

// Imported dates: two on the same local day, one late in the evening, an unreadable one and an
// early year, which groups and filters by its four-digit day.
const deliveries: Delivery[] = [
  { id: 'd1', name: 'Morning crate', due: new Date(2024, 4, 1, 8) },
  { id: 'd2', name: 'Evening crate', due: new Date(2024, 4, 1, 23, 30) },
  { id: 'd3', name: 'Unreadable crate', due: new Date('not a date') },
  { id: 'd4', name: 'Archive crate', due: ancient },
];

const dayFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

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
      <h3>Mixed value types</h3>
      <div data-lab="grouping-typed">
        <Table
          aria-label="Readings, grouped by code"
          rows={codedReadings}
          columns={[
            { id: 'name', header: 'Name' },
            { id: 'code', header: 'Code' },
            { id: 'amount', header: 'Amount', align: 'end', aggregate: 'sum' },
          ]}
          groupBy={['code']}
          renderGroupLabel={(group) => `Code ${String(group.value)} (${typeof group.value})`}
          size="sm"
        />
      </div>
      <h3>Dates</h3>
      <div data-lab="grouping-dates">
        <Table
          aria-label="Deliveries, grouped by day"
          rows={deliveries}
          columns={[
            { id: 'name', header: 'Name' },
            {
              id: 'due',
              header: 'Due',
              filter: { type: 'date' },
              renderCell: (row) =>
                Number.isNaN(row.due.getTime()) ? 'Unreadable' : dayFormat.format(row.due),
            },
          ]}
          groupBy={['due']}
          size="sm"
        />
      </div>
      <GroupPeerIdentity />
      <GroupParentIdentity />
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
