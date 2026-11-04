import { type DragEvent, useRef, useState } from 'react';
import {
  armHandleDrag,
  DragHandle,
  keepHandleCellDraggable,
} from '../../src/components/drag-handle/index.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { LabSection } from './chrome/index.js';

const fruit = ['Apple', 'Banana', 'Cherry', 'Fig'];

type DragMode = 'handle' | 'row';

/**
 * A host grid with its own native drag and drop: `handle` rows render without `draggable` and arm
 * from the handle with armHandleDrag; `row` rows are always draggable and keepHandleCellDraggable
 * keeps a press in the handle's cell from focusing it.
 */
function HostGrid({ mode }: { mode: DragMode }) {
  const [rows, setRows] = useState(fruit);
  const [log, setLog] = useState<string[]>([]);
  const dragged = useRef<string | null>(null);
  const add = (entry: string) => setLog((entries) => [...entries, entry]);
  const onDrop = (event: DragEvent, target: string) => {
    event.preventDefault();
    const source = dragged.current;
    if (!source || source === target) return;
    setRows((current) => {
      const rest = current.filter((row) => row !== source);
      const index = rest.indexOf(target) + 1;
      return [...rest.slice(0, index), source, ...rest.slice(index)];
    });
    add(`moved ${source} after ${target}`);
  };
  return (
    <div data-lab-host={mode}>
      <div
        role="grid"
        aria-label={mode === 'handle' ? 'Fruit, dragged by handle' : 'Fruit, dragged by row'}
        onPointerDownCapture={mode === 'handle' ? armHandleDrag : keepHandleCellDraggable}
        style={{ display: 'grid', gap: 2, width: 240 }}
      >
        {rows.map((row) => (
          <div
            key={row}
            role="row"
            aria-label={row}
            draggable={mode === 'row' ? true : undefined}
            onDragStart={(event) => {
              dragged.current = row;
              event.dataTransfer.effectAllowed = 'move';
              event.dataTransfer.setData('text/plain', row);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => onDrop(event, row)}
            onDragEnd={(event) => {
              if (event.dataTransfer.dropEffect === 'none') add(`cancelled ${row}`);
              dragged.current = null;
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 4 }}
          >
            <div role="gridcell" tabIndex={-1} data-lab-handle-cell={row}>
              {/* As in a React Aria collection, the handle stays out of pointer hit testing. */}
              <span style={{ pointerEvents: 'none' }}>
                <DragHandle aria-label={`Drag ${row}`} />
              </span>
            </div>
            <div role="gridcell">{row}</div>
          </div>
        ))}
      </div>
      <p data-lab-output="order">Order: {rows.join(', ')}</p>
      <ol aria-label={`${mode === 'handle' ? 'Handle' : 'Row'} drag log`} data-lab-output="log">
        {log.map((entry, index) => (
          <li key={index}>{entry}</li>
        ))}
      </ol>
    </div>
  );
}

export function DragHandleHostCases() {
  return (
    <div data-lab-family="drag-handle-host-cases">
      <LabSection
        title="In the tab order"
        description="With excludeFromTabOrder={false} the handle is a tab stop of its own, for a host without arrow-key navigation: Tab from Before to reach it, and Tab again to reach After."
      >
        <div data-lab-demo="tab-order" style={{ display: 'flex', gap: 8, alignItems: 'end' }}>
          <TextField label="Before" />
          <DragHandle aria-label="Drag Notes.txt" excludeFromTabOrder={false} />
          <TextField label="After" />
        </div>
      </LabSection>
      <LabSection
        title="Host drag by the handle"
        description="A grid of the page's own with native drag and drop. As a React Aria collection does, it keeps each handle out of pointer hit testing, so a press on it lands in its cell. Its rows render without draggable; armHandleDrag on the grid's pointer press arms a row only from its handle. Drag a handle onto another row to move it after that row, or drop it outside the grid to cancel; dragging a row's text does nothing. The log lists each move and cancellation."
      >
        <HostGrid mode="handle" />
      </LabSection>
      <LabSection
        title="Host drag by the whole row"
        description="Rows that are always draggable. keepHandleCellDraggable on the grid's pointer press keeps a press in the handle's cell from focusing the cell, so a drag can start there. Drag any row onto another, or drop it outside the grid to cancel."
      >
        <HostGrid mode="row" />
      </LabSection>
    </div>
  );
}
