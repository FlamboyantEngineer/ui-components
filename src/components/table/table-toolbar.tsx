'use client';

import type { ReactNode } from 'react';
import { TableSelectionBar } from './table-bulk-edit.js';
import { orderColumns } from './table-columns.js';
import { TableColumnsMenu } from './table-columns-menu.js';
import { TableExportMenu } from './table-export-menu.js';
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
  /** The export menu, for a table that exports. */
  exportMenu: ReactNode;
}

/**
 * The controls above the grid: the search box, the columns menu when a column allows hiding, and
 * the export menu. Without any it draws nothing.
 */
export function TableToolbar<T>({ filter, columns, layout, exportMenu }: TableToolbarProps<T>) {
  const hasMenu = columns.some((column) => column.allowsHiding);
  if (!filter && !hasMenu && !exportMenu) return null;
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
      {exportMenu}
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
        exportMenu={grid.exportMenu ? <TableExportMenu {...grid.exportMenu} /> : null}
      />
      {grid.selectionBar ? <TableSelectionBar {...grid.selectionBar} /> : null}
    </>
  );
}
