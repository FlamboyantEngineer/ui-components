'use client';

import { type KeyboardEvent, useContext, useLayoutEffect, useRef, useState } from 'react';
import { Input, TableStateContext } from '../../primitives/index.js';
import { stopConsumedEscape } from '../../utils/consumed-escape.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { isDate } from '../../utils/is-date.js';
import { type CellReading, formatCellText, readCellText } from './table-cell-writes.js';
import { getColumnText } from './table-columns.js';
import { tableHooks as hooks } from './table-hooks.js';
import {
  getCellValue,
  isTextValue,
  type TableCellEditor,
  type TableCellValue,
  type TableColumn,
  type TableRow,
} from './table-rows.js';
import type { CellEditing } from './use-cell-editing.js';

/**
 * The text a cell's editor starts with: the cell's text or number, `true` or `false`, or a date's
 * ISO form. Left untouched, the editor reports the cell's own value, so no type is lost.
 */
function formatEditorText(value: TableCellValue): string {
  if (isTextValue(value) || typeof value === 'boolean') return String(value);
  if (isDate(value)) return formatCellText(value);
  return '';
}

interface TableCellEditorViewProps<T> {
  row: T;
  column: TableColumn<T>;
  editing: Pick<CellEditing<T>, 'editing' | 'commit' | 'cancel' | 'release' | 'dismiss'>;
}

interface DefaultEditorProps {
  initialText: string;
  /** The cell's value, reported as it is while the text is the untouched `initialText`. */
  original: { value: TableCellValue } | null;
  label: string;
  /** Reads the text as the cell's value, with the column's message when it refuses it. */
  read: (text: string) => CellReading;
  onCommit: (value: TableCellValue) => void;
  onRelease: (value: TableCellValue) => void;
  onCancel: () => void;
  onDismiss: () => void;
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
  // An editor that handled the Escape itself (closing its own popover, say) keeps the edit open.
  if (stopConsumedEscape(event)) return;
  // An input method's Escape cancels its candidate, not the edit, and stays inside the editor.
  if (isComposingKey(event.nativeEvent)) {
    event.stopPropagation();
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  cancel();
}

/**
 * A text input that commits on Enter and when focus leaves it, and cancels on Escape. A value the
 * column refuses keeps the editor open with its message; leaving then drops the text.
 */
function DefaultCellEditor(props: DefaultEditorProps) {
  const { label, read } = props;
  const [text, setText] = useState(props.initialText);
  const [error, setError] = useState<string | null>(null);
  // Leaving the document fires blur too: only the first way out counts.
  const isDone = useRef(false);
  // Untouched text reports the cell's own value rather than a reading of its text.
  const readText = (): CellReading =>
    props.original && text === props.initialText
      ? { value: props.original.value, error: null }
      : read(text);
  const commit = (event: KeyboardEvent) => {
    event.preventDefault();
    const reading = readText();
    setError(reading.error);
    if (reading.error !== null || isDone.current) return;
    isDone.current = true;
    props.onCommit(reading.value);
  };
  const release = () => {
    if (isDone.current) return;
    isDone.current = true;
    const reading = readText();
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
          const isCommitKey = event.key === 'Enter';
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
      initialText={formatEditorText(value)}
      original={{ value }}
      label={label}
      read={(text) => readCellText(row, column, text)}
      onCommit={(next) => editing.commit(toEdit(next))}
      onRelease={(next) => editing.release(toEdit(next))}
      onCancel={editing.cancel}
      onDismiss={editing.dismiss}
    />
  );
}
