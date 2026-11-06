import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Checkbox } from '../../src/components/checkbox/checkbox.js';
import {
  type TableCellEdit,
  type TableColumn,
  type TableExportFile,
  useTableEditHistory,
} from '../../src/components/table/index.js';
import { Table } from '../../src/components/table/table.js';
import { LabOutput } from './lab-output.js';

interface Plant {
  id: string;
  name: string;
  family: string;
  height: number;
  note: string;
}

const plants: Plant[] = [
  { id: 'basil', name: 'Basil', family: 'Mint', height: 45, note: 'Sweet, "Genovese"' },
  { id: 'chive', name: 'Chive', family: 'Onion', height: 30, note: 'Hollow leaves' },
  { id: 'dill', name: 'Dill', family: 'Carrot', height: 90, note: '=Feathery' },
  { id: 'fennel', name: 'Fennel', family: 'Carrot', height: 150, note: 'Bulb\nand fronds' },
  { id: 'mint', name: 'Mint', family: 'Mint', height: 60, note: 'Spreads, fast' },
  { id: 'sage', name: 'Sage', family: 'Mint', height: 70, note: '-Grey leaves' },
];

const plantColumns: TableColumn<Plant>[] = [
  { id: 'name', header: 'Name', allowsSorting: true },
  { id: 'family', header: 'Family', allowsSorting: true, allowsHiding: true },
  {
    id: 'height',
    header: 'Height (cm)',
    align: 'end',
    allowsSorting: true,
    allowsHiding: true,
    getExportText: (row) => `${row.height} cm`,
  },
  { id: 'note', header: 'Note', allowsHiding: true },
];

/**
 * CSV export: the menu writes the current page, every filtered row or the selection. The first
 * table downloads its file; the second shows the text it would write.
 */
export function CsvExport() {
  const [file, setFile] = useState<TableExportFile | null>(null);
  const [givesAll, setGivesAll] = useState(false);
  return (
    <div data-lab="csv-export">
      <section data-lab-demo="csv-download">
        <Table
          aria-label="Plants to download"
          rows={plants}
          columns={plantColumns}
          filterable
          selectionMode="multiple"
          pagination={{ pageSize: 4 }}
          csvExport={{ fileName: 'plants.csv' }}
        />
      </section>
      <section data-lab-demo="csv-preview">
        <Checkbox isSelected={givesAll} onChange={setGivesAll}>
          Give every row
        </Checkbox>
        <Table
          aria-label="Plants, caller paged"
          rows={plants.slice(0, 3)}
          columns={plantColumns}
          pagination={{ pageSize: 3, rowCount: plants.length }}
          csvExport={{
            fileName: 'plants.csv',
            columns: ['note', 'name'],
            allRows: givesAll ? plants : undefined,
            onExport: setFile,
          }}
        />
        <LabOutput name="csv-scope">{file?.scope ?? 'none'}</LabOutput>
        <pre data-lab-output="csv-text">{file?.text ?? ''}</pre>
      </section>
    </div>
  );
}

const editableColumns: TableColumn<Plant>[] = [
  { id: 'name', header: 'Name', allowsEditing: true, allowsSorting: true },
  { id: 'family', header: 'Family', allowsEditing: true, bulkEdit: { type: 'text' } },
  {
    id: 'height',
    header: 'Height (cm)',
    align: 'end',
    allowsEditing: true,
    allowsSorting: true,
    validateValue: (value) => (typeof value === 'number' && value > 0 ? null : 'Above zero'),
    bulkEdit: { type: 'number' },
  },
];

function applyEdits(rows: readonly Plant[], edits: readonly TableCellEdit<Plant>[]): Plant[] {
  return rows.map((row) =>
    edits
      .filter((edit) => edit.row.id === row.id)
      .reduce((next, edit) => ({ ...next, [edit.columnId]: edit.value }), row),
  );
}

/**
 * Undo and redo: edits, pastes, fills, clears and bulk edits each undo as one step, from the
 * buttons or Control+Z on the grid. A height changed elsewhere is never overwritten.
 */
export function EditHistory() {
  const [rows, setRows] = useState(plants.slice(0, 4));
  const [generation, setGeneration] = useState(0);
  const history = useTableEditHistory({ limit: 20, resetKey: generation });
  const [last, setLast] = useState('none');
  const apply = (edits: readonly TableCellEdit<Plant>[]) => {
    setLast(edits.map((edit) => `${String(edit.row.id)}.${edit.columnId}`).join(' '));
    setRows((current) => applyEdits(current, edits));
  };
  return (
    <div data-lab="edit-history">
      <Button isDisabled={!history.canUndo} onPress={history.undo}>
        Undo
      </Button>
      <Button isDisabled={!history.canRedo} onPress={history.redo}>
        Redo
      </Button>
      <Button
        onPress={() =>
          setRows((current) =>
            current.map((row) => (row.id === 'basil' ? { ...row, height: row.height + 1 } : row)),
          )
        }
      >
        Grow Basil elsewhere
      </Button>
      <Button
        onPress={() => {
          setRows(plants.slice(0, 4));
          setGeneration((value) => value + 1);
        }}
      >
        Reload the plants
      </Button>
      <Table
        aria-label="Plants with undo"
        rows={rows}
        columns={editableColumns}
        cellSelection="range"
        selectionMode="multiple"
        editHistory={history}
        onCellEdit={(edit) => apply([edit])}
        onCellsChange={apply}
      />
      <LabOutput name="history-last">{last}</LabOutput>
    </div>
  );
}
