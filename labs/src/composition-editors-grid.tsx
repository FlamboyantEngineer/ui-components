import { useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { CodeEditor } from '../../src/components/code-editor/code-editor.js';
import { Cluster, Stack } from '../../src/components/layout/layout.js';
import {
  StateMachineGraph,
  StateMachineSequence,
} from '../../src/components/state-machine-view/index.js';
import { formatTableCsv, Table, type TableColumn } from '../../src/components/table/index.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { isComposingKey } from '../../src/utils/is-composing-key.js';

/** Raw source and the active address belong to host state; library fields supply the controls. */
export function FormulaBarComposition() {
  const [address, setAddress] = useState('A1');
  const [source, setSource] = useState('=SUM(A2:A4)');
  const [committed, setCommitted] = useState(source);
  const editor = useRef<HTMLTextAreaElement | null>(null);
  const insertFunction = () => {
    const start = editor.current?.selectionStart ?? source.length;
    const end = editor.current?.selectionEnd ?? start;
    setSource(`${source.slice(0, start)}SUM(${source.slice(start, end)})${source.slice(end)}`);
    requestAnimationFrame(() => {
      editor.current?.focus();
      editor.current?.setSelectionRange(start + 4, end + 4);
    });
  };
  return (
    <Stack space="md">
      <Cluster space="sm" wrap="wrap" align="end">
        <TextField label="Cell reference" value={address} onChange={setAddress} />
        <CodeEditor
          label="Raw cell content"
          value={source}
          onChange={setSource}
          multiline={false}
          onFocus={(event) => {
            editor.current = event.currentTarget;
          }}
          onKeyDown={(event) => {
            if (isComposingKey(event.nativeEvent)) return;
            if (event.key === 'Enter') {
              event.preventDefault();
              setCommitted(source);
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              setSource(committed);
            }
          }}
          completions={[
            { label: 'SUM', insertText: 'SUM()', description: 'Add a range', kind: 'function' },
          ]}
        />
        <Button onPress={insertFunction}>Insert SUM</Button>
        <Button onPress={() => setCommitted(source)}>Apply</Button>
        <Button onPress={() => setSource(committed)}>Cancel</Button>
      </Cluster>
      <output aria-live="polite">
        {address}: {committed}
      </output>
    </Stack>
  );
}

const initialRows = [
  { id: 'a', name: 'Maple', group: 'Trees' },
  { id: 'b', name: 'Mint', group: 'Herbs' },
];
const columns: TableColumn<(typeof initialRows)[number]>[] = [
  { id: 'name', header: 'Name', allowsEditing: true, allowsSorting: true },
  { id: 'group', header: 'Group', allowsEditing: true },
];

/** The host defines selection scope, bulk operation and the export destination. */
export function TableWorkflowComposition() {
  const [rows, setRows] = useState(initialRows);
  const [selected, setSelected] = useState<Set<string | number>>(new Set());
  const [group, setGroup] = useState('');
  const [csv, setCsv] = useState('');
  return (
    <Stack space="md">
      <Cluster space="sm" wrap="wrap" align="end">
        <TextField label="Group for selected rows" value={group} onChange={setGroup} />
        <Button
          isDisabled={selected.size === 0 || !group.trim()}
          onPress={() =>
            setRows((current) =>
              current.map((row) => (selected.has(row.id) ? { ...row, group } : row)),
            )
          }
        >
          Set group
        </Button>
        <Button onPress={() => setCsv(formatTableCsv({ rows, columns }))}>Export all rows</Button>
        <Button
          isDisabled={selected.size === 0}
          onPress={() =>
            setCsv(formatTableCsv({ rows: rows.filter((row) => selected.has(row.id)), columns }))
          }
        >
          Export selected rows
        </Button>
      </Cluster>
      <Table
        aria-label="Editable plants"
        rows={rows}
        columns={columns}
        selectionMode="multiple"
        selectedKeys={selected}
        onSelectionChange={(keys) =>
          setSelected(keys === 'all' ? new Set(rows.map((row) => row.id)) : new Set(keys))
        }
        onCellsChange={(edits) =>
          setRows((current) =>
            current.map((row) =>
              edits
                .filter((edit) => edit.row.id === row.id)
                .reduce((next, edit) => ({ ...next, [edit.columnId]: edit.value }), row),
            ),
          )
        }
        filterable
      />
      <output aria-label="CSV preview">
        <pre>{csv}</pre>
      </output>
    </Stack>
  );
}

/** The host chooses the focused visualization without a component carrying unrelated modes. */
export function StateMachineComposition() {
  const states = [
    { id: 'draft', label: 'Draft' },
    { id: 'ready', label: 'Ready', isFinal: true },
  ];
  const transitions = [{ id: 'submit', from: 'draft', to: 'ready', label: 'Submit' }];
  return (
    <Stack space="md">
      <StateMachineGraph states={states} transitions={transitions} />
      <StateMachineSequence states={states} transitions={transitions} />
    </Stack>
  );
}
