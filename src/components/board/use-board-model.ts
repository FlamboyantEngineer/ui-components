'use client';

import { useId, useMemo } from 'react';
import type { Key } from '../../core/props.js';
import type { BoardColumn, BoardLane, BoardProps } from './board.js';
import { createBoardLayout, getCellCards, type BoardLayout } from './board-moves.js';
import { useCollapsedKeys, type CollapsedKeys } from './use-board-collapse.js';

/** What the board's parts read: its cells, counts, collapsed state and title ids. */
export interface BoardModel<T> {
  columns: readonly BoardColumn[];
  columnKeys: readonly Key[];
  layout: BoardLayout;
  itemsByKey: ReadonlyMap<Key, T>;
  collapsedColumns: CollapsedKeys;
  collapsedLanes: CollapsedKeys;
  /** The id of a column's title, by the column's index. */
  columnTitleId: (index: number) => string;
  /** The id of a lane's title, by the lane's index. */
  laneTitleId: (index: number) => string;
  /** The cards of a column across lanes. */
  countColumn: (column: Key) => number;
  /** The cards of a lane across columns. */
  countLane: (lane: Key) => number;
  /** Whether a column holds more cards than its limit. */
  isOverLimit: (column: BoardColumn) => boolean;
  /** The items of one cell, in order. */
  getCellItems: (column: Key, lane: Key | null) => T[];
}

type BoardModelProps<T extends { id: Key }> = Pick<
  BoardProps<T>,
  | 'columns'
  | 'lanes'
  | 'items'
  | 'getColumn'
  | 'getLane'
  | 'collapsedColumns'
  | 'defaultCollapsedColumns'
  | 'onCollapsedColumnsChange'
  | 'collapsedLanes'
  | 'defaultCollapsedLanes'
  | 'onCollapsedLanesChange'
  | 'persistKey'
>;

function sum(values: Iterable<number>): number {
  let total = 0;
  for (const value of values) total += value;
  return total;
}

function useLaneKeys(lanes: readonly BoardLane[] | undefined): readonly (Key | null)[] {
  return useMemo(() => (lanes ? lanes.map((lane) => lane.id) : [null]), [lanes]);
}

/** The board's cells, counts and collapsed columns and lanes, from its props. */
export function useBoardModel<T extends { id: Key }>(props: BoardModelProps<T>): BoardModel<T> {
  const { columns, lanes, items, getColumn, getLane, persistKey } = props;
  const baseId = useId();
  const collapsedColumns = useCollapsedKeys({
    value: props.collapsedColumns,
    defaultValue: props.defaultCollapsedColumns,
    onChange: props.onCollapsedColumnsChange,
    storageKey: persistKey && `${persistKey}:columns`,
  });
  const collapsedLanes = useCollapsedKeys({
    value: props.collapsedLanes,
    defaultValue: props.defaultCollapsedLanes,
    onChange: props.onCollapsedLanesChange,
    storageKey: persistKey && `${persistKey}:lanes`,
  });
  const columnKeys = useMemo(() => columns.map((column) => column.id), [columns]);
  const laneKeys = useLaneKeys(lanes);
  const layout = useMemo(
    () =>
      createBoardLayout({
        columns: columnKeys,
        lanes: laneKeys,
        items,
        getKey: (item) => item.id,
        getColumn,
        getLane: lanes ? getLane : undefined,
      }),
    [columnKeys, laneKeys, lanes, items, getColumn, getLane],
  );
  const itemsByKey = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const countColumn = (column: Key) =>
    sum([...(layout.cells.get(column)?.values() ?? [])].map((keys) => keys.length));
  return {
    columns,
    columnKeys,
    layout,
    itemsByKey,
    collapsedColumns,
    collapsedLanes,
    columnTitleId: (index) => `${baseId}-column-${index}`,
    laneTitleId: (index) => `${baseId}-lane-${index}`,
    countColumn,
    countLane: (lane) =>
      sum(columnKeys.map((column) => getCellCards(layout, { column, lane }).length)),
    isOverLimit: (column) => column.limit !== undefined && countColumn(column.id) > column.limit,
    getCellItems: (column, lane) =>
      getCellCards(layout, { column, lane }).flatMap((key) => itemsByKey.get(key) ?? []),
  };
}
