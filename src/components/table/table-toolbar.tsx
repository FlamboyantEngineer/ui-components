'use client';

import type { ReactNode } from 'react';
import { orderColumns } from './table-columns.js';
import { TableColumnsMenu } from './table-columns-menu.js';
import { tableHooks as hooks } from './table-hooks.js';
import type { TableColumn, TableRow } from './table-rows.js';
import { TableSearch } from './table-search.js';
import type { ColumnLayout } from './use-column-layout.js';
import type { TableGrid } from './use-table-grid.js';

interface TableToolbarProps<T> {
  /** The search box, for a filterable table. */
  filter: ReactNode;
  /** Every column, in declared order. */
  columns: readonly TableColumn<T>[];
  layout: ColumnLayout<T>;
}

/**
 * The controls above the grid: the search box, the columns menu when a column allows hiding, Without any it draws nothing.
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

/** The toolbar above the grid, with the search field when `search` labels one, and the selection bar. */
export function TableControls<T extends TableRow>({
  grid,
  columns,
  search,
}: {
  grid: TableGrid<T>;
  columns: readonly TableColumn<T>[];
  search: string | null;
}) {
  const { view } = grid;
  return (
    <>
      <TableToolbar
        filter={
          search === null ? null : (
            <TableSearch
              label={search}
              value={view.filter.query ?? ''}
              onChange={(query) => view.onFilterChange({ ...view.filter, query })}
            />
          )
        }
        columns={columns}
        layout={grid.layout}
      />
    </>
  );
}
