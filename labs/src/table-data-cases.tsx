import { useState } from 'react';
import { Checkbox } from '../../src/components/checkbox/checkbox.js';
import type { TableColumn, TableExportFile } from '../../src/components/table/index.js';
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
