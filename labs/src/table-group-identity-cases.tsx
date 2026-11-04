import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Table } from '../../src/components/table/table.js';
import type { TableColumn, TableGroup } from '../../src/components/table/index.js';

interface Reading {
  id: string;
  name: string;
  code: number | string | Date;
}

const readings: Reading[] = [
  { id: 'number', name: 'Number reading', code: 1 },
  { id: 'text', name: 'Text reading', code: '1' },
];
const datedReadings: Reading[] = [
  { id: 'date', name: 'Date reading', code: new Date(2024, 4, 1, 8) },
  { id: 'text', name: 'Text reading', code: '2024-05-01' },
];
const columns: TableColumn<Reading>[] = [
  { id: 'name', header: 'Name' },
  {
    id: 'code',
    header: 'Code',
    renderCell: (row) => (row.code instanceof Date ? '1 May 2024 (date)' : String(row.code)),
  },
];

function labelGroup(group: TableGroup<Reading>) {
  const code = group.rows[0]?.code;
  const kind = code instanceof Date ? 'Date' : typeof code === 'number' ? 'Number' : 'Text';
  return `${kind} ${group.level === 2 ? 'secondary' : 'group'}`;
}

export function GroupPeerIdentity() {
  const [hasPeer, setHasPeer] = useState(false);
  return (
    <div data-lab="grouping-peer-identity">
      <h3>Collapse across changing groups</h3>
      <p>Collapse the number group, add its text peer, then search or change pages.</p>
      <Button onPress={() => setHasPeer((value) => !value)}>
        {hasPeer ? 'Remove text peer' : 'Add text peer'}
      </Button>
      <Table
        aria-label="Readings, changing groups"
        rows={hasPeer ? readings : readings.slice(0, 1)}
        columns={columns}
        groupBy={['code']}
        renderGroupLabel={labelGroup}
        filterable
        pagination={{ pageSize: 1 }}
        size="sm"
      />
    </div>
  );
}

export function GroupParentIdentity() {
  const [isDescending, setIsDescending] = useState(false);
  return (
    <div data-lab="grouping-parent-identity">
      <h3>Collapse under typed parents</h3>
      <p>Collapse the date group's secondary group, then reverse the group order.</p>
      <Button onPress={() => setIsDescending((value) => !value)}>Reverse group order</Button>
      <Table
        aria-label="Readings, nested typed groups"
        rows={datedReadings}
        columns={columns}
        groupBy={['code', { id: 'secondary', label: 'Secondary', getValue: () => 'same' }]}
        sortDescriptor={{ column: 'code', direction: isDescending ? 'descending' : 'ascending' }}
        renderGroupLabel={labelGroup}
        size="sm"
      />
    </div>
  );
}
