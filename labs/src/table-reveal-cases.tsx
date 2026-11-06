// A table lab case: revealing and focusing rows and cells by id through the table's handle, in a
// virtualized table and a right-to-left table with pinned columns. Lab-only layout is inline.

import { useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  Table,
  type TableColumn,
  type TableHandle,
  type TableRevealOptions,
} from '../../src/components/table/index.js';
import type { CollectionRevealResult, Key } from '../../src/core/index.js';
import { LabOutput } from './lab-output.js';

interface Stop {
  id: string;
  name: string;
  zone: string;
  note: string;
  stops?: Stop[];
}

const stops: Stop[] = Array.from({ length: 300 }, (_, index) => ({
  id: `stop-${index + 1}`,
  name: `Stop ${index + 1}`,
  zone: `Zone ${(index % 6) + 1}`,
  note: index % 2 ? 'Sheltered' : 'Open platform',
  stops:
    index === 0 ? [{ id: 'stop-1a', name: 'Stop 1A', zone: 'Zone 1', note: 'Annex' }] : undefined,
}));

const columns: TableColumn<Stop>[] = [
  { id: 'name', header: 'Name', width: 160 },
  { id: 'zone', header: 'Zone', width: 120 },
  { id: 'note', header: 'Note', width: 200 },
];

const wideColumns: TableColumn<Stop>[] = [
  { id: 'name', header: 'Name', width: 140, pin: 'start' },
  { id: 'zone', header: 'Zone', width: 260 },
  { id: 'note', header: 'Note', width: 320 },
];

const describe = (result: CollectionRevealResult) =>
  result.found ? 'found' : `not found (${result.reason})`;

/** Buttons that reveal or focus one row through a table's handle, and the last result. */
function RevealControls({
  name,
  actions,
}: {
  name: string;
  actions: { label: string; run: () => Promise<CollectionRevealResult> }[];
}) {
  const [result, setResult] = useState('none');
  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {actions.map((action) => (
          <Button
            key={action.label}
            onPress={() => {
              void action.run().then((next) => setResult(describe(next)));
            }}
          >
            {action.label}
          </Button>
        ))}
      </div>
      <LabOutput name={name}>{result}</LabOutput>
    </>
  );
}

/** The handle's calls, which read the table's handle once pressed. */
function useHandleCalls(handleRef: { current: TableHandle | null }) {
  return (method: 'revealKey' | 'focusKey', key: Key, options?: TableRevealOptions) => () =>
    handleRef.current?.[method](key, options) ??
    Promise.resolve<CollectionRevealResult>({ found: false, reason: 'unmounted' });
}

/**
 * A virtualized table of 300 stops and a right-to-left table with a pinned column: reveal a row
 * far below without moving focus, focus one cell, and see the reasons for a row under a collapsed
 * parent and an id no row has.
 */
export function RevealRows() {
  const handleRef = useRef<TableHandle>(null);
  const wideRef = useRef<TableHandle>(null);
  const call = useHandleCalls(handleRef);
  const callWide = useHandleCalls(wideRef);
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <RevealControls
        name="Reveal result"
        actions={[
          { label: 'Reveal stop 250', run: call('revealKey', 'stop-250') },
          {
            label: 'Focus the note of stop 280',
            run: call('focusKey', 'stop-280', { columnId: 'note' }),
          },
          { label: 'Reveal stop 1A', run: call('revealKey', 'stop-1a') },
          { label: 'Reveal stop 999', run: call('revealKey', 'stop-999') },
        ]}
      />
      <div data-lab="reveal-virtualized" style={{ height: 240 }}>
        <Table
          aria-label="Stops"
          rows={stops}
          columns={columns}
          getChildRows={(stop) => stop.stops}
          virtualized
          rowHeight={32}
          size="sm"
          handleRef={handleRef}
        />
      </div>
      <RevealControls
        name="Right-to-left reveal result"
        actions={[
          {
            label: 'Focus the note of stop 40',
            run: callWide('focusKey', 'stop-40', { columnId: 'note' }),
          },
        ]}
      />
      <div data-lab="reveal-rtl" dir="rtl" style={{ width: 360, height: 200, overflow: 'auto' }}>
        <Table
          aria-label="Stops, right to left"
          rows={stops.slice(0, 60)}
          columns={wideColumns}
          size="sm"
          handleRef={wideRef}
        />
      </div>
    </div>
  );
}
