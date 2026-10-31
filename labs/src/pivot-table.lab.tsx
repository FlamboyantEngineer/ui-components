import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { PivotTable, type PivotTableField } from '../../src/components/pivot-table/pivot-table.js';
import type { PivotLayout } from '../../src/utils/pivot.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const regions = ['North', 'South', 'East'] as const;
const fruits = ['Apple', 'Pear', 'Plum', 'Cherry'] as const;

/** Deterministic sample sales: every region, fruit and quarter of two years, a few left out. */
const sales = regions.flatMap((region, regionIndex) =>
  fruits.flatMap((fruit, fruitIndex) =>
    [2025, 2026].flatMap((year) =>
      [1, 2, 3, 4]
        .filter((quarter) => (regionIndex + fruitIndex + quarter + year) % 5 !== 0)
        .map((quarter) => ({
          region,
          fruit,
          year,
          quarter,
          boxes: 20 + ((regionIndex * 7 + fruitIndex * 11 + quarter * 5 + year) % 37),
          price: 1.5 + ((fruitIndex + quarter) % 4) * 0.25,
          store: regionIndex === 2 && fruitIndex === 3 ? '' : `Store ${(fruitIndex % 2) + 1}`,
        })),
    ),
  ),
);

const fields: PivotTableField[] = [
  { id: 'region', label: 'Region' },
  { id: 'fruit', label: 'Fruit' },
  { id: 'store', label: 'Store' },
  { id: 'year', label: 'Year' },
  { id: 'quarter', label: 'Quarter', formatKey: (key) => `Q${String(key)}` },
  { id: 'boxes', label: 'Boxes', aggregate: 'sum' },
  {
    id: 'price',
    label: 'Price',
    aggregate: 'average',
    formatOptions: { style: 'currency', currency: 'EUR' },
  },
];

const layouts = {
  'rows and columns': { rows: ['region'], columns: ['year'], values: [{ field: 'boxes' }] },
  'several values': {
    rows: ['fruit'],
    columns: ['year'],
    values: [
      { field: 'boxes', aggregate: 'sum' },
      { field: 'price', aggregate: 'average' },
    ],
  },
  'nested rows': {
    rows: ['region', 'fruit'],
    columns: [],
    values: [
      { field: 'boxes', aggregate: 'max' },
      {
        field: 'store',
        label: 'Stores',
        aggregate: (values: readonly unknown[]) => new Set(values.filter(Boolean)).size,
      },
    ],
  },
  'no row fields': {
    rows: [],
    columns: ['quarter'],
    values: [{ field: 'boxes', aggregate: 'min' }],
  },
  empty: { rows: ['region'], columns: ['year'], values: [{ field: 'boxes' }] },
} satisfies Record<string, PivotLayout>;
const layoutNames = Object.keys(layouts) as Array<keyof typeof layouts>;

function Output({ name, value }: { name: string; value: string }) {
  return (
    <p>
      {name}: <output data-lab-output={name}>{value}</output>
    </p>
  );
}

function describeLayout(layout: PivotLayout): string {
  const values = layout.values.map((value) =>
    typeof value.aggregate === 'function'
      ? value.field
      : `${value.aggregate ?? 'sum'} ${value.field}`,
  );
  return `rows ${layout.rows.join(', ') || '-'}; columns ${layout.columns.join(', ') || '-'}; values ${values.join(', ') || '-'}`;
}

function SalesExplorer() {
  const [layout, setLayout] = useState<PivotLayout>({
    rows: ['region', 'fruit'],
    columns: ['year'],
    values: [{ field: 'boxes', aggregate: 'sum' }],
  });
  return (
    <>
      <PivotTable
        aria-label="Fruit sales"
        records={sales}
        fields={fields}
        layout={layout}
        onLayoutChange={setLayout}
        defaultExpandedKeys={['["North"]']}
        fieldChooser
        data-lab-field="sales"
      />
      <Output name="layout" value={describeLayout(layout)} />
    </>
  );
}

function QuarterlyTotals() {
  const [expanded, setExpanded] = useState<string[]>([]);
  return (
    <>
      <PivotTable
        aria-label="Quarterly boxes"
        records={sales}
        fields={fields}
        defaultLayout={{
          rows: ['year', 'quarter'],
          columns: ['region'],
          values: [{ field: 'boxes' }],
        }}
        expandedKeys={expanded}
        onExpandedChange={(keys) => setExpanded([...keys].map(String))}
        data-lab-field="quarters"
      />
      <Output name="expanded" value={expanded.join(' ') || 'none'} />
    </>
  );
}

function RepeatedFields() {
  const [layout, setLayout] = useState<PivotLayout>({
    rows: ['a'],
    columns: [],
    values: [{ field: 'a' }],
  });
  return (
    <>
      <PivotTable
        aria-label="Repeated fields"
        records={[{ a: 2, 'values:a:3': 3, 'values:a:3:1': 4 }]}
        fields={[
          { id: 'a', label: 'Amount' },
          { id: 'values:a:3', label: 'Other' },
          { id: 'values:a:3:1', label: 'Third' },
        ]}
        layout={layout}
        onLayoutChange={setLayout}
        fieldChooser
        data-lab-field="repeated"
      />
      <Output name="repeated-layout" value={describeLayout(layout)} />
    </>
  );
}

const teamTotals = [
  { team: 'Team A', region: 'North', amount: 100, units: 1 },
  { team: 'Team A', region: 'South', amount: 1, units: 9 },
  { team: 'Team B', region: 'North', amount: 10, units: 2 },
  { team: 'Team B', region: 'South', amount: 2, units: 3 },
];
const eastTotals = [
  { team: 'Team A', region: 'East', amount: 50, units: 5 },
  { team: 'Team B', region: 'East', amount: 60, units: 6 },
];
const amountAndUnits = [{ field: 'amount' }, { field: 'units' }];

/** Data and values that change under a sort: the sort stays on its region and value. */
function ChangingColumns() {
  const [hasEast, setHasEast] = useState(false);
  const [isSwapped, setSwapped] = useState(false);
  return (
    <>
      <p>
        <Button onPress={() => setHasEast((current) => !current)}>
          {hasEast ? 'Remove East' : 'Add East'}
        </Button>{' '}
        <Button onPress={() => setSwapped((current) => !current)}>Swap values</Button>
      </p>
      <PivotTable
        aria-label="Team totals"
        records={hasEast ? [...teamTotals, ...eastTotals] : teamTotals}
        fields={[
          { id: 'team', label: 'Team' },
          { id: 'region', label: 'Region' },
          { id: 'amount', label: 'Amount' },
          { id: 'units', label: 'Units' },
        ]}
        layout={{
          rows: ['team'],
          columns: ['region'],
          values: isSwapped ? [...amountAndUnits].reverse() : amountAndUnits,
        }}
        data-lab-field="changing"
      />
    </>
  );
}

/** Deliveries to 3,000 stores, each a row group of the virtualized pivot. */
const deliveries = Array.from({ length: 6000 }, (_, index) => ({
  store: `Store ${String(Math.floor(index / 2) + 1).padStart(4, '0')}`,
  fruit: fruits[index % fruits.length],
  boxes: 5 + ((index * 7) % 23),
}));

mountLab(
  <>
    <LabSection
      title="States"
      description="Row and column fields, several values, nested row groups with a custom aggregation, no row fields, and no records."
    >
      <StateMatrix
        axes={{ layout: layoutNames }}
        render={({ layout }) => (
          <PivotTable
            aria-label={`Sales, ${layout}`}
            records={layout === 'empty' ? [] : sales}
            fields={fields}
            defaultLayout={layouts[layout]}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Large dataset"
      description="Minimum, maximum and average summarize 200,000 readings in one compact group."
    >
      <PivotTable
        aria-label="Large dataset"
        records={Array.from({ length: 200_000 }, (_, reading) => ({ reading }))}
        fields={[{ id: 'reading', label: 'Reading' }]}
        defaultLayout={{
          rows: [],
          columns: [],
          values: [
            { label: 'Low', field: 'reading', aggregate: 'min' },
            { label: 'High', field: 'reading', aggregate: 'max' },
            { label: 'Average', field: 'reading', aggregate: 'average' },
          ],
        }}
      />
    </LabSection>
    <LabSection
      title="Virtualized"
      description="3,000 stores, each a row group; only the rows in view are rendered, plus the totals row, which stays in the document while out of view."
    >
      <div data-lab-demo="virtualized" style={{ height: 320 }}>
        <PivotTable
          aria-label="Deliveries by store"
          records={deliveries}
          fields={[
            { id: 'store', label: 'Store' },
            { id: 'fruit', label: 'Fruit' },
            { id: 'boxes', label: 'Boxes' },
          ]}
          defaultLayout={{ rows: ['store'], columns: [], values: [{ field: 'boxes' }] }}
          virtualized
          rowHeight={36}
        />
      </div>
    </LabSection>
    <LabSection
      title="Field chooser"
      description="Drag fields between Fields, Rows, Columns and Values, or focus a card and press Alt with an arrow key; pick a value's aggregation on its card. Press a column header to sort, and expand a region to see its fruit."
    >
      <SalesExplorer />
    </LabSection>
    <LabSection
      title="Controlled expansion"
      description="Years expand into quarters; the expanded group keys are held by the page."
    >
      <QuarterlyTotals />
    </LabSection>
    <LabSection
      title="Repeated fields"
      description="Amount appears as both a row field and a value. Move either card independently while the other offered fields remain available."
    >
      <RepeatedFields />
    </LabSection>
    <LabSection
      title="Missing fields"
      description="Fields named like built-in object members (constructor, toString) read only what a record holds: the first record lacks both and falls in the empty group with nothing to count."
    >
      <PivotTable
        aria-label="Notes by maker"
        records={[{}, { constructor: 'Maker 1', toString: 'yes' }]}
        fields={[
          { id: 'constructor', label: 'Maker' },
          { id: 'toString', label: 'Text' },
        ]}
        defaultLayout={{
          rows: ['constructor'],
          columns: [],
          values: [{ field: 'toString', aggregate: 'count' }],
        }}
        data-lab-field="missing"
      />
    </LabSection>
    <LabSection
      title="Changing columns"
      description="Sort by a region's value, then add or remove East or swap the values: the sort stays on the same region and value, and a sorted region that leaves takes its sort with it."
    >
      <ChangingColumns />
    </LabSection>
  </>,
);
