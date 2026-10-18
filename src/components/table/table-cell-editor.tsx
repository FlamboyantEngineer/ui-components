import { useContext, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Input, TableStateContext } from '../../primitives/index.js';
import { getColumnText } from './table-column.js';
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

interface TableCellEditorViewProps<T> {
  row: T;
  column: TableColumn<T>;
  editing: Pick<CellEditing<T>, 'commit' | 'cancel' | 'release'>;
}

interface DefaultEditorProps {
  value: TableCellValue;
  label: string;
  onCommit: (value: TableCellValue) => void;
  onRelease: (value: TableCellValue) => void;
  onCancel: () => void;
}

/** The typed text as a cell value: a number when the cell held one and the text reads as one. */
function parseText(text: string, previous: TableCellValue): TableCellValue {
  const number = Number(text);
  return typeof previous === 'number' && text.trim() !== '' && Number.isFinite(number)
    ? number
    : text;
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
  event.preventDefault();
  event.stopPropagation();
  cancel();
}

/** A text input that commits on Enter and when focus leaves it, and cancels on Escape. */
function DefaultCellEditor({ value, label, onCommit, onRelease, onCancel }: DefaultEditorProps) {
  const [text, setText] = useState(isTextValue(value) ? String(value) : '');
  // Leaving the document fires blur too: only the first way out counts.
  const isDone = useRef(false);
  const finish = (report: (value: TableCellValue) => void) => {
    if (isDone.current) return;
    isDone.current = true;
    report(parseText(text, value));
  };
  return (
    <Input
      className={hooks.slotClass('editor')}
      aria-label={label}
      value={text}
      autoFocus
      onChange={(event) => setText(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          finish(onCommit);
        }
        handleEscape(event, () => {
          isDone.current = true;
          onCancel();
        });
      }}
      onBlur={() => finish(onRelease)}
    />
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
  const editor: TableCellEditor = {
    value,
    label,
    commit: (next) => editing.commit(row, column.id, next),
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
      value={value}
      label={label}
      onCommit={editor.commit}
      onRelease={(next) => editing.release(row, column.id, next)}
      onCancel={editing.cancel}
    />
  );
}
