import type { ReactNode } from 'react';
import {
  ResizableTableContainer,
  Table as AriaTable,
  TableLayout,
  useDragAndDrop,
  Virtualizer,
} from '../../primitives/index.js';
import type {
  AriaLabellingProps,
  CollectionSelectionProps,
  ExpansionProps,
} from '../../core/events.js';
import { splitDataAttributes } from '../../core/hooks.js';
import type { BaseProps, Key, Size } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import type { ActionRowAction } from '../action-row/action-row.js';
import { Pagination } from '../pagination/pagination.js';
import type { TableColumnWidths } from './column-sizing.js';
import { TableBody } from './table-body.js';
import { TableSelectionBar } from './table-bulk-edit.js';
import { TableColumnFilter } from './table-column-filter.js';
import { getColumnText } from './table-column.js';
import type { TableColumnGroup, TableColumnLayout } from './table-columns.js';
import { TableSearch } from './table-search.js';
import { isEmptyFilterValue, setColumnFilter, type TableFilter } from './table-filters.js';
import { hasTableFooter, TableFooter } from './table-footer.js';
import {
  hasGroupRow,
  renderTableWithTracks,
  TableHeader,
  type TableHeaderModel,
} from './table-header.js';
import { tableHooks as hooks } from './table-hooks.js';
import type { TableColumn, TableRow } from './table-rows.js';
import { TableToolbar } from './table-toolbar.js';
import type { TableChildRows } from './table-tree.js';
import type { TableCellEdit } from './use-cell-editing.js';
import type { TableSpreadsheetProps } from './use-cell-selection.js';
import type { TableGroupingProps } from './use-table-expansion.js';
import { useTableGrid, type TableGrid } from './use-table-grid.js';
import type { TableReorderOptions } from './use-table-reorder.js';
import type { TablePagination } from './use-table-rows.js';
import type { TableSortOptions } from './use-table-sort.js';

export type TableSize = Extract<Size, 'sm' | 'md'>;

/** Caller `data-*` attributes for one row's element. */
export type TableRowAttributes = Pick<BaseProps, `data-${string}`>;

export interface TableProps<T extends TableRow>
  extends
    BaseProps,
    AriaLabellingProps,
    CollectionSelectionProps,
    ExpansionProps,
    TableSortOptions,
    TableGroupingProps<T>,
    TableSpreadsheetProps<T> {
  /** The data columns, in declared order. */
  columns: readonly TableColumn<T>[];
  /** The rows, each with an `id` unique in the table, nested rows included. */
  rows: readonly T[];
  /** Called with the key of the row the reader activates. */
  onRowAction?: ((key: Key) => void) | undefined;
  /**
   * Bulk actions on a selection bar above the grid while rows are selected, in multiple selection.
   * Columns with `bulkEdit` add an action there that sets one column across the selected rows.
   */
  selectionActions?: readonly ActionRowAction[] | undefined;
  /** The id of the column holding nested rows' expand buttons. Defaults to the first drawn column. */
  treeColumn?: Key | undefined;
  /** Draws a search box that keeps the rows whose text contains every term. */
  filterable?: boolean | undefined;
  /** The search box's name. Defaults to the provider's `filterRows` string. */
  filterLabel?: string | undefined;
  /**
   * Controlled filter: the search query and the column filter values. The caller supplies `rows`
   * filtered; `filterTableRows` filters them as the table does.
   */
  filter?: TableFilter | undefined;
  /** Initial filter while the table owns the filter and filters `rows` itself. */
  defaultFilter?: TableFilter | undefined;
  /** Called with the whole filter after each change to the search box or a column filter. */
  onFilterChange?: ((filter: TableFilter) => void) | undefined;
  /** Group headers drawn above runs of the columns they name. */
  columnGroups?: readonly TableColumnGroup[] | undefined;
  /** Controlled column order and hidden columns. */
  columnLayout?: TableColumnLayout | undefined;
  /** Initial column order and hidden columns while the table owns them and none are stored. */
  defaultColumnLayout?: TableColumnLayout | undefined;
  /** Called with the layout after a column moves, hides or shows. */
  onColumnLayoutChange?: ((layout: TableColumnLayout) => void) | undefined;
  /** A row's child rows, drawn under it once it is expanded. */
  getChildRows?: TableChildRows<T>;
  /** Content of a full-width detail row under a row, drawn once the row is expanded. */
  renderRowDetail?: ((row: T) => ReactNode) | undefined;
  /** Reports a finished cell edit. The table never changes its rows itself. */
  onCellEdit?: ((edit: TableCellEdit<T>) => void) | undefined;
  /** Shows the rows one page at a time under a page navigation. */
  pagination?: TablePagination | undefined;
  /** Asks for more rows when the end of the rows scrolls into view. */
  onLoadMore?: (() => void) | undefined;
  /** More rows are loading: a loading row follows the rows. */
  isLoading?: boolean | undefined;
  /** The rows are loading: a loading notice replaces them. */
  isPending?: boolean | undefined;
  /** The loading notice. Defaults to the provider's `loading` string. */
  loadingMessage?: ReactNode;
  /** Replaces the rows with an error notice; wins over loading. */
  errorMessage?: ReactNode;
  /** Adds a retry button to the error notice. */
  onRetry?: (() => void | Promise<unknown>) | undefined;
  /** The notice when there are no rows. Defaults to the provider's `noResults` string. */
  emptyMessage?: ReactNode;
  /** Caller `data-*` attributes per row, such as a change or status mark; hook values win. */
  getRowAttributes?: ((row: T) => TableRowAttributes) | undefined;
  /** Content of a trailing actions cell per row, such as icon buttons or a menu trigger. */
  renderRowActions?: ((row: T) => ReactNode) | undefined;
  /** Width of the actions column in pixels. Defaults to 44. */
  actionsColumnWidth?: number | undefined;
  /** Turns on row reordering by drag and drop and Alt+Arrow keys. */
  reorder?: TableReorderOptions<T> | undefined;
  /** Storage key under which resized widths, column order and hidden columns persist. */
  persistKey?: string | undefined;
  /** Called once when a column resize ends, with the data columns' widths. */
  onColumnWidthsChange?: ((widths: TableColumnWidths) => void) | undefined;
  /** Row size. Defaults to `md`. */
  size?: TableSize | undefined;
  /** Keeps the header in view while the table scrolls. */
  stickyHeader?: boolean | undefined;
  /** Renders only the rows in view; the stylesheet must bound the scroll area's height. */
  virtualized?: boolean | undefined;
  /** Row height in pixels for a virtualized table. Defaults to 40, or 32 at size `sm`. */
  rowHeight?: number | undefined;
}

const virtualRowHeights: Readonly<Record<TableSize, number>> = { md: 40, sm: 32 };

/** What the header row shows, from the grid and the table's own props. */
function createHeaderModel<T extends TableRow>(
  grid: TableGrid<T>,
  options: Pick<TableProps<T>, 'rows' | 'columnGroups'>,
): TableHeaderModel<T> {
  const { view } = grid;
  const values = view.filter.columns ?? {};
  return {
    widths: grid.widths.widths,
    groups: options.columnGroups ?? [],
    pinOffsets: grid.pinOffsets,
    onPinOffsets: grid.onPinOffsets,
    sort: view.sort.descriptors,
    isMultipleSort: view.sort.isMultiple,
    dropTarget: grid.columnReorder.dropTarget,
    isFiltered: (column) => !isEmptyFilterValue(values[column.id]),
    renderFilter: (column) =>
      column.filter ? (
        <TableColumnFilter
          column={column}
          label={getColumnText(column)}
          value={values[column.id]}
          rows={options.rows}
          onChange={(value) => view.onFilterChange(setColumnFilter(view.filter, column.id, value))}
        />
      ) : null,
  };
}

function TableGridElement<T extends TableRow>({
  grid,
  options,
}: {
  grid: TableGrid<T>;
  options: Pick<TableProps<T>, 'rows' | 'columnGroups'>;
}) {
  const { ariaProps, view, reordering, onRowAction, body, structure } = grid;
  const header = createHeaderModel(grid, options);
  const { dragAndDropHooks } = useDragAndDrop<T>(grid.dragAndDrop);
  return (
    <AriaTable
      {...ariaProps}
      // React Aria keeps drag and drop hooks for a table's lifetime: remount when reorder toggles.
      key={reordering ? 'reorder' : 'static'}
      className={hooks.slotClass('grid')}
      render={hasGroupRow(structure, header.groups) ? renderTableWithTracks : undefined}
      treeColumn={structure.treeColumn === null ? undefined : toCollectionKey(structure.treeColumn)}
      sortDescriptor={
        view.sort.descriptors[0] && {
          ...view.sort.descriptors[0],
          column: toCollectionKey(String(view.sort.descriptors[0].column)),
        }
      }
      onSortChange={(descriptor) =>
        view.sort.onSortChange({ ...descriptor, column: fromCollectionKey(descriptor.column) })
      }
      onRowAction={onRowAction}
      dragAndDropHooks={reordering ? dragAndDropHooks : undefined}
    >
      <TableHeader structure={structure} model={header} />
      <TableBody {...body} />
      {body.status === null && hasTableFooter(structure) ? (
        <TableFooter structure={structure} rows={view.presentedRows} pinOffsets={grid.pinOffsets} />
      ) : null}
    </AriaTable>
  );
}

/**
 * A data table on React Aria's Table: columns and rows as plain data with render callbacks;
 * sorting by one or several columns; a search box and column filters; selection with a selection
 * bar and bulk edit; resizable, reorderable, hideable, pinned and grouped columns; row groups with
 * aggregates; nested and detail rows; cell editing and a spreadsheet mode; a summary row; row
 * reordering; pagination, loading more and virtualization; and loading, empty and error notices.
 */
export function Table<T extends TableRow>({
  size = 'md',
  stickyHeader,
  rowHeight,
  filterable,
  filterLabel,
  className,
  id,
  ...rest
}: TableProps<T>) {
  const strings = useUiStrings();
  const [dataAttributes, gridProps] = splitDataAttributes(rest);
  const grid = useTableGrid(gridProps);
  const { view, layout } = grid;
  const { virtualized } = rest;
  const height = rowHeight ?? virtualRowHeights[size];
  const element = <TableGridElement grid={grid} options={rest} />;
  const label = rest['aria-label'];
  return (
    <div
      {...grid.rootProps}
      {...hooks.root({
        className,
        props: dataAttributes,
        data: { size, stickyHeader, virtualized },
      })}
      id={id}
      aria-busy={grid.body.status === 'loading' || undefined}
    >
      <TableToolbar
        filter={
          filterable ? (
            <TableSearch
              label={filterLabel ?? strings.filterRows}
              value={view.filter.query ?? ''}
              onChange={(query) => view.onFilterChange({ ...view.filter, query })}
            />
          ) : null
        }
        columns={rest.columns}
        layout={layout}
      />
      {grid.selectionBar ? <TableSelectionBar {...grid.selectionBar} /> : null}
      <ResizableTableContainer
        className={hooks.slotClass('scroll')}
        onResize={grid.widths.onResize}
        onResizeEnd={grid.widths.onResizeEnd}
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
      {view.pages ? (
        <Pagination
          className={hooks.slotClass('pagination')}
          aria-label={label ? strings.paginationOf(label) : undefined}
          pageCount={view.pages.pageCount}
          page={view.pages.page}
          onPageChange={view.pages.onPageChange}
        />
      ) : null}
    </div>
  );
}
