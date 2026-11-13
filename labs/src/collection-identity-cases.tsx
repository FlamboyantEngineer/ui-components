import { useState } from 'react';
import { Board, type BoardColumn } from '../../src/components/board/board.js';
import { applyBoardMove, applyColumnMove } from '../../src/components/board/index.js';
import type { TableCellRange, TableCellValue } from '../../src/components/table/index.js';
import { Table } from '../../src/components/table/table.js';
import type { Key, Selection } from '../../src/core/props.js';

interface TypedRow {
  id: Key;
  name: string;
  value: TableCellValue;
}

interface NestedRow {
  id: string;
  name: string;
  kind: string;
  children?: NestedRow[];
}

const groupedRows: NestedRow[] = [
  {
    id: 'ui-table-group:kind=Fruit',
    name: 'Parent row',
    kind: 'Fruit',
    children: [{ id: 'ui-table-group:kind=Fruit:1', name: 'Child row', kind: 'Fruit' }],
  },
];

/** Generated group keys avoid caller keys even when they resemble the group's own path. */
export function GroupKeyTable() {
  return (
    <Table
      aria-label="Independent group and row expansion"
      rows={groupedRows}
      columns={[
        { id: 'name', header: 'Name' },
        { id: 'kind', header: 'Kind' },
      ]}
      getChildRows={(row) => row.children}
      groupBy={['kind']}
      data-lab-demo="group-keys"
    />
  );
}

const typedRows: TypedRow[] = [
  { id: 1, name: 'Numeric key', value: 10 },
  { id: '1', name: 'Text key', value: 20 },
  { id: 'a b', name: 'Spaced key', value: 30 },
  { id: 'ab', name: 'Joined key', value: 40 },
];

/** Similar-looking keys keep selection, editing, ranges and accessible row names separate. */
export function TypedTable() {
  const [rows, setRows] = useState(typedRows);
  const [selected, setSelected] = useState<Selection>(new Set());
  const [range, setRange] = useState<TableCellRange | null>(null);
  return (
    <div data-lab-demo="typed-table">
      <Table
        aria-label="Distinct row keys"
        rows={rows}
        columns={[
          { id: 'name', header: 'Name' },
          { id: 'value', header: 'Value', allowsEditing: true },
          {
            id: 'val ue',
            header: 'Double value',
            getValue: (row) => (typeof row.value === 'number' ? row.value * 2 : row.value),
          },
        ]}
        selectionMode="multiple"
        selectedKeys={selected}
        onSelectionChange={setSelected}
        cellSelection="range"
        onSelectedRangeChange={setRange}
        renderRowDetail={(row) => `Details for ${row.name}`}
        onCellsChange={(edits) =>
          setRows((current) =>
            current.map((row) => {
              const edit = edits.find((candidate) => candidate.row === row);
              return edit ? { ...row, value: edit.value } : row;
            }),
          )
        }
      />
      <p data-lab-output="typed-selection">
        Selected: {selected === 'all' ? 'all' : JSON.stringify([...selected])}
      </p>
      <p data-lab-output="typed-range">Range: {JSON.stringify(range)}</p>
    </div>
  );
}

const shelves = [
  { id: 'a', name: 'Alpha shelf', code: 'A-1', maker: 'North works', size: 'Large' },
  { id: 'b', name: 'Blue shelf', code: 'B-2', maker: 'South works', size: 'Small' },
];

/** Column ids that an object also inherits: each pins, resizes and filters like any other id. */
export function ObjectKeyTable() {
  return (
    <div data-lab-demo="object-key-table" style={{ maxWidth: 420, overflowX: 'auto' }}>
      <Table
        aria-label="Prototype-named column ids"
        rows={shelves}
        columns={[
          { id: '__proto__', header: 'Code', pin: 'start', width: 90, getValue: (row) => row.code },
          {
            id: 'constructor',
            header: 'Maker',
            pin: 'start',
            width: 130,
            allowsResizing: true,
            filter: { type: 'text' },
            getValue: (row) => row.maker,
          },
          { id: 'name', header: 'Name', width: 160 },
          { id: 'valueOf', header: 'Size', width: 120, getValue: (row) => row.size },
        ]}
      />
    </div>
  );
}

const typedColumns: BoardColumn[] = [
  { id: 1, title: 'Numeric column' },
  { id: '1', title: 'Text column' },
];

const typedCards = [
  { id: 1 as Key, title: 'Numeric card', column: 1 as Key },
  { id: '1' as Key, title: 'Text card', column: 1 as Key },
];

/** Moves preserve the original key type and return focus to the correct card or column. */
export function TypedBoard() {
  const [items, setItems] = useState(typedCards);
  const [columns, setColumns] = useState(typedColumns);
  return (
    <div data-lab-demo="typed-board">
      <Board
        aria-label="Distinct board keys"
        columns={columns}
        items={items}
        getColumn={(item) => item.column}
        getTextValue={(item) => item.title}
        renderCard={(item) => item.title}
        onMove={(move) =>
          setItems((current) =>
            applyBoardMove(current, move, (item, cell) => ({ ...item, column: cell.column })),
          )
        }
        onColumnMove={(move) => setColumns((current) => applyColumnMove(current, move))}
      />
    </div>
  );
}
