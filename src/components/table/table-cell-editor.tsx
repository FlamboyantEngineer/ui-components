'use client';

import { useContext, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Input, TableStateContext } from '../../primitives/index.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { getColumnText } from './table-columns.js';
import { tableHooks as hooks } from './table-hooks.js';
import { readCellText, type CellReading } from './table-cell-writes.js';
import {
  getCellValue,
  isTextValue,
  type TableCellEditor,
  type TableCellValue,
  type TableColumn,
  type TableRow,
} from './table-rows.js';
import type { CellEditing, CellMove } from './use-cell-editing.js';

/** The text a cell's editor starts with: the cell's text or number. */
function formatEditorText(value: TableCellValue): string {
  return isTextValue(value) ? String(value) : '';
}

interface TableCellEditorViewProps<T> {
  row: T;
  column: TableColumn<T>;
  editing: Pick<CellEditing<T>, 'editing' | 'commit' | 'cancel' | 'release' | 'dismiss'>;
  /** Spreadsheet mode: Enter and Tab commit and move to the next cell. */
  movesOnCommit: boolean;
}

interface DefaultEditorProps {
  initialText: string;
  label: string;
  /** Reads the text as the cell's value, with the column's message when it refuses it. */
  read: (text: string) => CellReading;
  onCommit: (value: TableCellValue, move?: CellMove) => void;
  onRelease: (value: TableCellValue) => void;
  onCancel: () => void;
  onDismiss: () => void;
  movesOnCommit: boolean;
}

/** Hands the arrow keys, Home, End and type-ahead to the editor while it is open. */
function useKeyboardNavigationLock() {
  const state = useContext(TableStateContext);
  useLayoutEffect(() => {
    state?.setKeyboardNavigationDisabled(true);
    return () => state?.setKeyboardNavigationDisabled(false);
  }, [state]);
}

/** Ends the edit of an Escape key, keeping the key from the grid. */
function handleEscape(event: KeyboardEvent, cancel: () => void): void {
  if (event.key !== 'Escape') return;
  // An input method's Escape cancels its candidate, not the edit, and stays inside the editor.
  if (isComposingKey(event.nativeEvent)) {
    event.stopPropagation();
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  cancel();
}

/** Where a commit key moves focus in spreadsheet mode: Enter down, Tab along, Shift back. */
function getCommitMove(event: KeyboardEvent, movesOnCommit: boolean): CellMove | undefined {
  if (!movesOnCommit) return undefined;
  if (event.key === 'Tab') return event.shiftKey ? 'start' : 'end';
  return event.shiftKey ? 'up' : 'down';
}

/**
 * A text input that commits on Enter and when focus leaves it, and cancels on Escape. A value the
 * column refuses keeps the editor open with its message; leaving then drops the text.
 */
function DefaultCellEditor(props: DefaultEditorProps) {
  const { label, read, movesOnCommit } = props;
  const [text, setText] = useState(props.initialText);
  const [error, setError] = useState<string | null>(null);
  // Leaving the document fires blur too: only the first way out counts.
  const isDone = useRef(false);
  const commit = (event: KeyboardEvent) => {
    event.preventDefault();
    const reading = read(text);
    setError(reading.error);
    if (reading.error !== null || isDone.current) return;
    isDone.current = true;
    props.onCommit(reading.value, getCommitMove(event, movesOnCommit));
  };
  const release = () => {
    if (isDone.current) return;
    isDone.current = true;
    const reading = read(text);
    if (reading.error === null) props.onRelease(reading.value);
    else props.onDismiss();
  };
  return (
    <>
      <Input
        {...hooks.slot('editor', { invalid: error !== null })}
        aria-label={label}
        aria-invalid={error !== null || undefined}
        value={text}
        autoFocus
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          // Enter confirms an input method's candidate, not the edit.
          const isCommitKey = event.key === 'Enter' || (event.key === 'Tab' && movesOnCommit);
          if (isCommitKey && !isComposingKey(event.nativeEvent)) commit(event);
          handleEscape(event, () => {
            isDone.current = true;
            props.onCancel();
          });
        }}
        onBlur={release}
      />
      {error === null ? null : (
        <span {...hooks.slot('editor-message')} role="alert">
          {error}
        </span>
      )}
    </>
  );
}

/**
 * The editor of the cell being edited: the column's own editor, or a text input. Escape cancels;
 * while it is open the grid's arrow-key navigation is off so the editor keeps its keys.
 */
export function TableCellEditorView<T extends TableRow>({
  row,
  column,
  editing,
  movesOnCommit,
}: TableCellEditorViewProps<T>) {
  useKeyboardNavigationLock();
  const value = getCellValue(row, column);
  const label = getColumnText(column);
  const toEdit = (next: TableCellValue) => ({ row, columnId: column.id, value: next });
  const editor: TableCellEditor = {
    value,
    label,
    commit: (next) => editing.commit(toEdit(next)),
    cancel: editing.cancel,
  };
  if (column.renderEditor) {
    return (
      // The wrapper only hears Escape bubbling from the caller's editor inside it.
      <span onKeyDown={(event) => handleEscape(event, editing.cancel)}>
        {column.renderEditor(row, editor)}
      </span>
    );
  }
  return (
    <DefaultCellEditor
      initialText={editing.editing?.text ?? formatEditorText(value)}
      label={label}
      read={(text) => readCellText(row, column, text)}
      onCommit={(next, move) => editing.commit(toEdit(next), move)}
      onRelease={(next) => editing.release(toEdit(next))}
      onCancel={editing.cancel}
      onDismiss={editing.dismiss}
      movesOnCommit={movesOnCommit}
    />
  );
}
