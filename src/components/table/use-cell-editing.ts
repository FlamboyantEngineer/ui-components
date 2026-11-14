'use client';

import {
  type KeyboardEvent,
  type MouseEvent,
  type RefObject,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Key } from '../../core/props.js';
import { containsFocus, isFocusLost } from '../../utils/focus-target.js';
import { isElement, isHTMLElement } from '../../utils/is-element.js';
import { isInteractiveTarget } from '../../utils/is-interactive-target.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { useLatest } from '../../utils/use-latest.js';
import type { TableCellValue, TableColumn, TableRow } from './table-rows.js';

/** A finished cell edit: the row, the column and the cell's new value. */
export interface TableCellEdit<T> {
  row: T;
  columnId: string;
  value: TableCellValue;
}

/** The cell being edited, by its row's collection key and column id, with its initial typed character. */
interface TableEditingCell {
  rowKey: string;
  columnId: string;
}

export interface CellEditing<T> {
  /** The cell being edited, if any. */
  editing: TableEditingCell | null;
  /**
   * Ends editing and reports the value; focus returns to the cell unless it moved elsewhere.
   */
  commit: (edit: TableCellEdit<T>) => void;
  /** Ends editing without a change; focus returns to the cell. */
  cancel: () => void;
  /** Ends editing because focus left the editor, leaving focus where it went. */
  release: (edit: TableCellEdit<T>) => void;
  /** Ends editing without a change because focus left the editor. */
  dismiss: () => void;
  /** Handlers for the table root: F2, Enter or a double click on an editable cell opens its editor. */
  rootProps: {
    onKeyDownCapture: (event: KeyboardEvent<HTMLElement>) => void;
    onDoubleClickCapture: (event: MouseEvent<HTMLElement>) => void;
  };
}

interface CellEditingOptions<T> {
  /** The drawn columns; an editor whose column stops allowing edits or leaves closes. */
  columns: readonly TableColumn<T>[];
  /** The presented rows; an editor whose row leaves them closes. */
  rows: readonly T[];
  /** Reports a committed edit, as a batch of one. */
  onCellsChange?: ((edits: readonly TableCellEdit<T>[]) => void) | undefined;
  /** The ids of disabled rows, whose cells never open an editor or report an edit. */
  disabledKeys?: Iterable<Key> | undefined;
}

interface Refocus {
  cell: TableEditingCell;
}

const editKeys = new Set(['F2', 'Enter']);

/** The editable body cell of the table whose root is `root` that holds `target`. */
function findEditableCell<T>(
  target: EventTarget,
  root: HTMLElement,
  columns: readonly TableColumn<T>[],
): TableEditingCell | null {
  const element = isElement(target) ? target.closest('.ui-table__cell') : null;
  const body = element?.closest('.ui-table__body');
  if (!isHTMLElement(element) || !body || body.closest('.ui-table') !== root) return null;
  const columnId = element.dataset['column'];
  const rowKey = element.closest('[role="row"]')?.getAttribute('data-key');
  const column = columns.find((candidate) => candidate.id === columnId);
  if (!column?.allowsEditing || columnId === undefined || rowKey == null) return null;
  return { rowKey, columnId };
}

/** The cell's element, found again after a render. */
function findCellElement(root: HTMLElement, cell: TableEditingCell): HTMLElement | undefined {
  const row = [...root.querySelectorAll('.ui-table__body [role="row"]')].find(
    (candidate) => candidate.getAttribute('data-key') === cell.rowKey,
  );
  return [...(row?.children ?? [])].find(
    (candidate): candidate is HTMLElement =>
      isHTMLElement(candidate) && candidate.dataset['column'] === cell.columnId,
  );
}

/** Whether `editing` is the cell of `row` in the column `columnId`. */
export function isEditingCell<T extends TableRow>(
  editing: TableEditingCell | null,
  row: T,
  columnId: string,
): boolean {
  return editing?.rowKey === toCollectionKey(row.id) && editing.columnId === columnId;
}

/** The body row of `cell`, found again after a render. */
function findRowElement(root: HTMLElement, cell: TableEditingCell): HTMLElement | undefined {
  return [...root.querySelectorAll('.ui-table__body [role="row"]')].find(
    (candidate): candidate is HTMLElement =>
      isHTMLElement(candidate) && candidate.getAttribute('data-key') === cell.rowKey,
  );
}

/**
 * Where focus goes after an editor closes: its cell, else its row when the cell is gone, else the
 * grid when the row is gone too.
 */
function findFocusTarget(root: HTMLElement, cell: TableEditingCell): HTMLElement | undefined {
  const grid = root.querySelector('[role="grid"], [role="treegrid"]');
  return (
    findCellElement(root, cell) ??
    findRowElement(root, cell) ??
    (isHTMLElement(grid) ? grid : undefined)
  );
}

/** After an editor closes, focuses its cell, unless focus moved elsewhere. */
function useRefocus(rootRef: RefObject<HTMLElement | null>, refocusRef: RefObject<Refocus | null>) {
  useLayoutEffect(() => {
    const target = refocusRef.current;
    refocusRef.current = null;
    const element =
      target && rootRef.current ? findFocusTarget(rootRef.current, target.cell) : undefined;
    // Focus is still in the closing editor, or fell to the page with it; elsewhere it moved on.
    if (element && (isFocusLost(element) || containsFocus(element))) {
      element.focus();
    }
  });
}

/** Whether the open cell may stay open: its row is presented and enabled, its column editable. */
function useIsStillEditable<T extends TableRow>(
  rows: readonly T[],
  columns: readonly TableColumn<T>[],
  disabledRowKeys: ReadonlySet<string>,
) {
  const rowKeys = useMemo(() => new Set(rows.map((row) => toCollectionKey(row.id))), [rows]);
  return useCallback(
    (cell: TableEditingCell) =>
      rowKeys.has(cell.rowKey) &&
      !disabledRowKeys.has(cell.rowKey) &&
      columns.some((column) => column.id === cell.columnId && column.allowsEditing),
    [rowKeys, columns, disabledRowKeys],
  );
}

/** Whether a target is a control inside a cell, such as an expand button or a link. */
function isInCellControl(target: EventTarget): boolean {
  const cell = isElement(target) ? target.closest('.ui-table__cell') : null;
  return cell !== null && isInteractiveTarget(target, cell);
}

/**
 * Cell editing: one cell at a time of an enabled row opens an editor from F2, Enter or a double
 * click, and a commit reports the new value through `onCellsChange`, as a batch of one. An editor
 * whose row becomes disabled or leaves the presented rows, or whose column stops allowing edits,
 * closes without reporting. The table never changes its rows itself.
 */
export function useCellEditing<T extends TableRow>({
  columns,
  rows,
  onCellsChange,
  disabledKeys,
}: CellEditingOptions<T>): CellEditing<T> {
  const [editing, setEditing] = useState<TableEditingCell | null>(null);
  const disabledRowKeys = useMemo(
    () => new Set(Array.from(disabledKeys ?? [], toCollectionKey)),
    [disabledKeys],
  );
  const disabled = useLatest(disabledRowKeys);
  // The open cell as events see it: a blur that follows a commit must not report twice.
  const open = useRef<TableEditingCell | null>(null);
  const root = useRef<HTMLElement | null>(null);
  const refocus = useRef<Refocus | null>(null);
  const latest = useLatest(onCellsChange);

  // A row disabled or gone, or a column no longer editable, closes the editor in the same render,
  // discarding the draft; the commit then forgets the open cell and returns focus to it.
  const isStillEditable = useIsStillEditable(rows, columns, disabledRowKeys);
  if (editing && !isStillEditable(editing)) setEditing(null);
  useLayoutEffect(() => {
    if (editing !== null || open.current === null) return;
    refocus.current = { cell: open.current };
    open.current = null;
  }, [editing]);
  useRefocus(root, refocus);

  const end = useCallback((restoreFocus: boolean): boolean => {
    const cell = open.current;
    open.current = null;
    refocus.current = restoreFocus && cell ? { cell } : null;
    setEditing(null);
    return cell !== null;
  }, []);
  // A commit restores focus; a release, such as a blur, leaves focus where it went.
  const finish = useCallback(
    (edit: TableCellEdit<T>, restoreFocus: boolean) => {
      if (end(restoreFocus) && !disabled.current.has(toCollectionKey(edit.row.id)))
        latest.current?.([edit]);
    },
    [end, latest, disabled],
  );
  const commit = useCallback((edit: TableCellEdit<T>) => finish(edit, true), [finish]);
  const release = useCallback((edit: TableCellEdit<T>) => finish(edit, false), [finish]);
  const cancel = useCallback(() => {
    end(true);
  }, [end]);
  const dismiss = useCallback(() => {
    end(false);
  }, [end]);

  const start = (event: KeyboardEvent<HTMLElement> | MouseEvent<HTMLElement>) => {
    const cell = findEditableCell(event.target, event.currentTarget, columns);
    if (!cell || open.current || disabledRowKeys.has(cell.rowKey)) return;
    root.current = event.currentTarget;
    open.current = cell;
    setEditing(cell);
    event.preventDefault();
    event.stopPropagation();
  };

  return {
    editing,
    commit,
    cancel,
    release,
    dismiss,
    rootProps: {
      // Only a key pressed on the cell itself opens it; keys inside its controls are theirs.
      onKeyDownCapture: (event) => {
        const isOnCell =
          isElement(event.target) && event.target.classList.contains('ui-table__cell');
        if (!isOnCell) return;
        if (editKeys.has(event.key)) start(event);
      },
      // A double click on a control inside the cell, such as an expand button or a link, is the control's.
      onDoubleClickCapture: (event) => {
        if (!isInCellControl(event.target)) start(event);
      },
    },
  };
}
