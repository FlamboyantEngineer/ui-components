import { useState } from 'react';
import { DragHandle } from '../../src/components/drag-handle/drag-handle.js';
import {
  ListView,
  ListViewItem,
  type ListViewMove,
} from '../../src/components/list-row/list-view.js';
import { Table } from '../../src/components/table/table.js';
import { applyTableMove, type TableColumn } from '../../src/components/table/table-rows.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

interface Fruit {
  id: string;
}

const FRUIT: Fruit[] = ['Apple', 'Banana', 'Cherry', 'Fig'].map((id) => ({ id }));
const columns: TableColumn<Fruit>[] = [{ id: 'id', header: 'Fruit' }];

/** The rows with the moved ones taken out and put back beside the target row. */
function moveBeside(rows: readonly Fruit[], { keys, targetKey, position }: ListViewMove) {
  const moving = rows.filter((row) => keys.includes(row.id));
  const rest = rows.filter((row) => !keys.includes(row.id));
  const index = rest.findIndex((row) => row.id === targetKey) + (position === 'after' ? 1 : 0);
  return [...rest.slice(0, index), ...moving, ...rest.slice(index)];
}

function Order({ rows }: { rows: readonly Fruit[] }) {
  return <p data-lab-output>Order: {rows.map((row) => row.id).join(', ')}</p>;
}

/** A list view that reorders: each row draws a handle the list names after it. */
function FruitList() {
  const [rows, setRows] = useState(FRUIT);
  return (
    <div data-lab-list="row">
      <ListView
        aria-label="Fruit"
        items={rows}
        disabledKeys={['Fig']}
        reorder={{ onMove: (move) => setRows((current) => moveBeside(current, move)) }}
      >
        {(row) => <ListViewItem id={row.id} title={row.id} />}
      </ListView>
      <Order rows={rows} />
    </div>
  );
}

/** A table whose rows drag by their handles only, so a press on a row's text never drags it. */
function FruitTable() {
  const [rows, setRows] = useState(FRUIT);
  return (
    <div data-lab-list="handle">
      <Table
        aria-label="Fruit, dragged by handle"
        rows={rows}
        columns={columns}
        reorder={{
          dragTrigger: 'handle',
          onMove: (move) => setRows((current) => applyTableMove(current, move)),
        }}
      />
      <Order rows={rows} />
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="A handle on its own, named here by an aria-label, enabled and disabled."
    >
      <StateMatrix
        axes={{ state: ['enabled', 'disabled'] }}
        render={({ state }) => (
          <DragHandle aria-label="Drag Report.pdf" isDisabled={state === 'disabled'} />
        )}
      />
    </LabSection>
    <LabSection
      title="In a reorderable list"
      description="Each row draws a handle the list names after it. Focus a row, press ArrowRight to reach its handle and Enter to drag it with the arrow keys. Fig is disabled, so its handle is too."
    >
      <FruitList />
    </LabSection>
    <LabSection
      title="Dragging by the handle only"
      description="The table renders its rows without draggable and arms a row from its handle, so a press on the row's text never drags it."
    >
      <FruitTable />
    </LabSection>
  </>,
);
