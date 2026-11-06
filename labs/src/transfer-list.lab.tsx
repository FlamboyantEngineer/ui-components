import { useState } from 'react';
import {
  TransferList,
  type TransferListItem,
} from '../../src/components/transfer-list/transfer-list.js';
import {
  CalendarGlyph,
  ClockGlyph,
  EditGlyph,
  FileGlyph,
  FilterGlyph,
  InfoGlyph,
  StarGlyph,
  UsersGlyph,
} from '../../src/core/glyphs.js';
import type { Key } from '../../src/core/props.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';

const columns: TransferListItem[] = [
  { id: 'name', label: 'Name', icon: EditGlyph },
  { id: 'owner', label: 'Owner', description: 'Person responsible', icon: UsersGlyph },
  { id: 'status', label: 'Status', icon: InfoGlyph },
  { id: 'due', label: 'Due date', icon: CalendarGlyph },
  { id: 'created', label: 'Created', icon: ClockGlyph },
  { id: 'priority', label: 'Priority', icon: StarGlyph },
  { id: 'tags', label: 'Tags', icon: FilterGlyph },
  { id: 'size', label: 'Size', description: 'In bytes', icon: FileGlyph },
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

const manyItems: TransferListItem[] = Array.from({ length: 5000 }, (_, index) => ({
  id: index + 1,
  label: `Record ${String(index + 1).padStart(4, '0')}`,
}));

function ManyRecords() {
  const [value, setValue] = useState<Key[]>([]);
  return (
    <>
      <TransferList
        aria-label="Records"
        items={manyItems}
        value={value}
        onChange={setValue}
        virtualized
        rowHeight={40}
        reorderable
        data-lab-field="records"
      />
      <Output name="records" value={`${value.length} chosen`} />
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
      description="Every word must match, ignoring case and accents; spaces, slashes, underscores and dashes separate words. Move every shown row, or select several with Shift and Ctrl or Cmd."
    >
      <Itinerary />
    </LabSection>
    <LabSection
      title="Virtualized sides"
      description="5,000 records: each side renders only the rows in view and scrolls on its own, while filtering, Ctrl+A and Move all reach every shown record."
    >
      <ManyRecords />
    </LabSection>
  </>,
);
