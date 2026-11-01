import { useState } from 'react';
import {
  RelationMatrix,
  toggleRelation,
  type RelationMatrixCell,
  type RelationMatrixItem,
  type RelationMatrixKind,
  type RelationMatrixRelation,
} from '../../src/components/relation-matrix/index.js';
import { Button } from '../../src/components/button/button.js';
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

function TypedRelations() {
  const [relations, setRelations] = useState<RelationMatrixRelation[]>([{ row: 1, column: '1' }]);
  return (
    <RelationMatrix
      aria-label="Distinct relation keys"
      rows={[
        { id: 1, label: 'Numeric row' },
        { id: '1', label: 'Text row' },
      ]}
      columns={[
        { id: 1, label: 'Numeric column' },
        { id: '1', label: 'Text column' },
      ]}
      relations={relations}
      columnLabels="truncated"
      onCellAction={(cell) => setRelations((current) => toggleRelation(current, cell))}
    />
  );
}

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

/** The requirements with the fewest relations first, keeping the listed order between equals. */
function sortByCoverage(relations: readonly RelationMatrixRelation[]): RelationMatrixItem[] {
  const count = (row: RelationMatrixItem) =>
    relations.filter((relation) => relation.row === row.id).length;
  return [...requirements].sort((a, b) => count(a) - count(b));
}

/** Rows that reorder as relations change, while focus stays on the cell the reader acted on. */
function CoverageSortedMatrix() {
  const [relations, setRelations] = useState(traces);
  const [output, setOutput] = useState('No change yet');
  return (
    <div data-lab-demo="sorted">
      <RelationMatrix
        aria-label="Least covered requirements first"
        rows={sortByCoverage(relations)}
        columns={tests}
        relations={relations}
        kinds={kinds}
        rowsLabel="Requirements"
        onCellAction={(cell) => {
          setOutput(describeAction(cell, 'verifies'));
          setRelations((current) => toggleRelation(current, { ...cell, kind: 'verifies' }));
        }}
      />
      <output data-lab-output>{output}</output>
    </div>
  );
}

/** A matrix mounted before its data loads: its first cell keeps its row as the rows reorder. */
function ArrivingMatrix() {
  const [isMounted, setMounted] = useState(false);
  const [rows, setRows] = useState<RelationMatrixItem[]>([]);
  const [output, setOutput] = useState('No action yet');
  const load = () => {
    setMounted(true);
    setRows([]);
    setTimeout(() => setRows(requirements.slice(0, 3)), 300);
  };
  return (
    <div data-lab-demo="arriving">
      <button type="button" onClick={load}>
        Mount, then load the data
      </button>{' '}
      <button type="button" onClick={() => setRows((current) => [...current].reverse())}>
        Reverse the rows
      </button>
      {isMounted ? (
        <RelationMatrix
          aria-label="Matrix that loads later"
          rows={rows}
          columns={rows.length > 0 ? tests.slice(0, 3) : []}
          relations={traces}
          kinds={kinds}
          onCellAction={(cell) => setOutput(describeAction(cell, 'verifies'))}
        />
      ) : null}
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

function SwitchedMatrix() {
  const [virtualized, setVirtualized] = useState(false);
  const rows = manyRows.slice(0, 100);
  const columns = manyColumns.slice(0, 100);
  const columnIds = new Set(columns.map((column) => column.id));
  return (
    <div data-lab-demo="switched">
      <p>
        <Button size="sm" variant="secondary" onPress={() => setVirtualized((on) => !on)}>
          {virtualized ? 'Render every row and column' : 'Window rows and columns'}
        </Button>
      </p>
      <RelationMatrix
        aria-label="Switched matrix"
        rows={rows}
        columns={columns}
        relations={manyRelations.filter(
          (relation) =>
            columnIds.has(String(relation.column)) && rows.some((row) => row.id === relation.row),
        )}
        kinds={kinds}
        columnLabels="truncated"
        columnWidth={72}
        virtualized={virtualized}
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
      title="Right to left"
      description="In a right-to-left page the uncovered marks run down the start edge of Requirement 4 and Test 4, on the right."
    >
      <div dir="rtl" data-lab-demo="rtl">
        <RelationMatrix
          aria-label="Coverage, right to left"
          rows={small.rows}
          columns={small.columns}
          relations={small.relations}
          kinds={kinds}
        />
      </div>
    </LabSection>
    <LabSection
      title="Traceability"
      description="Press a cell, or move to it with the arrow keys and press Enter or Space, to add a relation of the chosen kind or remove one. Home, End, PageUp and PageDown move further; Control+Home and Control+End reach the corners. Tab leaves the grid from the focused cell; typing does not jump to a row, and nothing is selected."
    >
      <TraceabilityMatrix />
    </LabSection>
    <LabSection
      title="Rows sorted by coverage"
      description="Requirements with the fewest relations come first, so adding or removing a relation can move its row. Focus and Enter stay with the cell you acted on as its row moves."
    >
      <CoverageSortedMatrix />
    </LabSection>
    <LabSection
      title="Data that arrives"
      description="The matrix mounts with no rows or columns and its data loads a moment later. Reverse the rows, then Tab into the grid and press Enter: the first cell still belongs to Requirement 1."
    >
      <ArrivingMatrix />
    </LabSection>
    <LabSection
      title="Large matrix"
      description="Two thousand requirements against four hundred tests, windowed on both axes: only the rows and columns in view render. Every ninth requirement is uncovered."
    >
      <LargeMatrix />
    </LabSection>
    <LabSection
      title="Turning windowing on"
      description="A hundred requirements against a hundred tests. Scroll anywhere, then window the rows and columns: the cells in view stay drawn, from the same scroll position, and focus keeps its cell."
    >
      <SwitchedMatrix />
    </LabSection>
    <LabSection
      title="Distinct relation keys"
      description="Numeric and text keys identify separate rows and columns. Press a cell to toggle only its own relation."
    >
      <TypedRelations />
    </LabSection>
  </>,
);
