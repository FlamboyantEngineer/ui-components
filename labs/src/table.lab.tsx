import { DeleteGlyph, EditGlyph } from '../../src/core/glyphs.js';
import { useState } from 'react';
import type { Key, Selection, SortDescriptor } from '../../src/core/props.js';
import { Button } from '../../src/components/button/button.js';
import { Checkbox } from '../../src/components/checkbox/checkbox.js';
import { Table, type TableProps } from '../../src/components/table/table.js';
import { applyTableMove, type TableColumn } from '../../src/components/table/index.js';
import { sortTableRows } from '../../src/components/table/index.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { LabOutput } from './lab-output.js';
import {
  CallerFilter,
  CellWrapping,
  ColumnFilters,
  ColumnLayout,
  DetailRows,
  Editing,
  LoadingMore,
  LocaleSort,
  MultipleSort,
  NestedRows,
  NestedRowActions,
  Pages,
  Summary,
} from './table-cases.js';
import { BulkEdit, Grouping, SmallSteps, Spreadsheet } from './table-sheet-cases.js';
import { GroupKeyTable, ObjectKeyTable, TypedTable } from './collection-identity-cases.js';
import { HeaderFilter, PickerCell } from './table-control-cases.js';
import {
  ContentWidths,
  FluidColumns,
  GroupedReordering,
  ShareWeights,
} from './table-content-contracts.js';
import { RepeatedSelection } from './table-selection-cases.js';
import {
  ControlledLayout,
  ControlledMultipleSort,
  SecondTreeColumn,
  SeededTable,
  SelectionModes,
} from './table-owned-cases.js';

function TrailingActions() {
  const [count, setCount] = useState(0);
  return (
    <>
      <Table
        aria-label="Trailing actions"
        rows={fruit}
        columns={columns}
        trailingContent={<Button onPress={() => setCount((value) => value + 1)}>Add item</Button>}
      />
      <output role="status" aria-label="Added items">
        {count}
      </output>
    </>
  );
}

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
        rows={sortTableRows(fruit, { columns, sort, locale: 'en-US' })}
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
            <Button
              icon={EditGlyph}
              label={`Edit ${row.name}`}
              size="sm"
              onPress={() => setAction(`Edit ${row.name}`)}
            />
            <Button
              icon={DeleteGlyph}
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

function HeaderControls() {
  const [isOunces, setOunces] = useState(false);
  const [selected, setSelected] = useState<Selection>(new Set());
  const count = selected === 'all' ? 3 : selected.size;
  return (
    <div data-lab="header-controls">
      <Table
        aria-label="Fruit, with a unit switch"
        rows={fruit.slice(0, 3)}
        selectionMode="multiple"
        selectedKeys={selected}
        onSelectionChange={setSelected}
        columns={[
          { id: 'name', header: 'Name' },
          {
            id: 'weight',
            textValue: 'Weight',
            align: 'end',
            header: (
              <>
                Weight{' '}
                <Checkbox isSelected={isOunces} onChange={setOunces}>
                  Ounces
                </Checkbox>
              </>
            ),
            renderCell: (row) =>
              isOunces ? `${(row.weight / 28.35).toFixed(1)} oz` : `${row.weight} g`,
          },
        ]}
      />
      <LabOutput name="header-selected">{count}</LabOutput>
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
  const [arranging, setArranging] = useState(true);
  const [grouped, setGrouped] = useState(false);
  return (
    <div data-lab="reorder">
      <Button size="sm" isSelected={arranging} onPress={() => setArranging(!arranging)}>
        Arrange
      </Button>
      <Button size="sm" isSelected={grouped} onPress={() => setGrouped(!grouped)}>
        Group by colour
      </Button>
      <Table
        aria-label="Fruit, reorderable"
        rows={rows}
        columns={columns.slice(0, 2)}
        groupBy={grouped ? ['colour'] : []}
        reorder={
          arranging
            ? {
                canMove: (row) => !row.isFixed,
                onMove: (move) => {
                  setRows((current) => applyTableMove(current, move));
                  setLast(`${move.keys.join(', ')} ${move.position} ${String(move.targetKey)}`);
                },
              }
            : undefined
        }
      />
      <output data-lab-output>{`Last move: ${last}`}</output>
    </div>
  );
}

const stock: Record<string, number> = { apple: 12, banana: 0, cherry: 40, date: 3, fig: 7 };

function RowMarks() {
  const [rows, setRows] = useState(fruit.slice(0, 4));
  const [added, setAdded] = useState<string[]>([]);
  const addFig = () => {
    const fig = fruit.find((row) => row.id === 'fig');
    if (!fig || added.includes(fig.id)) return;
    setRows((current) => [...current, fig]);
    setAdded((current) => [...current, fig.id]);
  };
  return (
    <div data-lab="row-marks">
      <Button onPress={addFig}>Add fig</Button>
      <Table
        aria-label="Fruit, with row marks"
        rows={rows}
        columns={[
          ...columns.slice(0, 2),
          { id: 'stock', header: 'Stock', align: 'end', getValue: (row) => stock[row.id] ?? 0 },
        ]}
        getRowAttributes={(row) => {
          const count = stock[row.id] ?? 0;
          return {
            'data-change': added.includes(row.id) ? 'added' : undefined,
            'data-status': count === 0 ? 'empty' : count < 5 ? 'low' : undefined,
          };
        }}
      />
    </div>
  );
}

function HandleReordering() {
  const [rows, setRows] = useState(fruit.slice(0, 5));
  const [last, setLast] = useState('None');
  return (
    <div data-lab="handle-reorder">
      <Table
        aria-label="Fruit, dragged by handle"
        rows={rows}
        columns={columns.slice(0, 3)}
        selectionMode="multiple"
        reorder={{
          dragTrigger: 'handle',
          renderDragPreview: (dragged) =>
            dragged.length === 1 ? dragged[0]?.name : `${dragged.length} fruit`,
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
    <LabSection
      title="Content widths"
      description="Content-sized header and cells beside a flexible column; resize to keep an explicit width. Pick an ancestor scale or zoom: the content columns keep the same layout width, only drawn larger or smaller."
    >
      <ContentWidths />
    </LabSection>
    <LabSection
      title="Fluid columns"
      description="Every static table lays its columns out as a CSS grid. Here a flexible, resizable Name column (at least 200 pixels) sits beside a 100 pixel State column: drag the separator and Name follows the pane in the same frame; below 300 pixels the table scrolls. Drag the Name resizer, or press Enter on it and the arrow keys, to give Name a fixed width. Widths are kept under Layout A or Layout B: switching layout while a resize is under way cancels it, so neither layout keeps it."
    >
      <FluidColumns />
    </LabSection>
    <LabSection
      title="Weighted shares"
      description="Flexible columns keep their weights until a cap stops them. Name (1fr) and Kind (2fr) are capped at 1000 pixels they never reach, so Kind stays twice Name; Size (1fr) stops at its 90 pixel cap and Note (2fr, at least 100) and the others split what it leaves. The virtualized copy below lays out the same widths."
    >
      <ShareWeights />
    </LabSection>
    <LabSection
      title="Moves within groups"
      description="Move eligible rows inside their current group; fixed rows and group headers never drag."
    >
      <GroupedReordering />
    </LabSection>
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
      description="Checkboxes, select all, a disabled row and an actions column. The last table switches between single selection, single required selection (disallowEmptySelection: the selected row cannot be cleared), multiple selection that toggles each pressed row, and multiple selection that replaces the selection on a press (selectionBehavior replace; Ctrl or Shift extends it); the selected keys are shown below it."
    >
      <Selection />
      <RepeatedSelection />
      <SelectionModes />
    </LabSection>
    <LabSection
      title="A control in a header"
      description="The weight header holds a checkbox that switches the unit; the select-all checkbox keeps its own role."
    >
      <HeaderControls />
    </LabSection>
    <LabSection
      title="A search field in a sortable header"
      description="Edit with caret keys, spaces and Enter. Control+Enter or Command+Enter applies the modal; direct header activation still sorts."
    >
      <HeaderFilter />
    </LabSection>
    <LabSection
      title="A picker in a cell"
      description="ArrowDown opens the cell's listbox; Escape returns focus without moving or selecting the row."
    >
      <PickerCell />
    </LabSection>
    <LabSection
      title="Resizing"
      description="Bounded widths, persisted under a key across remounts."
    >
      <Resizing />
    </LabSection>
    <LabSection
      title="Cell wrapping"
      description="Prose wraps, the name keeps one line, the reference breaks anywhere."
    >
      <CellWrapping />
    </LabSection>
    <LabSection
      title="Reordering"
      description="Drag a row or its handle, or press Alt+Arrow keys. Date stays put. Arrange and grouping turn reordering off and on without remounting the table."
    >
      <Reordering />
    </LabSection>
    <LabSection
      title="Dragging by the handle"
      description="Only the handle starts a pointer drag; selected rows drag together under a count."
    >
      <HandleReordering />
    </LabSection>
    <LabSection
      title="Row marks"
      description="getRowAttributes marks whole rows: an added row, a low stock and an empty one."
    >
      <RowMarks />
    </LabSection>
    <LabSection
      title="Notices"
      description="Loading and error replace the rows; retry is a real button."
    >
      <Notices />
    </LabSection>
    <LabSection
      title="Sticky header"
      description="Scroll inside this 240-pixel area: the column header stays fixed while the rows move."
    >
      <div data-lab="sticky" style={{ height: 240 }}>
        <Table
          aria-label="Fruit, sticky header"
          rows={Array.from({ length: 8 }, (_, index) =>
            fruit.map((row) => ({ ...row, id: `${row.id}-${index}` })),
          ).flat()}
          columns={columns}
          stickyHeader
          size="sm"
          defaultSortDescriptor={{ column: 'name', direction: 'ascending' }}
        />
      </div>
    </LabSection>
    <LabSection
      title="Sorting by several columns"
      description="Shift with a header press adds a column to the sort; headers show their priority. Below, the host owns the sort (sortDescriptors) and orders the rows itself with sortTableRows: the buttons set or clear it from outside, and header presses report back."
    >
      <MultipleSort />
      <h3>Sorted by the host</h3>
      <ControlledMultipleSort />
    </LabSection>
    <LabSection
      title="Sorting by language"
      description="Text sorts in the provider's language. Swedish orders Å and Ö after Z; German and English order them beside A and O. Switch the language and the order follows; the place filter lists its values the same way."
    >
      <LocaleSort />
    </LabSection>
    <LabSection
      title="Column filters"
      description="Text, set, number and date filters from each header, beside the search box. The caller below owns the filter and filters its rows with filterTableRows, as the table would. The last table starts with defaultFilter (search e, Kind Fruit) and defaultColumnLayout (Colour first, Weight hidden), then owns both."
    >
      <ColumnFilters />
      <h3>Filtered by the caller</h3>
      <CallerFilter />
      <h3>Arranged and filtered at first</h3>
      <SeededTable />
    </LabSection>
    <LabSection
      title="Column layout"
      description="Pinned name and price, groups, a columns menu and draggable headers, persisted across remounts. Below, the host owns the layout (columnLayout): the buttons reorder, hide and reset columns from outside, and the columns menu and header moves report back."
    >
      <ColumnLayout />
      <h3>Arranged by the host</h3>
      <ControlledLayout />
    </LabSection>
    <LabSection
      title="Nested rows"
      description="Expand with the chevron or ArrowRight; sorting keeps sibling order stable, and filtering retains the places above a deep match. The place filter lists collapsed places too. The garden plan below puts its expand buttons in its second column with treeColumn."
    >
      <NestedRows />
      <h3>Expand buttons in the second column</h3>
      <SecondTreeColumn />
    </LabSection>
    <LabSection
      title="Nested row actions"
      description="Each action keeps focus while it runs, while the others are unavailable and when a region is appended."
    >
      <NestedRowActions />
    </LabSection>
    <LabSection title="Detail rows" description="An expanded row shows a full-width detail.">
      <DetailRows />
    </LabSection>
    <LabSection title="Pagination" description="Three rows per page, by the table or the caller.">
      <Pages />
    </LabSection>
    <LabSection
      title="Editing"
      description="F2, Enter or a double click opens a cell's editor; Enter commits and Escape cancels. In Weight, plain decimal text such as 12.5 becomes a number, while 0x10, 1e3 or an integer too large to hold exactly stays text. A disabled row opens no editor, and disabling the row of an open editor closes it without an edit. With a Japanese, Chinese or Korean input method, Enter and Escape confirm or cancel the candidate and leave the editor open."
    >
      <Editing />
    </LabSection>
    <LabSection
      title="Trailing action"
      description="An ordinary action spans the columns without selecting a data row."
    >
      <TrailingActions />
    </LabSection>
    <LabSection title="Summary row" description="Totals of every row the filter keeps.">
      <Summary />
    </LabSection>
    <LabSection
      title="Distinct row keys"
      description="Numeric, text and spaced keys name separate rows. Select, edit or expand each row independently."
    >
      <TypedTable />
    </LabSection>
    <LabSection
      title="Prototype-named column ids"
      description="Columns with the ids __proto__, constructor and valueOf: Code and Maker stay pinned side by side while the table scrolls, Maker resizes and filters, like any other column."
    >
      <ObjectKeyTable />
    </LabSection>
    <LabSection
      title="Independent group and row expansion"
      description="The group's generated key avoids the parent's similarly named row key. Expand the parent, collapse the group and reopen it: the child's visibility is retained."
    >
      <GroupKeyTable />
    </LabSection>
    <LabSection
      title="Loading more"
      description="Scrolling to the end asks for the next twenty rows; the loading row reads the table's own loading message under the rows already loaded."
    >
      <LoadingMore />
    </LabSection>
    <LabSection
      title="Row groups"
      description="Groups by one or two columns or a computed value, with counts and sums; collapse with the chevron or ArrowLeft. Numeric aggregates also handle large groups. A number and the text of the same number keep separate groups. Dates group by their local day, the day the date filter reads, with an unreadable date among the empty values and an early year as its four-digit day."
    >
      <Grouping />
    </LabSection>
    <LabSection
      title="Spreadsheet mode"
      description="Select ranges with Shift, copy and paste, type to edit, fill with the handle or Ctrl+D and Ctrl+R, Delete to clear. Cancelling a fill leaves the cells unchanged. On a touch screen, only the finger that started a fill or range drag moves it; a second finger resting on a cell changes nothing. In the one-cell table, the Organic switches keep their presses: toggling one selects no cell."
    >
      <Spreadsheet />
    </LabSection>
    <LabSection
      title="Small numeric steps"
      description="Select the first two values and drag the fill handle through the last row. Tiny steps continue in scientific notation; uneven values repeat instead. Large pastes are clipped to the available cells."
    >
      <SmallSteps />
    </LabSection>
    <LabSection
      title="Bulk edit"
      description="Select rows, then set one column across them from the selection bar."
    >
      <BulkEdit />
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
