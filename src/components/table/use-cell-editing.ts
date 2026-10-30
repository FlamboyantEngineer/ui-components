'use client';

import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type RefObject,
} from 'react';
import type { Key } from '../../core/props.js';
import type { TableCellValue, TableColumn, TableRow } from './table-rows.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { useLatest } from '../../utils/use-latest.js';

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
  /** The character typed on the cell that opened its editor, which replaces the cell's text. */
  text?: string | undefined;
}

/** Where focus moves after a commit: to the cell below or above, or the next cell along the row. */
export type CellMove = 'down' | 'up' | 'start' | 'end';

export interface CellEditing<T> {
  /** The cell being edited, if any. */
  editing: TableEditingCell | null;
  /**
   * Ends editing and reports the value; focus returns to the cell, or moves to the next cell in
   * the direction of `move`, unless it moved elsewhere.
   */
  commit: (edit: TableCellEdit<T>, move?: CellMove) => void;
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
  columns: readonly TableColumn<T>[];
  onCellEdit?: ((edit: TableCellEdit<T>) => void) | undefined;
  /** The ids of disabled rows, whose cells never open an editor or report an edit. */
  disabledKeys?: Iterable<Key> | undefined;
  /** Spreadsheet mode: typing a character on an editable cell opens its editor with it. */
  typeToEdit: boolean;
}

interface Refocus {
  cell: TableEditingCell;
  move: CellMove | undefined;
}

const editKeys = new Set(['F2', 'Enter']);

/** Whether a key press types a character, other than Space, which keeps selecting rows. */
function isTypedCharacter(event: KeyboardEvent<HTMLElement>): boolean {
  const isPlain = !event.ctrlKey && !event.metaKey && !event.altKey;
  return isPlain && event.key.length === 1 && event.key !== ' ';
}

/** The editable body cell of the table whose root is `root` that holds `target`. */
function findEditableCell<T>(
  target: EventTarget,
  root: HTMLElement,
  columns: readonly TableColumn<T>[],
): TableEditingCell | null {
  const element = target instanceof Element ? target.closest('.ui-table__cell') : null;
  const body = element?.closest('.ui-table__body');
  if (!(element instanceof HTMLElement) || !body || body.closest('.ui-table') !== root) return null;
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
      candidate instanceof HTMLElement && candidate.dataset['column'] === cell.columnId,
  );
}

/** The data cell next to `element` in the direction of `move`: rows in document order, cells along the row. */
function findAdjacentCell(
  root: HTMLElement,
  element: HTMLElement,
  move: CellMove,
): HTMLElement | undefined {
  const isData = (candidate: Element): candidate is HTMLElement =>
    candidate instanceof HTMLElement && candidate.dataset['kind'] === 'data';
  const step = move === 'down' || move === 'end' ? 1 : -1;
  if (move === 'start' || move === 'end') {
    const cells = [...(element.parentElement?.children ?? [])].filter(isData);
    return cells[cells.indexOf(element) + step];
  }
  const rows = [...root.querySelectorAll('.ui-table__body .ui-table__row')];
  const row = rows[rows.indexOf(element.closest('[role="row"]') as Element) + step];
  return [...(row?.children ?? [])]
    .filter(isData)
    .find((cell) => cell.dataset['column'] === element.dataset['column']);
}

/** Whether `editing` is the cell of `row` in the column `columnId`. */
export function isEditingCell<T extends TableRow>(
  editing: TableEditingCell | null,
  row: T,
  columnId: string,
): boolean {
  return editing?.rowKey === toCollectionKey(row.id) && editing.columnId === columnId;
}

/** After an editor closes, focuses its cell or the next one, unless focus moved elsewhere. */
function useRefocus(root: RefObject<HTMLElement | null>, refocus: RefObject<Refocus | null>) {
  useLayoutEffect(() => {
    const target = refocus.current;
    refocus.current = null;
    const element = target && root.current ? findCellElement(root.current, target.cell) : undefined;
    const active = document.activeElement;
    // Focus is still in the closing editor, or fell to the page with it; elsewhere it moved on.
    if (element && (active === null || active === document.body || element.contains(active))) {
      const next =
        target?.move && root.current
          ? findAdjacentCell(root.current, element, target.move)
          : undefined;
      (next ?? element).focus();
    }
  });
}

/**
 * Cell editing: one cell at a time of an enabled row opens an editor from F2, Enter or a double
 * click, and a commit reports the new value through `onCellEdit`. An editor whose row becomes
 * disabled closes without reporting. The table never changes its rows itself.
 */
export function useCellEditing<T extends TableRow>({
  columns,
  onCellEdit,
  disabledKeys,
  typeToEdit,
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
  const latest = useLatest(onCellEdit);

  useRefocus(root, refocus);

  const end = useCallback((restoreFocus: boolean, move?: CellMove): boolean => {
    const cell = open.current;
    open.current = null;
    refocus.current = restoreFocus && cell ? { cell, move } : null;
    setEditing(null);
    return cell !== null;
  }, []);
  const commit = useCallback(
    (edit: TableCellEdit<T>, move?: CellMove) => {
      if (end(true, move) && !disabled.current.has(toCollectionKey(edit.row.id))) {
        latest.current?.(edit);
      }
    },
    [end, latest, disabled],
  );
  const release = useCallback(
    (edit: TableCellEdit<T>) => {
      if (end(false) && !disabled.current.has(toCollectionKey(edit.row.id))) latest.current?.(edit);
    },
    [end, latest, disabled],
  );
  const cancel = useCallback(() => {
    end(true);
  }, [end]);

  // A row disabled while its cell is open closes the editor, discarding the draft.
  useLayoutEffect(() => {
    if (editing && disabledRowKeys.has(editing.rowKey)) end(true);
  }, [editing, disabledRowKeys, end]);
  const dismiss = useCallback(() => {
    end(false);
  }, [end]);

  const start = (event: KeyboardEvent<HTMLElement> | MouseEvent<HTMLElement>, text?: string) => {
    const cell = findEditableCell(event.target, event.currentTarget, columns);
    if (!cell || open.current || disabledRowKeys.has(cell.rowKey)) return;
    const opened = text === undefined ? cell : { ...cell, text };
    root.current = event.currentTarget;
    open.current = opened;
    setEditing(opened);
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
          event.target instanceof Element && event.target.classList.contains('ui-table__cell');
        if (!isOnCell) return;
        if (editKeys.has(event.key)) start(event);
        else if (typeToEdit && isTypedCharacter(event)) start(event, event.key);
      },
      onDoubleClickCapture: (event) => start(event),
    },
  };
}
