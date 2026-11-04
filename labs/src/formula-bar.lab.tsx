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
        functions={formulaFunctions}
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

/**
 * Cancel and Confirm at work on one cell: the saved value, the pending edit and how many commits
 * and cancels arrived, with the buttons shown or replaced by Enter and Escape.
 */
function CancelConfirm() {
  const cell = { row: 1, column: 2 };
  const [saved, setSaved] = useState('0.5');
  const [draft, setDraft] = useState<string | null>(null);
  const [counts, setCounts] = useState({ commits: 0, cancels: 0 });
  const [showActions, setShowActions] = useState(true);
  return (
    <div data-lab-demo="actions">
      <FormulaBar
        aria-label="Price formula bar"
        cell={cell}
        value={saved}
        tokenize={tokenizeFormula}
        functions={formulaFunctions}
        showActions={showActions}
        onDraftChange={(next) => setDraft(next === saved ? null : next)}
        onCommit={(next) => {
          setSaved(next);
          setDraft(null);
          setCounts((current) => ({ ...current, commits: current.commits + 1 }));
        }}
        onCancel={() => {
          setDraft(null);
          setCounts((current) => ({ ...current, cancels: current.cancels + 1 }));
        }}
      />
      <label>
        <input
          type="checkbox"
          checked={showActions}
          onChange={(event) => setShowActions(event.target.checked)}
        />{' '}
        Show Cancel and Confirm
      </label>
      <dl>
        <dt>Saved value</dt>
        <dd data-lab-output="saved">{saved}</dd>
        <dt>Pending edit</dt>
        <dd data-lab-output="draft">{draft ?? 'none'}</dd>
        <dt>Commits and cancels</dt>
        <dd data-lab-output="counts">{`${counts.commits} committed, ${counts.cancels} cancelled`}</dd>
      </dl>
    </div>
  );
}

const sizes = ['xs', 'sm', 'md', 'lg'] as const;

/** One working bar of a size: edits commit into its own saved value and show in its output. */
function SizedBar({
  size,
  showActions,
  width,
}: {
  size: (typeof sizes)[number];
  showActions: boolean;
  width: 360 | 280;
}) {
  const [saved, setSaved] = useState('=B2*C2');
  return (
    <div style={{ width }}>
      <FormulaBar
        aria-label={`Formula bar, ${size}, ${showActions ? 'buttons' : 'keys only'}, ${width}px`}
        size={size}
        cell={{ row: 1, column: 3 }}
        value={saved}
        tokenize={tokenizeFormula}
        completions={formulaFunctions}
        functions={formulaFunctions}
        evaluate={(value, at) => evaluateAt(value, sampleCells, at)}
        showActions={showActions}
        onCommit={setSaved}
        data-lab-size={size}
      />
      <output data-lab-output={`size-${size}`}>{`Saved ${saved}`}</output>
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
      description="A formula, plain text, an empty cell and no active cell, editable, with the caller's evaluation, read-only and disabled, each bar 256px wide. The reference, Cancel, Confirm and fₓ keep their places and the content takes the rest; a result appears only when the evaluation has one, so an empty cell's content keeps the full width. The formula's references, operators and functions take the caller's token types."
    >
      <StateMatrix
        axes={{ content: stateNames, mode: ['editable', 'evaluated', 'read-only', 'disabled'] }}
        render={({ content, mode }) => (
          // Every cell is as wide, so the bars line up and differ only in their state.
          <div style={{ width: 256 }}>
            <FormulaBar
              aria-label={`${content} formula bar, ${mode}`}
              cell={states[content].cell}
              value={states[content].value}
              tokenize={tokenizeFormula}
              functions={formulaFunctions}
              placeholder="Value or formula"
              evaluate={
                mode === 'evaluated' ? (value, at) => evaluateAt(value, sampleCells, at) : undefined
              }
              isReadOnly={mode === 'read-only'}
              isDisabled={mode === 'disabled'}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Sizes"
      description="size xs, sm, md (the default) and lg: the reference box, the content, fₓ, Cancel and Confirm and the result follow the bar's size, with the buttons a step smaller than the boxes. Each bar works: edit the formula, pick a function from fₓ, then Confirm or press Enter to save it. Shown with and without the buttons, 360px wide and in a narrower 280px column."
    >
      <StateMatrix
        axes={{ size: sizes, layout: ['buttons', 'keys only', 'buttons, 280px'] }}
        render={({ size, layout }) => (
          <SizedBar
            size={size}
            showActions={layout !== 'keys only'}
            width={layout === 'buttons, 280px' ? 280 : 360}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Cancel and confirm"
      description="Edit C2's price: Confirm (✓) and Cancel (×) turn on with a pending edit and off without one. Confirm saves the edit, Cancel restores the saved value, and each counts once. Uncheck Show Cancel and Confirm to do the same with Enter and Escape. The fₓ button only inserts a function into the edit; it commits and cancels nothing."
    >
      <CancelConfirm />
    </LabSection>
    <LabSection
      title="Without buttons"
      description="showActions={false} drops Cancel and Confirm and their room: Enter commits and Escape cancels, and the content's description names those keys. Shown beside the default bar, in a 320px column with a long formula."
    >
      <StateMatrix
        axes={{ width: ['320px', 'full'], actions: ['buttons', 'keys only'] }}
        render={({ width, actions }) => (
          <div style={{ width: width === 'full' ? undefined : 320 }}>
            <FormulaBar
              aria-label={`Formula bar, ${actions}, ${width}`}
              cell={{ row: 1, column: 3 }}
              value="=SUM(B2:B40)*C2+AVERAGE(B2:B40)-MIN(B2:B40)+MAX(B2:B40)"
              tokenize={tokenizeFormula}
              evaluate={(value, at) => evaluateAt(value, sampleCells, at)}
              showActions={actions === 'buttons'}
              data-lab-actions={actions}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Spreadsheet"
      description="Wired to a table in spreadsheet mode: the bar follows the selected cell, typing a reference such as C4 and Enter selects that cell, and Enter in the content commits it. The table shows evaluated values and edits raw contents; Escape restores the content and SUM, AVERAGE, MIN and MAX complete as you type. The fₓ button lists the same functions: choosing one puts it, with brackets, at the caret (around any selected text) and returns you to the content, uncommitted, so Enter or Confirm still decides. Selecting another cell discards an uncommitted draft: coming back shows the cell's content. Lock the bar with a draft open: Cancel and Confirm turn off, and the draft waits, uncommitted, until you unlock it."
    >
      <Spreadsheet />
    </LabSection>
    <LabSection
      title="Composed controls"
      description="An external editor keeps its native reference and content controls and commands."
    >
      <FormulaBar
        cell={null}
        value=""
        controls={{
          reference: <input aria-label="Custom reference" defaultValue="B2:C3" />,
          editor: <input aria-label="Custom content" defaultValue="=SUM(B2:C3)" />,
        }}
      />
    </LabSection>
    <LabSection
      title="Inside a form"
      description="Enter in the reference box always stays with the bar, whether the reference is unchanged, moves to a cell or is refused, so the form around it is submitted only by its own button. An Enter that confirms an input method composition goes to the input method."
    >
      <FormBar />
    </LabSection>
  </>,
);
