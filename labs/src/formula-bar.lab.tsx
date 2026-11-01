import { useState } from 'react';
import { FormulaBar } from '../../src/components/formula-bar/formula-bar.js';
import { Table } from '../../src/components/table/table.js';
import { Button } from '../../src/components/button/button.js';
import type { TableCellRange } from '../../src/components/table/index.js';
import type { TableColumn } from '../../src/components/table/index.js';
import { formatCellReference, type CellCoordinates } from '../../src/utils/cell-reference.js';
import { requireDefined } from './require-defined.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import {
  evaluateCell,
  formulaFunctions,
  tokenizeFormula,
  type SheetCells,
} from './formula-bar-sheet.js';

type Letter = 'A' | 'B' | 'C' | 'D';

interface SheetRow {
  id: string;
  cells: Readonly<Record<Letter, string>>;
}

const letters: readonly Letter[] = ['A', 'B', 'C', 'D'];

const startRows: SheetRow[] = [
  ['Item', 'Quantity', 'Price', 'Total'],
  ['Apples', '4', '0.5', '=B2*C2'],
  ['Pears', '6', '0.75', '=B3*C3'],
  ['Plums', '12', '0.2', '=B4*C4'],
  ['Figs', '3', '1.5', '=B5*C5'],
  ['Sum', '=SUM(B2:B5)', '', '=SUM(D2:D5)'],
].map((values, index) => ({
  id: `row-${index + 1}`,
  cells: {
    A: requireDefined(values[0]),
    B: requireDefined(values[1]),
    C: requireDefined(values[2]),
    D: requireDefined(values[3]),
  },
}));

/** Every row's contents by A1 reference, as the evaluator reads them. */
function collectCells(rows: readonly SheetRow[]): SheetCells {
  return Object.fromEntries(
    rows.flatMap((row, index) =>
      letters.map((letter) => [`${letter}${index + 1}`, row.cells[letter]]),
    ),
  );
}

function evaluateAt(content: string, cells: SheetCells, cell: CellCoordinates): string {
  return evaluateCell(content, cells, new Set([formatCellReference(cell)]));
}

/** A grid in spreadsheet mode with the bar above it, both showing the same active cell. */
function Spreadsheet() {
  const [rows, setRows] = useState(startRows);
  const [range, setRange] = useState<TableCellRange | null>({
    anchor: { rowKey: 'row-2', columnId: 'D' },
    focus: { rowKey: 'row-2', columnId: 'D' },
  });
  const [last, setLast] = useState('none');
  const [isLocked, setLocked] = useState(false);
  const cells = collectCells(rows);
  const focus = range?.focus;
  const row = focus ? rows.findIndex((entry) => entry.id === focus.rowKey) : -1;
  const column = focus ? letters.indexOf(focus.columnId as Letter) : -1;
  const cell = row >= 0 && column >= 0 ? { row, column } : null;
  const write = (at: CellCoordinates, value: string) => {
    setRows((current) =>
      current.map((entry, index) =>
        index === at.row
          ? { ...entry, cells: { ...entry.cells, [requireDefined(letters[at.column])]: value } }
          : entry,
      ),
    );
    setLast(`${formatCellReference(at)} = ${value}`);
  };
  const columns: TableColumn<SheetRow>[] = letters.map((letter, index) => ({
    id: letter,
    header: letter,
    align: index === 0 ? 'start' : 'end',
    allowsEditing: true,
    getValue: (entry) => entry.cells[letter],
    renderCell: (entry) =>
      evaluateAt(entry.cells[letter], cells, { row: rows.indexOf(entry), column: index }),
  }));
  return (
    <div data-lab-demo="spreadsheet">
      <FormulaBar
        cell={cell}
        value={
          cell ? requireDefined(rows[cell.row]).cells[requireDefined(letters[cell.column])] : ''
        }
        rowCount={rows.length}
        columnCount={letters.length}
        tokenize={tokenizeFormula}
        completions={formulaFunctions}
        evaluate={(content, at) => evaluateAt(content, cells, at)}
        onCommit={(value, at) => write(at, value)}
        isDisabled={isLocked}
        onCellChange={(at) => {
          const position = {
            rowKey: requireDefined(rows[at.row]).id,
            columnId: requireDefined(letters[at.column]),
          };
          setRange({ anchor: position, focus: position });
        }}
      />
      <Table
        aria-label="Fruit order"
        rows={rows}
        columns={columns}
        cellSelection="cell"
        selectedRange={range}
        onSelectedRangeChange={setRange}
        onCellEdit={(edit) =>
          write(
            { row: rows.indexOf(edit.row), column: letters.indexOf(edit.columnId as Letter) },
            String(edit.value ?? ''),
          )
        }
        size="sm"
      />
      <label>
        <input
          type="checkbox"
          checked={isLocked}
          onChange={(event) => setLocked(event.target.checked)}
        />{' '}
        Lock the bar
      </label>{' '}
      <output data-lab-output>{`Last commit: ${last}`}</output>
    </div>
  );
}

/** A bar inside a form: Enter in either box never submits it (UIC-FORMULA-BAR-2.2). */
function FormBar() {
  const [cell, setCell] = useState<CellCoordinates>({ row: 0, column: 0 });
  const [submits, setSubmits] = useState(0);
  return (
    <form
      data-lab-demo="form"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmits((count) => count + 1);
      }}
    >
      <FormulaBar
        aria-label="Order form formula bar"
        cell={cell}
        value=""
        rowCount={5}
        columnCount={4}
        tokenize={tokenizeFormula}
        onCellChange={setCell}
      />
      <Button type="submit" size="sm">
        Submit the form
      </Button>{' '}
      <output data-lab-output>{`Submitted ${submits} times`}</output>
    </form>
  );
}

const states = {
  formula: { cell: { row: 1, column: 3 }, value: '=B2*C2' },
  text: { cell: { row: 0, column: 0 }, value: 'Item' },
  empty: { cell: { row: 4, column: 2 }, value: '' },
  'no cell': { cell: null, value: '' },
} as const;
const stateNames = Object.keys(states) as Array<keyof typeof states>;

const sampleCells: SheetCells = { B2: '4', C2: '0.5' };

mountLab(
  <>
    <LabSection
      title="States"
      description="A formula, plain text, an empty cell and no active cell, editable, with the caller's evaluation, read-only and disabled. The formula's references, operators and functions take the caller's token types."
    >
      <StateMatrix
        axes={{ content: stateNames, mode: ['editable', 'evaluated', 'read-only', 'disabled'] }}
        render={({ content, mode }) => (
          <FormulaBar
            aria-label={`${content} formula bar, ${mode}`}
            cell={states[content].cell}
            value={states[content].value}
            tokenize={tokenizeFormula}
            placeholder="Value or formula"
            evaluate={
              mode === 'evaluated' ? (value, at) => evaluateAt(value, sampleCells, at) : undefined
            }
            isReadOnly={mode === 'read-only'}
            isDisabled={mode === 'disabled'}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Spreadsheet"
      description="Wired to a table in spreadsheet mode: the bar follows the selected cell, typing a reference such as C4 and Enter selects that cell, and Enter in the content commits it. The table shows evaluated values and edits raw contents; Escape restores the content and SUM, AVERAGE, MIN and MAX complete as you type. Selecting another cell discards an uncommitted draft: coming back shows the cell's content. Lock the bar with a draft open: Cancel and Confirm turn off, and the draft waits, uncommitted, until you unlock it."
    >
      <Spreadsheet />
    </LabSection>
    <LabSection
      title="Inside a form"
      description="Enter in the reference box always stays with the bar, whether the reference is unchanged, moves to a cell or is refused, so the form around it is submitted only by its own button. An Enter that confirms an input method composition goes to the input method."
    >
      <FormBar />
    </LabSection>
  </>,
);
