// Cases of the table lab for sorting by several columns, column filters, the column layout,
// nested and detail rows, pagination, editing, the summary row, loading more and cell wrapping.
import { useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import {
  filterTableRows,
  type TableColumn,
  type TableColumnGroup,
  type TableColumnLayout,
  type TableFilter,
} from '../../src/components/table/index.js';
import { Table } from '../../src/components/table/table.js';
import { PlusGlyph } from '../../src/core/glyphs.js';
import type { Key, SortDescriptor } from '../../src/core/props.js';
import { UiProvider } from '../../src/core/provider.js';
import { requireDefined } from './require-defined.js';

interface Produce {
  id: string;
  name: string;
  kind: string;
  colour: string;
  origin: string;
  weight: number;
  price: number;
  picked: string;
}

interface Place {
  id: string;
  name: string;
  people: number;
  area: number;
  places?: Place[];
}

const produce: Produce[] = [
  {
    id: 'apple',
    name: 'Apple',
    kind: 'Fruit',
    colour: 'Red',
    origin: 'Lisbon',
    weight: 180,
    price: 1.2,
    picked: '2026-10-02',
  },
  {
    id: 'banana',
    name: 'Banana',
    kind: 'Fruit',
    colour: 'Yellow',
    origin: 'Quito',
    weight: 120,
    price: 0.4,
    picked: '2026-10-05',
  },
  {
    id: 'carrot',
    name: 'Carrot',
    kind: 'Vegetable',
    colour: 'Orange',
    origin: 'Porto',
    weight: 60,
    price: 0.3,
    picked: '2026-10-09',
  },
  {
    id: 'date',
    name: 'Date',
    kind: 'Fruit',
    colour: 'Brown',
    origin: 'Cairo',
    weight: 24,
    price: 2.1,
    picked: '2026-10-11',
  },
  {
    id: 'eggplant',
    name: 'Eggplant',
    kind: 'Vegetable',
    colour: 'Purple',
    origin: 'Izmir',
    weight: 300,
    price: 1.6,
    picked: '2026-10-14',
  },
  {
    id: 'fig',
    name: 'Fig',
    kind: 'Fruit',
    colour: 'Purple',
    origin: 'Izmir',
    weight: 50,
    price: 0.9,
    picked: '2026-10-15',
  },
  {
    id: 'garlic',
    name: 'Garlic',
    kind: 'Vegetable',
    colour: 'White',
    origin: 'Seville',
    weight: 40,
    price: 0.5,
    picked: '2026-10-18',
  },
  {
    id: 'kiwi',
    name: 'Kiwi',
    kind: 'Fruit',
    colour: 'Brown',
    origin: 'Napier',
    weight: 75,
    price: 0.6,
    picked: '2026-10-21',
  },
];

const places: Place[] = [
  {
    id: 'pt',
    name: 'Portugal',
    people: 10_400,
    area: 92_212,
    places: [
      { id: 'lisbon', name: 'Lisbon', people: 545, area: 100 },
      {
        id: 'porto',
        name: 'Porto',
        people: 232,
        area: 41,
        places: [{ id: 'ribeira', name: 'Ribeira', people: 4, area: 1 }],
      },
    ],
  },
  {
    id: 'no',
    name: 'Norway',
    people: 5_500,
    area: 385_207,
    places: [{ id: 'oslo', name: 'Oslo', people: 709, area: 454 }],
  },
  { id: 'is', name: 'Iceland', people: 390, area: 103_000 },
];

const sortColumns: TableColumn<Produce>[] = [
  { id: 'name', header: 'Name', allowsSorting: true },
  { id: 'kind', header: 'Kind', allowsSorting: true },
  { id: 'colour', header: 'Colour', allowsSorting: true },
  { id: 'weight', header: 'Weight (g)', align: 'end', allowsSorting: true },
];

const filterColumns: TableColumn<Produce>[] = [
  { id: 'name', header: 'Name', filter: { type: 'text' } },
  { id: 'colour', header: 'Colour', filter: { type: 'set' } },
  { id: 'weight', header: 'Weight (g)', align: 'end', filter: { type: 'number' } },
  { id: 'picked', header: 'Picked', filter: { type: 'date' } },
];

const layoutColumns: TableColumn<Produce>[] = [
  { id: 'name', header: 'Name', pin: 'start', width: 120 },
  { id: 'kind', header: 'Kind', width: 140, allowsHiding: true, allowsReordering: true },
  { id: 'colour', header: 'Colour', width: 140, allowsHiding: true, allowsReordering: true },
  { id: 'origin', header: 'Origin', width: 140, allowsHiding: true, allowsReordering: true },
  { id: 'weight', header: 'Weight (g)', width: 140, align: 'end', allowsReordering: true },
  { id: 'price', header: 'Price', width: 120, align: 'end', pin: 'end' },
];

const layoutGroups: TableColumnGroup[] = [
  { id: 'look', header: 'Look', columns: ['kind', 'colour'] },
  { id: 'measures', header: 'Measures', columns: ['weight', 'price'] },
];

const placeColumns: TableColumn<Place>[] = [
  { id: 'name', header: 'Place', allowsSorting: true },
  { id: 'people', header: 'People (thousands)', align: 'end', allowsSorting: true },
  { id: 'area', header: 'Area (km²)', align: 'end' },
];

const price = new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' });

function describeSort(sort: readonly SortDescriptor[]): string {
  return sort.length === 0
    ? 'Unsorted'
    : sort.map((descriptor) => `${String(descriptor.column)} ${descriptor.direction}`).join(', ');
}

export function MultipleSort() {
  const [sort, setSort] = useState<readonly SortDescriptor[]>([
    { column: 'kind', direction: 'ascending' },
  ]);
  return (
    <div data-lab="multiple-sort">
      <Table
        aria-label="Produce, sorted by several columns"
        rows={produce}
        columns={sortColumns}
        defaultSortDescriptors={sort}
        onSortDescriptorsChange={setSort}
        size="sm"
      />
      <output data-lab-output>{describeSort(sort)}</output>
    </div>
  );
}

interface Town {
  id: string;
  name: string;
  region: string;
}

const towns: Town[] = [
  { id: 'zurich', name: 'Zürich', region: 'Alps' },
  { id: 'orebro', name: 'Örebro', region: 'Lakes' },
  { id: 'malmo', name: 'Malmö', region: 'Coast' },
  { id: 'are', name: 'Åre', region: 'Alps' },
  { id: 'oslo', name: 'Oslo', region: 'Coast' },
  { id: 'aarhus', name: 'Aarhus', region: 'Coast' },
];

const townColumns: TableColumn<Town>[] = [
  { id: 'name', header: 'Place', allowsSorting: true, filter: { type: 'set' } },
  { id: 'region', header: 'Region', allowsSorting: true },
];

const sortLocales = [
  { value: 'sv-SE', label: 'Swedish' },
  { value: 'de-DE', label: 'German' },
  { value: 'en-US', label: 'English' },
];

export function LocaleSort() {
  const [locale, setLocale] = useState('sv-SE');
  return (
    <div data-lab="locale-sort">
      <SegmentedChoice
        aria-label="Sort language"
        options={sortLocales}
        value={locale}
        onChange={(value) => setLocale(value ?? 'sv-SE')}
        size="sm"
        sizing="content"
      />
      <UiProvider locale={locale}>
        <Table
          aria-label="Places, sorted in the chosen language"
          rows={towns}
          columns={townColumns}
          defaultSortDescriptor={{ column: 'name', direction: 'ascending' }}
          size="sm"
        />
      </UiProvider>
    </div>
  );
}

export function ColumnFilters() {
  const [filter, setFilter] = useState<TableFilter>({});
  return (
    <div data-lab="column-filters">
      <Table
        aria-label="Produce, with column filters"
        rows={produce}
        columns={filterColumns}
        filterable
        filterLabel="Search produce"
        onFilterChange={setFilter}
        size="sm"
      />
      <output data-lab-output>{JSON.stringify(filter)}</output>
    </div>
  );
}

/** A caller that filters on its side, as a server would, and shows the table its filter. */
export function CallerFilter() {
  const [filter, setFilter] = useState<TableFilter>({ columns: { colour: ['Purple'] } });
  const columns = [requireDefined(filterColumns[0]), requireDefined(filterColumns[1])];
  // The caller filters as the table would, as a server could.
  const rows = filterTableRows(produce, columns, filter);
  return (
    <div data-lab="caller-filter">
      <Table
        aria-label="Produce, filtered by the caller"
        rows={rows}
        columns={columns}
        filterable
        filterLabel="Search names and colours"
        filter={filter}
        onFilterChange={setFilter}
        size="sm"
      />
    </div>
  );
}

export function ColumnLayout() {
  const [mounted, setMounted] = useState(true);
  const [layout, setLayout] = useState<TableColumnLayout>({});
  return (
    <div data-lab="layout">
      <Button onPress={() => setMounted((value) => !value)}>{mounted ? 'Unmount' : 'Mount'}</Button>
      {mounted ? (
        <div style={{ maxWidth: 520 }}>
          <Table
            aria-label="Produce, arranged"
            rows={produce.slice(0, 4)}
            columns={layoutColumns}
            columnGroups={layoutGroups}
            selectionMode="multiple"
            persistKey="lab.table.layout"
            onColumnLayoutChange={setLayout}
            size="sm"
          />
        </div>
      ) : null}
      <output data-lab-output>{JSON.stringify(layout)}</output>
    </div>
  );
}

// The place filter lists every nested place, expanded or not.
const nestedColumns: TableColumn<Place>[] = placeColumns.map((column) =>
  column.id === 'name' ? { ...column, filter: { type: 'set' } } : column,
);

export function NestedRows() {
  return (
    <div data-lab="nested">
      <Table
        aria-label="Places, nested"
        rows={places}
        columns={nestedColumns}
        getChildRows={(place) => place.places}
        defaultExpandedKeys={['pt']}
        filterable
        filterLabel="Filter places"
        size="sm"
      />
    </div>
  );
}

const actionPlaces: Place[] = [
  {
    id: 'pt',
    name: 'Portugal',
    people: 10_400,
    area: 92_212,
    places: [
      { id: 'lisbon', name: 'Lisbon', people: 545, area: 100 },
      { id: 'porto', name: 'Porto', people: 232, area: 41 },
    ],
  },
];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function NestedRowActions() {
  const [rows, setRows] = useState(actionPlaces);
  const [expanded, setExpanded] = useState<Iterable<Key>>(['pt']);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState('None');
  const add = async (place: Place) => {
    setBusy(true);
    await wait(400);
    const id = `region-${rows.length}`;
    const town = { id: `town-${rows.length}`, name: `Town ${rows.length}`, people: 1, area: 1 };
    setRows((current) => [
      ...current,
      { id, name: `Region ${rows.length}`, people: 1, area: 1, places: [town] },
    ]);
    setExpanded((current) => [...current, id]);
    setBusy(false);
    setLast(`Added after ${place.name}`);
  };
  return (
    <div data-lab="nested-actions">
      <Table
        aria-label="Places, with actions"
        rows={rows}
        columns={placeColumns.slice(0, 2)}
        getChildRows={(place) => place.places}
        expandedKeys={expanded}
        onExpandedChange={setExpanded}
        renderRowActions={(place) =>
          place.places ? null : (
            <Button
              icon={PlusGlyph}
              label={`Add after ${place.name}`}
              tooltip={`Add after ${place.name}`}
              focusableWhenDisabled
              isDisabled={busy}
              onPress={() => add(place)}
            />
          )
        }
        size="sm"
      />
      <output data-lab-output>{last}</output>
    </div>
  );
}

export function DetailRows() {
  const [opened, setOpened] = useState('None');
  return (
    <div data-lab="detail">
      <Table
        aria-label="Produce, with details"
        rows={produce.slice(0, 3)}
        columns={sortColumns.slice(0, 3)}
        selectionMode="multiple"
        renderRowDetail={(row) => (
          <p>
            {`${row.name} comes from ${row.origin}, picked on ${row.picked}. `}
            <Button size="sm" variant="secondary" onPress={() => setOpened(row.name)}>
              {`Open ${row.name}`}
            </Button>
          </p>
        )}
        size="sm"
      />
      <output data-lab-output>{`Opened: ${opened}`}</output>
    </div>
  );
}

export function Pages() {
  const [page, setPage] = useState(1);
  const pageSize = 3;
  return (
    <div data-lab="pages">
      <Table
        aria-label="Produce, paged"
        rows={produce}
        columns={sortColumns}
        filterable
        filterLabel="Filter paged produce"
        pagination={{ pageSize }}
        size="sm"
      />
      <h3>Paged by the caller</h3>
      <Table
        aria-label="Produce, paged by the caller"
        rows={produce.slice((page - 1) * pageSize, page * pageSize)}
        columns={sortColumns.slice(0, 2)}
        pagination={{ pageSize, page, onPageChange: setPage, rowCount: produce.length }}
        size="sm"
      />
    </div>
  );
}

/**
 * A button that turns a change on a second after it is pressed, which leaves time to open an editor
 * first, and turns it off at once.
 */
function DelayedToggle({
  isOn,
  onChange,
  on,
  off,
}: {
  isOn: boolean;
  onChange: (isOn: boolean) => void;
  on: string;
  off: string;
}) {
  return (
    <Button
      size="sm"
      onPress={() => {
        if (isOn) onChange(false);
        else window.setTimeout(() => onChange(true), 1000);
      }}
    >
      {isOn ? off : on}
    </Button>
  );
}

export function Editing() {
  const [rows, setRows] = useState(produce.slice(0, 4));
  const [last, setLast] = useState('None');
  const [isLocked, setLocked] = useState(false);
  const [isRemoved, setRemoved] = useState(false);
  const [isWeightLocked, setWeightLocked] = useState(false);
  const columns: TableColumn<Produce>[] = [
    { id: 'name', header: 'Name', allowsEditing: true },
    { id: 'weight', header: 'Weight (g)', align: 'end', allowsEditing: !isWeightLocked },
    {
      id: 'kind',
      header: 'Kind',
      allowsEditing: true,
      renderEditor: (row, editor) => (
        <select
          aria-label={editor.label}
          defaultValue={String(editor.value)}
          autoFocus
          onChange={(event) => editor.commit(event.target.value)}
          onBlur={editor.cancel}
        >
          <option>Fruit</option>
          <option>Vegetable</option>
        </select>
      ),
    },
  ];
  return (
    <div data-lab="editing">
      <DelayedToggle
        isOn={isLocked}
        onChange={setLocked}
        on="Disable the Apple row in a second"
        off="Enable the Apple row"
      />
      <DelayedToggle
        isOn={isRemoved}
        onChange={setRemoved}
        on="Remove the Apple row in a second"
        off="Restore the Apple row"
      />
      <DelayedToggle
        isOn={isWeightLocked}
        onChange={setWeightLocked}
        on="Lock weights in a second"
        off="Unlock weights"
      />
      <Table
        aria-label="Produce, editable"
        rows={isRemoved ? rows.filter((row) => row.id !== 'apple') : rows}
        columns={columns}
        disabledKeys={isLocked ? ['apple'] : undefined}
        onCellEdit={({ row, columnId, value }) => {
          setRows((current) =>
            current.map((item) => (item.id === row.id ? { ...item, [columnId]: value } : item)),
          );
          setLast(`${row.name} ${columnId}: ${String(value)}`);
        }}
        size="sm"
      />
      <output data-lab-output>{`Last edit: ${last}`}</output>
    </div>
  );
}

export function Summary() {
  const columns: TableColumn<Produce>[] = [
    { id: 'name', header: 'Name', renderFooter: (rows) => `${rows.length} items` },
    { id: 'kind', header: 'Kind' },
    {
      id: 'price',
      header: 'Price',
      align: 'end',
      renderCell: (row) => price.format(row.price),
      renderFooter: (rows) => price.format(rows.reduce((total, row) => total + row.price, 0)),
    },
  ];
  return (
    <div data-lab="summary">
      <Table
        aria-label="Produce, with totals"
        rows={produce}
        columns={columns}
        filterable
        filterLabel="Filter totals"
        selectionMode="multiple"
        size="sm"
      />
    </div>
  );
}

const loadPageSize = 20;
const allItems = Array.from({ length: 60 }, (_, index) => ({
  id: `item-${index + 1}`,
  name: `Item ${index + 1}`,
  amount: (index * 37) % 1000,
}));

export function LoadingMore() {
  const [count, setCount] = useState(loadPageSize);
  const [isLoading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const loadMore = () => {
    if (isLoading || count >= allItems.length) return;
    setLoading(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setCount((value) => value + loadPageSize);
      setLoading(false);
    }, 200);
  };
  return (
    <div data-lab="load-more">
      <div style={{ height: 240 }}>
        <Table
          aria-label="Items, loading more"
          rows={allItems.slice(0, count)}
          columns={[
            { id: 'name', header: 'Name' },
            { id: 'amount', header: 'Amount', align: 'end' },
          ]}
          stickyHeader
          size="sm"
          onLoadMore={count < allItems.length ? loadMore : undefined}
          isLoading={isLoading}
          loadingMessage="Loading more items…"
        />
      </div>
      <output data-lab-output>{`${count} of ${allItems.length} loaded`}</output>
    </div>
  );
}

interface Sample {
  id: string;
  name: string;
  note: string;
  reference: string;
}

const samples: Sample[] = [
  {
    id: 'one',
    name: 'First sample with a long name',
    note: 'Collected in the morning and kept cool until it was weighed in the afternoon.',
    reference: 'sample-0001-a7f3c9e2b4d6f8a0c1e3b5d7f9a2c4e6',
  },
  {
    id: 'two',
    name: 'Second sample',
    note: 'Short note.',
    reference: 'sample-0002-0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e',
  },
];

const wrapColumns: TableColumn<Sample>[] = [
  {
    id: 'name',
    header: 'Name',
    cellWrap: 'nowrap',
    width: 140,
    minWidth: 80,
    allowsResizing: true,
  },
  {
    id: 'reference',
    header: 'Reference',
    cellWrap: 'anywhere',
    width: 150,
    minWidth: 100,
    allowsResizing: true,
    renderCell: (row) => <code>{row.reference}</code>,
  },
  { id: 'note', header: 'Note', width: '1fr', minWidth: 160, allowsResizing: true },
];

/** Prose wraps by the table's default; the name keeps one line and the reference breaks anywhere. */
export function CellWrapping() {
  return (
    <div data-lab="cell-wrap" style={{ maxWidth: 520 }}>
      <Table
        aria-label="Samples, wrapped"
        rows={samples}
        columns={wrapColumns}
        cellWrap="wrap"
        selectionMode="multiple"
      />
    </div>
  );
}
