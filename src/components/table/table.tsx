import { useState, type ReactNode } from 'react';
import {
  ResizableTableContainer,
  Table as AriaTable,
  TableLayout,
  Virtualizer,
  type Key,
  type SortDescriptor,
  type TableProps as AriaTableProps,
} from 'react-aria-components';
import { splitDataAttributes } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import type { TableColumnWidths } from './column-sizing.js';
import { stateRowId, TableBody } from './table-body.js';
import { TableFilter } from './table-filter.js';
import { TableHeader } from './table-header.js';
import { tableHooks as hooks } from './table-hooks.js';
import type { TableColumn, TableRow } from './table-rows.js';
import { useColumnWidths } from './use-column-widths.js';
import { useTableGrid, type TableGrid } from './use-table-grid.js';
import type { TableReorderOptions } from './use-table-reorder.js';

export type TableDensity = 'regular' | 'compact';

export interface TableProps<T extends TableRow>
  extends
    Omit<
      AriaTableProps,
      | 'className'
      | 'style'
      | 'render'
      | 'children'
      | 'id'
      | 'sortDescriptor'
      | 'onSortChange'
      | 'dragAndDropHooks'
    >,
    BaseProps {
  columns: readonly TableColumn<T>[];
  rows: readonly T[];
  /** Controlled sort. The caller supplies `rows` in that order; the header reports it. */
  sortDescriptor?: SortDescriptor | null | undefined;
  /** Initial sort while the table owns the sort and orders `rows` itself. */
  defaultSortDescriptor?: SortDescriptor | null | undefined;
  /** Called on each header press: ascending, descending, then `null` for unsorted. */
  onSortChange?: ((descriptor: SortDescriptor | null) => void) | undefined;
  /** Draws a search box that keeps the rows whose text contains every term. */
  filterable?: boolean | undefined;
  /** The search box's name. Defaults to the provider's `filterRows` string. */
  filterLabel?: string | undefined;
  /** Replaces the rows with a loading notice. */
  isLoading?: boolean | undefined;
  /** The loading notice. Defaults to the provider's `loading` string. */
  loadingMessage?: ReactNode;
  /** Replaces the rows with an error notice; wins over loading. */
  errorMessage?: ReactNode;
  /** Adds a retry button to the error notice. */
  onRetry?: (() => void | Promise<unknown>) | undefined;
  /** The notice when there are no rows. Defaults to the provider's `noResults` string. */
  emptyMessage?: ReactNode;
  /** Content of a trailing actions cell per row, such as icon buttons or a menu trigger. */
  renderRowActions?: ((row: T) => ReactNode) | undefined;
  /** Width of the actions column in pixels. Defaults to 44. */
  actionsColumnWidth?: number | undefined;
  /** Turns on row reordering by drag and drop and Alt+Arrow keys. */
  reorder?: TableReorderOptions<T> | undefined;
  /** Storage key under which resized column widths persist. */
  persistKey?: string | undefined;
  /** Called once when a column resize ends, with the data columns' widths. */
  onColumnWidthsChange?: ((widths: TableColumnWidths) => void) | undefined;
  /** Row spacing. Defaults to `regular`. */
  density?: TableDensity | undefined;
  /** Keeps the header in view while the table scrolls. */
  stickyHeader?: boolean | undefined;
  /** Renders only the rows in view; the stylesheet must bound the scroll area's height. */
  virtualized?: boolean | undefined;
  /** Row height in pixels for a virtualized table. Defaults to 40, or 32 when compact. */
  rowHeight?: number | undefined;
}

const virtualRowHeights: Readonly<Record<TableDensity, number>> = { regular: 40, compact: 32 };

function TableGridElement<T extends TableRow>({ grid }: { grid: TableGrid<T> }) {
  const { ariaProps, view, reorder, reordering, onRowAction, body } = grid;
  return (
    <AriaTable
      {...ariaProps}
      // React Aria keeps drag and drop hooks for a table's lifetime: remount when reorder toggles.
      key={reorder ? 'reorder' : 'static'}
      className={hooks.slotClass('grid')}
      sortDescriptor={view.sortDescriptor ?? undefined}
      onSortChange={view.onSortChange}
      onRowAction={onRowAction && ((key: Key) => key !== stateRowId && onRowAction(key))}
      dragAndDropHooks={reorder ? reordering.dragAndDropHooks : undefined}
    >
      <TableHeader structure={body.structure} widths={grid.widths} />
      <TableBody {...body} />
    </AriaTable>
  );
}

/**
 * A data table on React Aria's Table: columns and rows as plain data with render callbacks,
 * sorting, filtering, selection, resizable columns, row reordering, loading, empty and error
 * notices, and optional virtualization for long lists.
 */
export function Table<T extends TableRow>(props: TableProps<T>) {
  const {
    density = 'regular',
    stickyHeader,
    virtualized,
    rowHeight,
    filterable,
    filterLabel,
  } = props;
  const { persistKey, onColumnWidthsChange, className, id, ...rest } = props;
  const strings = useUiStrings();
  const [query, setQuery] = useState('');
  const [dataAttributes, gridProps] = splitDataAttributes(rest);
  const sizing = useColumnWidths({ columns: props.columns, persistKey, onColumnWidthsChange });
  const grid = useTableGrid({ ...gridProps, query, widths: sizing.widths });
  const height = rowHeight ?? virtualRowHeights[density];
  const element = <TableGridElement grid={grid} />;
  return (
    <div
      {...hooks.root({
        className,
        props: dataAttributes,
        data: { density, stickyHeader, virtualized },
      })}
      id={id}
      aria-busy={grid.body.status === 'loading' || undefined}
      {...(grid.reorder ? grid.reordering.rootProps : {})}
    >
      {filterable ? (
        <TableFilter label={filterLabel ?? strings.filterRows} value={query} onChange={setQuery} />
      ) : null}
      <ResizableTableContainer
        className={hooks.slotClass('scroll')}
        onResize={sizing.onResize}
        onResizeEnd={sizing.onResizeEnd}
      >
        {virtualized ? (
          <Virtualizer
            layout={TableLayout}
            layoutOptions={{ rowHeight: height, headingHeight: height }}
          >
            {element}
          </Virtualizer>
        ) : (
          element
        )}
      </ResizableTableContainer>
    </div>
  );
}
