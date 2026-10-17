import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import type { TableCellValue, TableColumn, TableRow } from './table-rows.js';

/** A finished cell edit: the row, the column and the cell's new value. */
export interface TableCellEdit<T> {
  row: T;
  columnId: string;
  value: TableCellValue;
}

/** The cell being edited, by row key and column id. */
export interface TableEditingCell {
  rowKey: string;
  columnId: string;
}

export interface CellEditing<T> {
  /** The cell being edited, if any. */
  editing: TableEditingCell | null;
  /** Ends editing and reports the value; focus returns to the cell unless it moved elsewhere. */
  commit: (row: T, columnId: string, value: TableCellValue) => void;
  /** Ends editing without a change; focus returns to the cell. */
  cancel: () => void;
  /** Ends editing because focus left the editor, leaving focus where it went. */
  release: (row: T, columnId: string, value: TableCellValue) => void;
  /** Handlers for the table root: F2, Enter or a double click on an editable cell opens its editor. */
  rootProps: {
    onKeyDownCapture: (event: KeyboardEvent<HTMLElement>) => void;
    onDoubleClickCapture: (event: MouseEvent<HTMLElement>) => void;
  };
}

interface CellEditingOptions<T> {
  columns: readonly TableColumn<T>[];
  onCellEdit?: ((edit: TableCellEdit<T>) => void) | undefined;
}

const editKeys = new Set(['F2', 'Enter']);

/** The editable body cell of the table whose root is `root` that holds `target`. */
function findEditableCell<T>(
  target: EventTarget,
  root: HTMLElement,
  columns: readonly TableColumn<T>[],
): TableEditingCell | null {
  const element = target instanceof Element ? target.closest('[role="gridcell"]') : null;
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

/** Whether `editing` is the cell of `row` in the column `columnId`. */
export function isEditingCell<T extends TableRow>(
  editing: TableEditingCell | null,
  row: T,
  columnId: string,
): boolean {
  return editing?.rowKey === String(row.id) && editing.columnId === columnId;
}

/**
 * Cell editing: one cell at a time opens an editor from F2, Enter or a double click, and a commit
 * reports the new value through `onCellEdit`. The table never changes its rows itself.
 */
export function useCellEditing<T extends TableRow>({
  columns,
  onCellEdit,
}: CellEditingOptions<T>): CellEditing<T> {
  const [editing, setEditing] = useState<TableEditingCell | null>(null);
  // The open cell as events see it: a blur that follows a commit must not report twice.
  const open = useRef<TableEditingCell | null>(null);
  const root = useRef<HTMLElement | null>(null);
  const refocus = useRef<TableEditingCell | null>(null);
  const latest = useRef(onCellEdit);
  useLayoutEffect(() => {
    latest.current = onCellEdit;
  });

  useLayoutEffect(() => {
    const cell = refocus.current;
    refocus.current = null;
    const element = cell && root.current ? findCellElement(root.current, cell) : undefined;
    const active = document.activeElement;
    // Focus is still in the closing editor, or fell to the page with it; elsewhere it moved on.
    if (element && (active === null || active === document.body || element.contains(active))) {
      element.focus();
    }
  });

  const end = useCallback((restoreFocus: boolean): boolean => {
    const cell = open.current;
    open.current = null;
    refocus.current = restoreFocus ? cell : null;
    setEditing(null);
    return cell !== null;
  }, []);
  const commit = useCallback(
    (row: T, columnId: string, value: TableCellValue) => {
      if (end(true)) latest.current?.({ row, columnId, value });
    },
    [end],
  );
  const release = useCallback(
    (row: T, columnId: string, value: TableCellValue) => {
      if (end(false)) latest.current?.({ row, columnId, value });
    },
    [end],
  );
  const cancel = useCallback(() => {
    end(true);
  }, [end]);

  const start = (event: KeyboardEvent<HTMLElement> | MouseEvent<HTMLElement>) => {
    const cell = findEditableCell(event.target, event.currentTarget, columns);
    if (!cell || open.current) return;
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
    rootProps: {
      // Only a key pressed on the cell itself opens it; keys inside its controls are theirs.
      onKeyDownCapture: (event) => {
        const isOnCell =
          event.target instanceof Element && event.target.getAttribute('role') === 'gridcell';
        if (editKeys.has(event.key) && isOnCell) start(event);
      },
      onDoubleClickCapture: start,
    },
  };
}
