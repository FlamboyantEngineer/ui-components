// Cases of the table lab for state the host owns or seeds: the sort by several columns, the column
// layout, a starting filter, selection modes and constraints, and a tree column that is not first.

import { useState } from 'react';
import type { Key, Selection, SortDescriptor } from '../../src/core/props.js';
import { Button } from '../../src/components/button/button.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import {
  Table,
  sortTableRows,
  type TableColumn,
  type TableColumnLayout,
  type TableFilter,
  type TableProps,
} from '../../src/components/table/index.js';

interface Crop {
  id: string;
  name: string;
  kind: string;
  colour: string;
  weight: number;
}

const crops: Crop[] = [
  { id: 'pear', name: 'Pear', kind: 'Fruit', colour: 'Green', weight: 170 },
  { id: 'leek', name: 'Leek', kind: 'Vegetable', colour: 'Green', weight: 300 },
  { id: 'plum', name: 'Plum', kind: 'Fruit', colour: 'Purple', weight: 60 },
  { id: 'beet', name: 'Beet', kind: 'Vegetable', colour: 'Purple', weight: 140 },
  { id: 'lime', name: 'Lime', kind: 'Fruit', colour: 'Green', weight: 65 },
];

const cropColumns: TableColumn<Crop>[] = [
  { id: 'name', header: 'Name', allowsSorting: true },
  {
    id: 'kind',
    header: 'Kind',
    allowsSorting: true,
    allowsHiding: true,
    allowsReordering: true,
    filter: { type: 'set' },
  },
  {
    id: 'colour',
    header: 'Colour',
    allowsSorting: true,
    allowsHiding: true,
    allowsReordering: true,
  },
  {
    id: 'weight',
    header: 'Weight (g)',
    align: 'end',
    allowsSorting: true,
    allowsHiding: true,
    allowsReordering: true,
  },
];

function Output({ name, value }: { name: string; value: string }) {
  return (
    <p>
      {name}: <output data-lab-output={name}>{value}</output>
    </p>
  );
}

function describeSort(sort: readonly SortDescriptor[]): string {
  return sort.map((entry) => `${String(entry.column)} ${entry.direction}`).join(', ') || 'Unsorted';
}

const byKindThenName: readonly SortDescriptor[] = [
  { column: 'kind', direction: 'ascending' },
  { column: 'name', direction: 'descending' },
];

/** The host owns the sort by several columns and sorts the rows itself with `sortTableRows`. */
export function ControlledMultipleSort() {
  const [sort, setSort] = useState<readonly SortDescriptor[]>([
    { column: 'colour', direction: 'ascending' },
  ]);
  const rows = sortTableRows(crops, { columns: cropColumns, sort, locale: 'en' });
  return (
    <div data-lab="controlled-sort">
      <Button size="sm" variant="secondary" onPress={() => setSort(byKindThenName)}>
        Kind, then name descending
      </Button>{' '}
      <Button size="sm" variant="secondary" onPress={() => setSort([])}>
        Clear the sort
      </Button>
      <Table
        aria-label="Crops, sorted by the host"
        rows={rows}
        columns={cropColumns}
        sortDescriptors={sort}
        onSortDescriptorsChange={setSort}
        size="sm"
      />
      <Output name="controlled-sort" value={describeSort(sort)} />
    </div>
  );
}

function describeLayout(layout: TableColumnLayout): string {
  const order = layout.order?.join(', ') ?? 'declared';
  return `order ${order}; hidden ${layout.hidden?.join(', ') || 'none'}`;
}

/** The host owns the column order and hidden columns, and changes them from outside. */
export function ControlledLayout() {
  const [layout, setLayout] = useState<TableColumnLayout>({});
  return (
    <div data-lab="controlled-layout">
      <Button
        size="sm"
        variant="secondary"
        onPress={() => setLayout({ ...layout, order: ['name', 'weight', 'colour', 'kind'] })}
      >
        Weight before Colour and Kind
      </Button>{' '}
      <Button
        size="sm"
        variant="secondary"
        onPress={() => setLayout({ ...layout, hidden: ['colour'] })}
      >
        Hide Colour
      </Button>{' '}
      <Button size="sm" variant="secondary" onPress={() => setLayout({})}>
        Reset the layout
      </Button>
      <Table
        aria-label="Crops, arranged by the host"
        rows={crops}
        columns={cropColumns}
        columnLayout={layout}
        onColumnLayoutChange={setLayout}
        size="sm"
      />
      <Output name="controlled-layout" value={describeLayout(layout)} />
    </div>
  );
}

const startLayout: TableColumnLayout = { order: ['colour', 'name', 'kind'], hidden: ['weight'] };
const startFilter: TableFilter = { query: 'p', columns: { kind: ['Fruit'] } };

/**
 * A table that starts arranged (`defaultColumnLayout`) and filtered (`defaultFilter`), then owns
 * both, reporting each change.
 */
export function SeededTable() {
  const [filter, setFilter] = useState<TableFilter>(startFilter);
  const [layout, setLayout] = useState<TableColumnLayout>(startLayout);
  return (
    <div data-lab="seeded">
      <Table
        aria-label="Crops, arranged and filtered at first"
        rows={crops}
        columns={cropColumns}
        defaultColumnLayout={startLayout}
        onColumnLayoutChange={setLayout}
        filterable
        filterLabel="Search crops"
        defaultFilter={startFilter}
        onFilterChange={setFilter}
        size="sm"
      />
      <Output name="seeded-layout" value={describeLayout(layout)} />
      <Output name="seeded-filter" value={JSON.stringify(filter)} />
    </div>
  );
}

type SelectionProps = Pick<
  TableProps<Crop>,
  'selectionMode' | 'selectionBehavior' | 'disallowEmptySelection'
>;

const selectionModes = {
  single: { label: 'Single', props: { selectionMode: 'single' } },
  required: {
    label: 'Single, required',
    props: { selectionMode: 'single', disallowEmptySelection: true },
  },
  toggle: { label: 'Multiple, toggle', props: { selectionMode: 'multiple' } },
  replace: {
    label: 'Multiple, replace',
    props: { selectionMode: 'multiple', selectionBehavior: 'replace' },
  },
} as const satisfies Record<string, { label: string; props: SelectionProps }>;

type SelectionChoice = keyof typeof selectionModes;

const isSelectionChoice = (value: unknown): value is SelectionChoice =>
  typeof value === 'string' && Object.hasOwn(selectionModes, value);

function formatKeys(keys: Selection): string {
  return keys === 'all' ? 'all' : [...keys].map(String).join(', ') || 'none';
}

/** Single, required, toggle and replace selection on the same rows, with the selection read out. */
export function SelectionModes() {
  const [choice, setChoice] = useState<SelectionChoice>('single');
  const [selected, setSelected] = useState<Selection>(new Set<Key>(['pear']));
  return (
    <div data-lab="selection-modes">
      <SegmentedChoice
        aria-label="Selection"
        size="sm"
        sizing="content"
        options={Object.entries(selectionModes).map(([value, { label }]) => ({ value, label }))}
        value={choice}
        onChange={(value) => {
          if (!isSelectionChoice(value)) return;
          setChoice(value);
          setSelected(new Set<Key>(['pear']));
        }}
      />
      <Table
        key={choice}
        aria-label={`Crops, ${selectionModes[choice].label} selection`}
        rows={crops}
        columns={cropColumns}
        {...selectionModes[choice].props}
        selectedKeys={selected}
        onSelectionChange={setSelected}
        size="sm"
      />
      <Output name="selected" value={formatKeys(selected)} />
    </div>
  );
}

interface Step {
  id: string;
  code: string;
  name: string;
  steps?: Step[];
}

const plan: Step[] = [
  {
    id: 'sow',
    code: 'A1',
    name: 'Sow',
    steps: [
      { id: 'soak', code: 'A1.1', name: 'Soak the seeds' },
      { id: 'tray', code: 'A1.2', name: 'Fill the trays' },
    ],
  },
  { id: 'water', code: 'A2', name: 'Water' },
  {
    id: 'harvest',
    code: 'A3',
    name: 'Harvest',
    steps: [{ id: 'pick', code: 'A3.1', name: 'Pick the ripe ones' }],
  },
];

/** Nested rows whose expand buttons sit in the second column, `name`, not the first. */
export function SecondTreeColumn() {
  return (
    <div data-lab="tree-column">
      <Table
        aria-label="Garden plan"
        rows={plan}
        columns={[
          { id: 'code', header: 'Code', width: 80 },
          { id: 'name', header: 'Step', isRowHeader: true },
        ]}
        getChildRows={(step) => step.steps}
        treeColumn="name"
        defaultExpandedKeys={['sow']}
        size="sm"
      />
    </div>
  );
}
