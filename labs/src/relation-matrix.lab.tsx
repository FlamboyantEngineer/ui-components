import { useState } from 'react';
import {
  RelationMatrix,
  toggleRelation,
  type RelationMatrixCell,
  type RelationMatrixItem,
  type RelationMatrixKind,
  type RelationMatrixRelation,
} from '../../src/components/relation-matrix/index.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/index.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const requirements: RelationMatrixItem[] = [
  { id: 'req-1', label: 'Requirement 1: Sign in with a passkey' },
  { id: 'req-2', label: 'Requirement 2: Reset a forgotten password' },
  { id: 'req-3', label: 'Requirement 3: Lock the account after five failures' },
  { id: 'req-4', label: 'Requirement 4: Show the last sign-in time' },
  { id: 'req-5', label: 'Requirement 5: Export the audit trail' },
];

const tests: RelationMatrixItem[] = [
  { id: 'test-1', label: 'Test 1: Passkey happy path' },
  { id: 'test-2', label: 'Test 2: Expired reset link' },
  { id: 'test-3', label: 'Test 3: Five wrong passwords' },
  { id: 'test-4', label: 'Test 4: Sign-in banner' },
  { id: 'test-5', label: 'Test 5: Load test of the sign-in page' },
];

const kinds: RelationMatrixKind[] = [
  { id: 'verifies', label: 'Verifies', tone: 'success' },
  { id: 'partial', label: 'Partly verifies', tone: 'warning' },
  { id: 'blocked', label: 'Blocked', tone: 'danger' },
];

const traces: RelationMatrixRelation[] = [
  { row: 'req-1', column: 'test-1', kind: 'verifies' },
  { row: 'req-1', column: 'test-5', kind: 'partial' },
  { row: 'req-2', column: 'test-2', kind: 'verifies' },
  { row: 'req-3', column: 'test-3', kind: 'blocked' },
  { row: 'req-4', column: 'test-4', kind: 'verifies' },
];

const small = {
  rows: requirements.slice(0, 4),
  columns: tests.slice(0, 4),
  relations: traces.filter((relation) => relation.row !== 'req-4' && relation.column !== 'test-4'),
};

const kindOptions = kinds.map((kind) => ({ value: kind.id, label: kind.label }));

function describeAction(cell: RelationMatrixCell, kind: string): string {
  const row = requirements.find((item) => item.id === cell.row)?.label.split(':')[0];
  const column = tests.find((item) => item.id === cell.column)?.label.split(':')[0];
  return cell.relation ? `Removed ${row} × ${column}` : `Added ${row} × ${column} (${kind})`;
}

function TraceabilityMatrix() {
  const [relations, setRelations] = useState(traces);
  const [kind, setKind] = useState('verifies');
  const [output, setOutput] = useState('No change yet');
  return (
    <div data-lab-demo="traceability">
      <SegmentedChoice
        aria-label="Kind of new relations"
        options={kindOptions}
        value={kind}
        onChange={(value) => setKind(value ?? 'verifies')}
      />
      <RelationMatrix
        aria-label="Requirements by test"
        rows={requirements}
        columns={tests}
        relations={relations}
        kinds={kinds}
        rowsLabel="Requirements"
        onCellAction={(cell) => {
          setOutput(describeAction(cell, kind));
          setRelations(toggleRelation(relations, { ...cell, kind }));
        }}
      />
      <output data-lab-output>{output}</output>
    </div>
  );
}

const rowCount = 2000;
const columnCount = 400;
const manyRows: RelationMatrixItem[] = Array.from({ length: rowCount }, (_, index) => ({
  id: `row-${index + 1}`,
  label: `Requirement ${index + 1}`,
}));
const manyColumns: RelationMatrixItem[] = Array.from({ length: columnCount }, (_, index) => ({
  id: `column-${index + 1}`,
  label: `Test ${index + 1}`,
}));
const manyRelations: RelationMatrixRelation[] = manyRows.flatMap((row, rowIndex) =>
  rowIndex % 9 === 4
    ? []
    : [0, 1].map((step) => ({
        row: row.id,
        column: `column-${((rowIndex * 7 + step * 13) % columnCount) + 1}`,
        kind: step === 0 ? 'verifies' : 'partial',
      })),
);

function LargeMatrix() {
  return (
    <div data-lab-demo="large">
      <RelationMatrix
        aria-label="Large matrix"
        rows={manyRows}
        columns={manyColumns}
        relations={manyRelations}
        kinds={kinds}
        columnLabels="truncated"
        columnWidth={72}
        virtualized
      />
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="Rotated and cut column labels, with and without cell actions. Requirement 4 and Test 4 have no relation: their headers count none and are marked uncovered."
    >
      <StateMatrix
        axes={{ cells: ['read only', 'actionable'], labels: ['rotated', 'truncated'] }}
        render={({ cells, labels }) => (
          <RelationMatrix
            aria-label={`Coverage, ${labels}, ${cells}`}
            rows={small.rows}
            columns={small.columns}
            relations={small.relations}
            kinds={kinds}
            columnLabels={labels}
            onCellAction={cells === 'actionable' ? () => {} : undefined}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Traceability"
      description="Press a cell, or move to it with the arrow keys and press Enter or Space, to add a relation of the chosen kind or remove one. Home, End, PageUp and PageDown move further; Control+Home and Control+End reach the corners."
    >
      <TraceabilityMatrix />
    </LabSection>
    <LabSection
      title="Large matrix"
      description="Two thousand requirements against four hundred tests, windowed on both axes: only the rows and columns in view render. Every ninth requirement is uncovered."
    >
      <LargeMatrix />
    </LabSection>
  </>,
);
