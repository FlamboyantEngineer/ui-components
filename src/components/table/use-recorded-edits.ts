'use client';

import { type KeyboardEvent, useLayoutEffect, useMemo } from 'react';
import type { Key } from '../../core/props.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { isDate } from '../../utils/is-date.js';
import { isEditableTarget } from '../../utils/is-editable-target.js';
import { useLatest } from '../../utils/use-latest.js';
import { walkTree } from '../../utils/walk-tree.js';
import { readCommandKey } from '../shortcut/shortcut.js';
import {
  type HistoryApplier,
  readHistoryChannel,
  type TableCellChange,
  type TableEditHistory,
} from './table-edit-history.js';
import {
  getCellValue,
  type TableCellValue,
  type TableColumn,
  type TableRow,
} from './table-rows.js';
import type { TableChildRows } from './table-tree.js';
import type { TableCellEdit } from './use-cell-editing.js';

interface RecordedEditsOptions<T> {
  rows: readonly T[];
  columns: readonly TableColumn<T>[];
  getChildRows?: TableChildRows<T>;
  isRowDisabled: (row: T) => boolean;
  onCellEdit?: ((edit: TableCellEdit<T>) => void) | undefined;
  onCellsChange?: ((edits: readonly TableCellEdit<T>[]) => void) | undefined;
  editHistory?: TableEditHistory | undefined;
}

/** The table's edit callbacks, recording what they report, and the root's undo and redo keys. */
export interface RecordedEdits<T> {
  onCellEdit: ((edit: TableCellEdit<T>) => void) | undefined;
  onCellsChange: ((edits: readonly TableCellEdit<T>[]) => void) | undefined;
  rootProps: object;
}

/** Whether two cell values are the same: the same value, or dates of the same instant. */
function isSameCellValue(left: TableCellValue, right: TableCellValue): boolean {
  if (isDate(left) && isDate(right)) return Object.is(left.getTime(), right.getTime());
  return Object.is(left, right);
}

/** What Control or Command with Z or Y asks for: undo, or redo with Shift or with Y. */
function readHistoryKey(event: KeyboardEvent<HTMLElement>): 'undo' | 'redo' | null {
  if (!(event.ctrlKey || event.metaKey) || event.altKey || isComposingKey(event.nativeEvent)) {
    return null;
  }
  const letter = readCommandKey(event);
  if (letter === 'z') return event.shiftKey ? 'redo' : 'undo';
  return letter === 'y' && !event.shiftKey ? 'redo' : null;
}

/** The changes edits make: each edit's row, column and value before and after, when it changes. */
function toChanges<T extends TableRow>(
  edits: readonly TableCellEdit<T>[],
  columns: readonly TableColumn<T>[],
): TableCellChange[] {
  return edits.flatMap((edit) => {
    const column = columns.find((candidate) => candidate.id === edit.columnId);
    const before = column ? getCellValue(edit.row, column) : undefined;
    if (!column || isSameCellValue(before, edit.value)) return [];
    return [{ rowId: edit.row.id, columnId: edit.columnId, before, after: edit.value }];
  });
}

/**
 * Applies changes through the table's callbacks: a change applies only while its row is still
 * among the table's rows and enabled, its column allows editing and its cell still holds the value the change left there,
 * so an entry never overwrites a change made since. Returns the changes it applied.
 */
function useHistoryApplier<T extends TableRow>(options: RecordedEditsOptions<T>): HistoryApplier {
  const { rows, getChildRows } = options;
  const rowsById = useMemo(
    () =>
      new Map<Key, T>(
        Array.from(
          walkTree(rows, (row) => getChildRows?.(row) ?? undefined),
          (row) => [row.id, row],
        ),
      ),
    [rows, getChildRows],
  );
  const latest = useLatest({ ...options, rowsById });
  return (changes, direction) => {
    const { columns, isRowDisabled, onCellEdit, onCellsChange } = latest.current;
    const isUndo = direction === 'undo';
    const applied: TableCellChange[] = [];
    const edits = changes.flatMap((change) => {
      const row = latest.current.rowsById.get(change.rowId);
      const column = columns.find((candidate) => candidate.id === change.columnId);
      if (!row || !column?.allowsEditing || isRowDisabled(row)) return [];
      const expected = isUndo ? change.after : change.before;
      if (!isSameCellValue(getCellValue(row, column), expected)) return [];
      applied.push(change);
      return [{ row, columnId: change.columnId, value: isUndo ? change.before : change.after }];
    });
    if (edits.length === 0) return applied;
    if (onCellsChange) onCellsChange(edits);
    else for (const edit of edits) onCellEdit?.(edit);
    return applied;
  };
}

/**
 * A table's edit history: with `editHistory`, the edits its callbacks report are recorded as one
 * entry per report, the history applies its entries through the same callbacks, and Control or
 * Command with Z undoes and with Shift+Z or Y redoes, unless the key belongs to a field, editable
 * content or an input method composition.
 */
export function useRecordedEdits<T extends TableRow>(
  options: RecordedEditsOptions<T>,
): RecordedEdits<T> {
  const { editHistory, columns, onCellEdit, onCellsChange } = options;
  const channel = editHistory ? readHistoryChannel(editHistory) : null;
  const apply = useHistoryApplier(options);
  const applyRef = useLatest(apply);
  const connect = channel?.connect;
  useLayoutEffect(
    () => connect?.((changes, direction) => applyRef.current(changes, direction)),
    [connect, applyRef],
  );
  if (!channel || !editHistory) return { onCellEdit, onCellsChange, rootProps: {} };
  const record = (edits: readonly TableCellEdit<T>[]) => channel.record(toChanges(edits, columns));
  return {
    onCellEdit:
      onCellEdit &&
      ((edit) => {
        record([edit]);
        onCellEdit(edit);
      }),
    onCellsChange:
      onCellsChange &&
      ((edits) => {
        record(edits);
        onCellsChange(edits);
      }),
    rootProps: {
      onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
        const action = event.defaultPrevented ? null : readHistoryKey(event);
        if (!action || isEditableTarget(event.target)) return;
        event.preventDefault();
        if (action === 'undo') editHistory.undo();
        else editHistory.redo();
      },
    },
  };
}
