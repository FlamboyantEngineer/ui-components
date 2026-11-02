import { useState } from 'react';
import type { Selection } from '../../src/core/props.js';
import { Button } from '../../src/components/button/button.js';
import { Table } from '../../src/components/table/table.js';
import { LabOutput } from './lab-output.js';

function RepeatSelectionTable({ enabled }: { enabled: boolean }) {
  const [selected, setSelected] = useState<Selection>(new Set(['alpha']));
  const [events, setEvents] = useState(0);
  const [renders, setRenders] = useState(0);
  const [inspections, setInspections] = useState(0);
  const name = enabled ? 'enabled' : 'default';
  return (
    <section data-lab-demo={`repeat-selection-${name}`}>
      <Table
        aria-label={`Repeated selection ${name}`}
        selectionMode="multiple"
        selectionBehavior="replace"
        selectedKeys={selected}
        allowDuplicateSelectionEvents={enabled}
        disabledKeys={['blue']}
        onSelectionChange={(keys) => {
          setSelected(keys);
          setEvents((value) => value + 1);
        }}
        rows={[
          { id: 'alpha', name: 'Alpha' },
          { id: 'blue', name: 'Blue' },
        ]}
        columns={[
          { id: 'name', header: 'Name' },
          {
            id: 'actions',
            header: 'Actions',
            renderCell: () => (
              <Button onPress={() => setInspections((value) => value + 1)}>Inspect</Button>
            ),
          },
        ]}
      />
      <LabOutput name={`repeat-events-${name}`}>{events}</LabOutput>
      <LabOutput name={`repeat-inspections-${name}`}>{inspections}</LabOutput>
      <Button onPress={() => setRenders((value) => value + 1)}>Rerender {name}</Button>
      <LabOutput name={`repeat-renders-${name}`}>{renders}</LabOutput>
    </section>
  );
}

/** Two tables, without and with `allowDuplicateSelectionEvents`, counting selection events. */
export function RepeatedSelection() {
  return (
    <>
      <RepeatSelectionTable enabled={false} />
      <RepeatSelectionTable enabled />
    </>
  );
}
