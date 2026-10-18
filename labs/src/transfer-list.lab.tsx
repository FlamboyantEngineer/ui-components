import { useState } from 'react';
import type { Key } from '../../src/core/props.js';
import {
  TransferList,
  type TransferListItem,
} from '../../src/components/transfer-list/transfer-list.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const columns: TransferListItem[] = [
  { id: 'name', label: 'Name', icon: 'edit' },
  { id: 'owner', label: 'Owner', description: 'Person responsible', icon: 'users' },
  { id: 'status', label: 'Status', icon: 'info' },
  { id: 'due', label: 'Due date', icon: 'calendar' },
  { id: 'created', label: 'Created', icon: 'clock' },
  { id: 'priority', label: 'Priority', icon: 'star' },
  { id: 'tags', label: 'Tags', icon: 'filter' },
  { id: 'size', label: 'Size', description: 'In bytes', icon: 'file' },
];

const cities: TransferListItem[] = [
  'Lisbon',
  'Oslo',
  'Quito',
  'Lima',
  'Malmö',
  'Dakar',
  'Hanoi',
  'Perth',
  'Cairo',
  'Bogotá',
].map((label) => ({ id: label.toLowerCase(), label }));

const states = ['resting', 'chosen', 'reorderable', 'disabled items', 'disabled', 'empty'] as const;

function Output({ name, value }: { name: string; value: string }) {
  return (
    <p>
      {name}: <output data-lab-output={name}>{value}</output>
    </p>
  );
}

function StateSample({ state }: { state: (typeof states)[number] }) {
  return (
    <TransferList
      aria-label={`Cities, ${state}`}
      items={state === 'empty' ? [] : cities.slice(0, 5)}
      defaultValue={state === 'resting' || state === 'empty' ? [] : ['oslo', 'lima']}
      reorderable={state === 'reorderable'}
      disabledKeys={state === 'disabled items' ? ['quito', 'lima'] : undefined}
      isDisabled={state === 'disabled'}
    />
  );
}

function ReportColumns() {
  const [value, setValue] = useState<Key[]>(['name', 'status']);
  return (
    <>
      <TransferList
        aria-label="Report columns"
        items={columns}
        value={value}
        onChange={setValue}
        availableLabel="Hidden columns"
        chosenLabel="Shown columns"
        disabledKeys={['size']}
        reorderable
        data-lab-field="columns"
      />
      <Output name="columns" value={value.join(', ') || 'none'} />
    </>
  );
}

function Itinerary() {
  const [value, setValue] = useState<Key[]>([]);
  return (
    <>
      <TransferList
        aria-label="Itinerary"
        items={cities}
        value={value}
        onChange={setValue}
        data-lab-field="itinerary"
      />
      <Output name="itinerary" value={value.join(', ') || 'none'} />
    </>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="Nothing chosen, some chosen, a reorderable chosen side, disabled items, a disabled list and no items."
    >
      <StateMatrix axes={{ state: states }} render={({ state }) => <StateSample state={state} />} />
    </LabSection>
    <LabSection
      title="Ordered columns"
      description="Choose the columns a report shows and their order: move with the buttons, a double click or Enter, then reorder with Move up and Move down or by dragging. Size cannot be moved."
    >
      <ReportColumns />
    </LabSection>
    <LabSection
      title="Filtering and moving all"
      description="Filter a side, then move every row it shows; select several with Shift and Ctrl or Cmd."
    >
      <Itinerary />
    </LabSection>
  </>,
);
