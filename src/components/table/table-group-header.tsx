'use client';

import { useContext, type CSSProperties, type JSX } from 'react';
import { TableColumnResizeStateContext, TableStateContext } from '../../primitives/index.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { groupColumnCells } from './table-columns.js';
import { tableHooks as hooks } from './table-hooks.js';
import type { TableHeaderModel } from './table-header.js';
import type { TableStructure } from './table-structure.js';

// The group header row above the column headers, in a static or a virtualized table.

/** Whether the header draws a group row: some column groups exist. */
export function hasGroupRow(groups: readonly unknown[]): boolean {
  return groups.length > 0;
}

/**
 * The widths of React Aria's columns as layout tracks. A fixed table layout takes its column widths
 * from its first row, which a group row would otherwise decide.
 */
function TableColumnTracks() {
  const state = useContext(TableStateContext);
  const layout = useContext(TableColumnResizeStateContext);
  return (
    <colgroup>
      {(state?.collection.columns ?? []).map((column) => (
        <col
          key={toKeyIdentity(column.key)}
          style={{ width: layout?.getColumnWidth(column.key) }}
        />
      ))}
    </colgroup>
  );
}

/** The grid's `table` element with column tracks first, for a table with a group row. */
export function renderTableWithTracks(
  props: JSX.IntrinsicElements['table'] | JSX.IntrinsicElements['div'],
) {
  // Groups draw only in a table element, so the props are a `table`'s.
  return (
    <table {...(props as JSX.IntrinsicElements['table'])}>
      <TableColumnTracks />
      {props.children}
    </table>
  );
}

type GroupCells = ReturnType<typeof groupColumnCells>;

/** The group header row of a static table: cells spanning their columns' tracks. */
function StaticGroupRow({ cells }: { cells: GroupCells }) {
  return (
    <tr role="row">
      {cells.map(({ key, group, span }) =>
        group ? (
          <th
            key={key}
            role="columnheader"
            scope="colgroup"
            colSpan={span}
            className={hooks.slotClass('column-group')}
          >
            {group.header}
          </th>
        ) : (
          <td
            key={key}
            colSpan={span}
            aria-hidden="true"
            {...hooks.slot('column-group', { ungrouped: true })}
          />
        ),
      )}
    </tr>
  );
}

/**
 * The group header row of a virtualized table, which positions its rows itself: the row fills the
 * room the layout leaves above the column headers, each cell placed over its columns' widths.
 */
function VirtualGroupRow({ cells, height }: { cells: GroupCells; height: number }) {
  const state = useContext(TableStateContext);
  const widths = useContext(TableColumnResizeStateContext);
  const columns = state?.collection.columns ?? [];
  const widthOf = (index: number) => {
    const column = columns[index];
    return column ? (widths?.getColumnWidth(column.key) ?? 0) : 0;
  };
  let start = 0;
  let left = 0;
  const placed = [];
  for (const cell of cells) {
    let width = 0;
    for (let at = start; at < start + cell.span; at += 1) width += widthOf(at);
    placed.push({ ...cell, index: start, style: { position: 'absolute', left, width, height } });
    start += cell.span;
    left += width;
  }
  return (
    <div role="row" style={{ position: 'absolute', top: 0, left: 0, width: left, height }}>
      {placed.map(({ key, group, span, index, style }) =>
        group ? (
          <div
            key={key}
            role="columnheader"
            aria-colindex={index + 1}
            aria-colspan={span}
            style={style as CSSProperties}
            className={hooks.slotClass('column-group')}
          >
            {group.header}
          </div>
        ) : (
          <div
            key={key}
            aria-hidden="true"
            style={style as CSSProperties}
            {...hooks.slot('column-group', { ungrouped: true })}
          />
        ),
      )}
    </div>
  );
}

/** A header element that draws the group header row above React Aria's column row. */
export function createGroupedHeader<T>({
  structure,
  model,
}: {
  structure: TableStructure<T>;
  model: TableHeaderModel<T>;
}) {
  const cells = groupColumnCells(structure.columns, model.groups, {
    leading: Number(structure.hasSelection),
    trailing: Number(structure.hasActions),
  });
  if (structure.isVirtualized) {
    return (props: JSX.IntrinsicElements['thead'] | JSX.IntrinsicElements['div']) => (
      <div {...(props as JSX.IntrinsicElements['div'])}>
        <VirtualGroupRow cells={cells} height={model.rowHeight} />
        {/* React Aria places header cells from the top of the header; this lowers them below the group row. */}
        <div
          role="presentation"
          style={{ position: 'absolute', top: model.rowHeight, left: 0, right: 0 }}
        >
          {props.children}
        </div>
      </div>
    );
  }
  // A static table's groups draw in a table element, so the props are a `thead`'s.
  return (props: JSX.IntrinsicElements['thead'] | JSX.IntrinsicElements['div']) => (
    <thead {...(props as JSX.IntrinsicElements['thead'])}>
      <StaticGroupRow cells={cells} />
      {props.children}
    </thead>
  );
}
