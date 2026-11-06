import type { TableColumn } from '../../src/components/table/index.js';
import { Table } from '../../src/components/table/table.js';

interface Reading {
  id: string;
  name: string;
  site: string;
  low: number;
  high: number;
}

const sites = ['North', 'South', 'East', 'West'];
const readings: Reading[] = Array.from({ length: 2000 }, (_, index) => ({
  id: `reading-${index + 1}`,
  name: `Reading ${index + 1}`,
  site: sites[index % sites.length] ?? 'North',
  low: (index * 7) % 40,
  high: 40 + ((index * 13) % 60),
}));

const readingColumns: TableColumn<Reading>[] = [
  {
    id: 'name',
    header: 'Name',
    isRowHeader: true,
    allowsSorting: true,
    allowsResizing: true,
    renderFooter: (rows) => `${rows.length} readings`,
  },
  { id: 'site', header: 'Site', allowsSorting: true, allowsResizing: true },
  {
    id: 'low',
    header: 'Low',
    align: 'end',
    allowsSorting: true,
    renderFooter: (rows) => String(Math.min(...rows.map((row) => row.low))),
  },
  {
    id: 'high',
    header: 'High',
    align: 'end',
    allowsSorting: true,
    renderFooter: (rows) => String(Math.max(...rows.map((row) => row.high))),
  },
];

/**
 * A virtualized table with a group header row over its columns and a summary row: the summary
 * stays in the document wherever the table scrolls, and the group row sits above the column headers.
 */
export function VirtualGroupsAndSummary() {
  return (
    <div data-lab="virtualized-groups" style={{ height: 300 }}>
      <Table
        aria-label="Readings, virtualized"
        rows={readings}
        columns={readingColumns}
        columnGroups={[{ id: 'range', header: 'Range', columns: ['low', 'high'] }]}
        selectionMode="multiple"
        virtualized
        rowHeight={36}
      />
    </div>
  );
}
