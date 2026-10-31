import { useState } from 'react';
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
      description="3,000 stores, each a row group; only the rows in view are rendered."
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
  </>,
);
