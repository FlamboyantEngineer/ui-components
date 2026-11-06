'use client';

import { useLayoutEffect, useRef } from 'react';
import type { Key } from '../../core/props.js';
import { useStateFor } from '../../utils/use-state-for.js';
import type { TableCellValue } from './table-rows.js';

/** One cell's change: its row's id, its column and its value before and after. */
export interface TableCellChange {
  rowId: Key;
  columnId: string;
  before: TableCellValue;
  after: TableCellValue;
}

/** Undo and redo of a table's cell edits, for the table's `editHistory` and the host's toolbar. */
export interface TableEditHistory {
  /** An entry waits to be undone. */
  canUndo: boolean;
  /** An undone entry waits to be redone. */
  canRedo: boolean;
  /** Reverts the latest entry through the table that holds the history. */
  undo: () => void;
  /** Applies the latest undone entry again. */
  redo: () => void;
  /** Forgets every entry. */
  clear: () => void;
}

export interface TableEditHistoryOptions {
  /** The most entries kept; the oldest go first. Defaults to 100. */
  limit?: number | undefined;
  /** Clears the history when it changes, such as when the host replaces its dataset. */
  resetKey?: unknown;
}

/** Which way an entry is applied: back to its `before` values, or forward to its `after` values. */
export type HistoryDirection = 'undo' | 'redo';

/** Applies an entry's changes through a table and returns those it could apply. */
export type HistoryApplier = (
  changes: readonly TableCellChange[],
  direction: HistoryDirection,
) => readonly TableCellChange[];

/** The table's side of a history: recording its edits, and connecting how entries apply. */
export interface HistoryChannel {
  record: (changes: readonly TableCellChange[]) => void;
  /** Makes `applier` the way entries apply until the returned function disconnects it. */
  connect: (applier: HistoryApplier) => () => void;
}

interface HistoryStacks {
  past: readonly (readonly TableCellChange[])[];
  future: readonly (readonly TableCellChange[])[];
}

const emptyStacks: HistoryStacks = { past: [], future: [] };

const channelKey = Symbol('table edit history');

/** The table's side of a history from `useTableEditHistory`, or null for any other object. */
export function readHistoryChannel(history: TableEditHistory): HistoryChannel | null {
  return (history as Partial<Record<typeof channelKey, HistoryChannel>>)[channelKey] ?? null;
}

/**
 * Undoes entries from the top of `from` until one applies: an entry none of whose cells apply any
 * more is dropped. Returns the rest of `from` and the applied part of the entry, if any.
 */
function stepStack(
  from: HistoryStacks['past'],
  apply: (changes: readonly TableCellChange[]) => readonly TableCellChange[],
) {
  const rest = [...from];
  for (let entry = rest.pop(); entry; entry = rest.pop()) {
    const applied = apply(entry);
    if (applied.length > 0) return { rest, applied };
  }
  return { rest, applied: null };
}

/**
 * A bounded history of a table's cell edits. Hand it to the table's `editHistory`: each edit,
 * paste, fill, clear or bulk edit it reports becomes one entry of its changes, by row id and column,
 * and `undo` and `redo` report the reverse or the same changes through the table's `onCellsChange`.
 * Recording a new entry forgets the undone ones.
 */
export function useTableEditHistory(options: TableEditHistoryOptions = {}): TableEditHistory {
  const { limit = 100, resetKey } = options;
  const [stacks, setStacks] = useStateFor<HistoryStacks>(resetKey, emptyStacks);
  const current = useRef(stacks);
  const applierRef = useRef<HistoryApplier | null>(null);
  useLayoutEffect(() => {
    current.current = stacks;
  });
  const update = (next: HistoryStacks) => {
    current.current = next;
    setStacks(next);
  };
  const step = (direction: HistoryDirection) => {
    const apply = applierRef.current;
    if (!apply) return;
    const { past, future } = current.current;
    const isUndo = direction === 'undo';
    const { rest, applied } = stepStack(isUndo ? past : future, (changes) =>
      apply(changes, direction),
    );
    const moved = applied ? [applied] : [];
    update(
      isUndo
        ? { past: rest, future: [...future, ...moved] }
        : { past: [...past, ...moved], future: rest },
    );
  };
  const connect = (applier: HistoryApplier) => {
    applierRef.current = applier;
    return () => {
      if (applierRef.current === applier) applierRef.current = null;
    };
  };
  const record = (changes: readonly TableCellChange[]) => {
    if (changes.length === 0) return;
    const past = [...current.current.past, changes];
    update({ past: past.slice(Math.max(0, past.length - Math.max(1, limit))), future: [] });
  };
  const history = {
    canUndo: stacks.past.length > 0,
    canRedo: stacks.future.length > 0,
    undo: () => step('undo'),
    redo: () => step('redo'),
    clear: () => update(emptyStacks),
    [channelKey]: { record, connect } satisfies HistoryChannel,
  };
  return history;
}
