import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
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

interface Note {
  id: string;
  title: string;
  note: string;
  size: number;
}

const words = 'a short note that wraps onto more lines when it runs long in a column'.split(' ');
const notes: Note[] = Array.from({ length: 1000 }, (_, index) => ({
  id: `note-${index + 1}`,
  title: `Note ${index + 1}`,
  // Every third note is one line; the others repeat the sentence one to four times.
  note:
    index % 3 === 0
      ? 'One line'
      : Array.from({ length: (index % 4) + 1 }, () => words.join(' ')).join(' '),
  size: (index * 17) % 900,
}));

const noteColumns: TableColumn<Note>[] = [
  {
    id: 'title',
    header: 'Title',
    width: 120,
    allowsResizing: true,
    renderFooter: (rows) => `${rows.length} notes`,
  },
  { id: 'note', header: 'Note', cellWrap: 'wrap', allowsResizing: true },
  { id: 'size', header: 'Size', align: 'end', width: 80 },
];

/**
 * A virtualized table measuring each row: one-line and wrapped notes and expandable details all
 * take their natural heights, and every row stays reachable by scrolling and from the keyboard.
 */
export function VirtualMeasuredRows() {
  const [isLong, setLong] = useState(false);
  const [isFixed, setFixed] = useState(false);
  const rows = isLong ? notes.map((row) => ({ ...row, note: `${row.note} ${row.note}` })) : notes;
  return (
    <div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button size="sm" variant="secondary" onPress={() => setLong((current) => !current)}>
          {isLong ? 'Shorten the notes' : 'Lengthen the notes'}
        </Button>
        <Button size="sm" variant="secondary" onPress={() => setFixed((current) => !current)}>
          {isFixed ? 'Use measured rows' : 'Use fixed rows'}
        </Button>
      </div>
      <div data-lab="virtualized-measured" style={{ height: 320 }}>
        <Table
          aria-label="Notes, measured rows"
          rows={rows}
          columns={noteColumns}
          columnGroups={[{ id: 'content', header: 'Content', columns: ['note', 'size'] }]}
          renderRowDetail={(row) => (
            <p>{`${row.title} details. ${words.join(' ')}. ${words.join(' ')}.`}</p>
          )}
          virtualized
          rowHeight={isFixed ? 40 : 'auto'}
          estimatedRowHeight={40}
        />
      </div>
    </div>
  );
}
