'use client';

import type { ReactNode } from 'react';
import { orderColumns } from './table-columns.js';
import { TableColumnsMenu } from './table-columns-menu.js';
import { tableHooks as hooks } from './table-hooks.js';
import type { TableColumn } from './table-rows.js';
import type { ColumnLayout } from './use-column-layout.js';

interface TableToolbarProps<T> {
  /** The search box, for a filterable table. */
  filter: ReactNode;
  /** Every column, in declared order. */
  columns: readonly TableColumn<T>[];
  layout: ColumnLayout<T>;
}

/**
 * The controls above the grid: the search box and, when a column allows hiding, the columns menu.
 * Without either it draws nothing.
 */
export function TableToolbar<T>({ filter, columns, layout }: TableToolbarProps<T>) {
  const hasMenu = columns.some((column) => column.allowsHiding);
  if (!filter && !hasMenu) return null;
  return (
    <div {...hooks.slot('toolbar')}>
      {filter}
      {hasMenu ? (
        <TableColumnsMenu
          columns={orderColumns(columns, layout.layout.order)}
          hidden={layout.layout.hidden ?? []}
          onHiddenChange={layout.setHidden}
        />
      ) : null}
    </div>
  );
}
