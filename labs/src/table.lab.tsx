import { useState } from 'react';
import type { Key, Selection, SortDescriptor } from 'react-aria-components';
import { Button } from '../../src/components/button/button.js';
import { IconButton } from '../../src/components/icon-button/icon-button.js';
import { Table, type TableProps } from '../../src/components/table/table.js';
import {
  applyTableMove,
  sortTableRows,
  type TableColumn,
} from '../../src/components/table/table-rows.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

interface Fruit {
  id: string;
  name: string;
  colour: string;
  origin: string;
  weight: number;
  isFixed?: boolean;
}

const fruit: Fruit[] = [
  { id: 'apple', name: 'Apple', colour: 'Red', origin: 'Lisbon', weight: 180 },
  { id: 'banana', name: 'Banana', colour: 'Yellow', origin: 'Quito', weight: 120 },
  { id: 'cherry', name: 'Cherry', colour: 'Red', origin: 'Oslo', weight: 8 },
  { id: 'date', name: 'Date', colour: 'Brown', origin: 'Cairo', weight: 24 },
  { id: 'fig', name: 'Fig', colour: 'Purple', origin: 'Izmir', weight: 50 },
  { id: 'grape', name: 'Grape', colour: 'Green', origin: 'Porto', weight: 5 },
  { id: 'kiwi', name: 'Kiwi', colour: 'Brown', origin: 'Napier', weight: 75 },
  { id: 'lemon', name: 'Lemon', colour: 'Yellow', origin: 'Seville', weight: 100 },
];

const columns: TableColumn<Fruit>[] = [
  { id: 'name', header: 'Name', allowsSorting: true },
  { id: 'colour', header: 'Colour', allowsSorting: true },
  { id: 'origin', header: 'Origin' },
  { id: 'weight', header: 'Weight (g)', align: 'end', allowsSorting: true },
];

const resizableColumns: TableColumn<Fruit>[] = [
  { id: 'name', header: 'Name', width: 160, minWidth: 100, maxWidth: 240, allowsResizing: true },
  { id: 'colour', header: 'Colour', width: '1fr', minWidth: 90, allowsResizing: true },
  { id: 'weight', header: 'Weight (g)', width: 120, minWidth: 90, align: 'end' },
];

const states = ['rows', 'selected', 'disabled row', 'loading', 'empty', 'error'] as const;

const stateProps: Record<(typeof states)[number], Partial<TableProps<Fruit>>> = {
  rows: {},
  selected: { selectionMode: 'multiple', defaultSelectedKeys: ['banana'] },
  'disabled row': { selectionMode: 'multiple', disabledKeys: ['banana'] },
  loading: { isPending: true },
  empty: { rows: [], emptyMessage: 'No fruit yet' },
  error: { errorMessage: 'The fruit could not be loaded.', onRetry: () => {} },
};

const cities = ['Lisbon', 'Oslo', 'Quito', 'Cairo', 'Porto', 'Seville', 'Napier', 'Izmir'];
const manyRows = Array.from({ length: 10_000 }, (_, index) => ({
  id: `row-${index + 1}`,
  name: `Item ${index + 1}`,
  city: cities[index % cities.length] ?? 'Lisbon',
  amount: (index * 37) % 1000,
}));

function SortAndFilter() {
  const [sort, setSort] = useState<SortDescriptor | null>(null);
  return (
    <div data-lab="sort">
      <Table
        aria-label="Fruit, sorted by the table"
        rows={fruit}
        columns={columns}
        filterable
        filterLabel="Filter fruit"
      />
      <h3>Sorted by the caller</h3>
      <Table
        aria-label="Fruit, sorted by the caller"
        rows={sortTableRows(fruit, columns, sort)}
        columns={columns}
        sortDescriptor={sort}
        onSortChange={setSort}
      />
      <output data-lab-output>
        {sort ? `${String(sort.column)} ${sort.direction}` : 'Unsorted'}
      </output>
    </div>
  );
}

function Selection() {
  const [selected, setSelected] = useState<Selection>(new Set(['cherry']));
  const [action, setAction] = useState('None');
  const count = selected === 'all' ? fruit.length : selected.size;
  return (
    <div data-lab="selection">
      <Table
        aria-label="Fruit, selectable"
        rows={fruit.slice(0, 5)}
        columns={columns}
        selectionMode="multiple"
        selectedKeys={selected}
        onSelectionChange={setSelected}
        disabledKeys={['date']}
        actionsColumnWidth={72}
        renderRowActions={(row) => (
          <>
            <IconButton
              icon="edit"
              label={`Edit ${row.name}`}
              size="sm"
              onPress={() => setAction(`Edit ${row.name}`)}
            />
            <IconButton
              icon="delete"
              label={`Delete ${row.name}`}
              size="sm"
              onPress={() => setAction(`Delete ${row.name}`)}
            />
          </>
        )}
      />
      <output data-lab-output>{`${count} selected · Action: ${action}`}</output>
    </div>
  );
}

function Resizing() {
  const [mounted, setMounted] = useState(true);
  const [widths, setWidths] = useState('Not resized');
  return (
    <div data-lab="resize">
      <Button onPress={() => setMounted((value) => !value)}>{mounted ? 'Unmount' : 'Mount'}</Button>
      {mounted ? (
        <Table
          aria-label="Fruit, resizable"
          rows={fruit.slice(0, 4)}
          columns={resizableColumns}
          persistKey="lab.table.widths"
          onColumnWidthsChange={(next) => setWidths(JSON.stringify(next))}
        />
      ) : null}
      <output data-lab-output>{widths}</output>
    </div>
  );
}

function Reordering() {
  const [rows, setRows] = useState(
    fruit.slice(0, 5).map((row) => ({ ...row, isFixed: row.id === 'date' })),
  );
  const [last, setLast] = useState('None');
  return (
    <div data-lab="reorder">
      <Table
        aria-label="Fruit, reorderable"
        rows={rows}
        columns={columns.slice(0, 2)}
        reorder={{
          canMove: (row) => !row.isFixed,
          onMove: (move) => {
            setRows((current) => applyTableMove(current, move));
            setLast(`${move.keys.join(', ')} ${move.position} ${String(move.targetKey)}`);
          },
        }}
      />
      <output data-lab-output>{`Last move: ${last}`}</output>
    </div>
  );
}

function Notices() {
  const [mode, setMode] = useState<'rows' | 'loading' | 'error'>('error');
  const [retries, setRetries] = useState(0);
  const [activated, setActivated] = useState<Key | null>(null);
  return (
    <div data-lab="notices">
      <Button onPress={() => setMode('loading')}>Load</Button>
      <Button onPress={() => setMode('error')}>Fail</Button>
      <Button onPress={() => setMode('rows')}>Show rows</Button>
      <Table
        aria-label="Fruit, with notices"
        rows={fruit.slice(0, 3)}
        columns={columns}
        selectionMode="multiple"
        onRowAction={setActivated}
        isPending={mode === 'loading'}
        loadingMessage="Loading fruit"
        errorMessage={mode === 'error' ? 'The fruit could not be loaded.' : undefined}
        onRetry={() => setRetries((value) => value + 1)}
      />
      <output
        data-lab-output
      >{`Retries: ${retries} · Activated: ${String(activated ?? 'none')}`}</output>
    </div>
  );
}

mountLab(
  <>
    <LabSection title="States" description="Each state at both row sizes.">
      <StateMatrix
        axes={{ state: states, size: ['md', 'sm'] }}
        render={({ state, size }) => (
          <Table
            aria-label={`Fruit, ${state}, ${size}`}
            rows={fruit.slice(0, 3)}
            columns={columns}
            size={size}
            {...stateProps[state]}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Sorting and filtering"
      description="Header presses cycle ascending, descending and unsorted."
    >
      <SortAndFilter />
    </LabSection>
    <LabSection
      title="Selection and row actions"
      description="Checkboxes, select all, a disabled row and an actions column."
    >
      <Selection />
    </LabSection>
    <LabSection
      title="Resizing"
      description="Bounded widths, persisted under a key across remounts."
    >
      <Resizing />
    </LabSection>
    <LabSection
      title="Reordering"
      description="Drag a row or its handle, or press Alt+Arrow keys. Date stays put."
    >
      <Reordering />
    </LabSection>
    <LabSection
      title="Notices"
      description="Loading and error replace the rows; retry is a real button."
    >
      <Notices />
    </LabSection>
    <LabSection
      title="Sticky header"
      description="The header stays in view in a bounded scroll area."
    >
      <div data-lab="sticky" style={{ height: 240 }}>
        <Table
          aria-label="Fruit, sticky header"
          rows={[...fruit, ...fruit.map((row) => ({ ...row, id: `${row.id}-2` }))]}
          columns={columns}
          stickyHeader
          size="sm"
          defaultSortDescriptor={{ column: 'name', direction: 'ascending' }}
        />
      </div>
    </LabSection>
    <LabSection title="Virtualized" description="10,000 rows; only those in view are rendered.">
      <div data-lab="virtualized" style={{ height: 320 }}>
        <Table
          aria-label="Items, virtualized"
          rows={manyRows}
          columns={[
            { id: 'name', header: 'Name', allowsSorting: true },
            { id: 'city', header: 'City', allowsSorting: true },
            { id: 'amount', header: 'Amount', align: 'end', allowsSorting: true },
          ]}
          selectionMode="multiple"
          virtualized
          rowHeight={36}
        />
      </div>
    </LabSection>
  </>,
);
