import type { TableProps as AriaTableProps } from 'react-aria-components';
import type { TableRow } from './table-rows.js';
import type { TableGridOptions } from './use-table-grid.js';

/** The props React Aria's table takes from a `Table`'s props. */
export type TableAriaProps = Omit<
  AriaTableProps,
  'onRowAction' | 'sortDescriptor' | 'onSortChange'
>;

type OwnKey =
  | Exclude<keyof TableGridOptions<TableRow>, keyof AriaTableProps | `data-${string}`>
  | 'sortDescriptor'
  | 'onSortChange'
  | 'onRowAction';

// A record, so the compiler fails when a prop of the table's own is missing here.
const ownKeys: Readonly<Record<OwnKey, true>> = {
  columns: true,
  rows: true,
  sortDescriptor: true,
  defaultSortDescriptor: true,
  onSortChange: true,
  sortDescriptors: true,
  defaultSortDescriptors: true,
  onSortDescriptorsChange: true,
  filter: true,
  defaultFilter: true,
  onFilterChange: true,
  columnGroups: true,
  columnLayout: true,
  defaultColumnLayout: true,
  onColumnLayoutChange: true,
  getChildRows: true,
  renderRowDetail: true,
  onCellEdit: true,
  pagination: true,
  onLoadMore: true,
  isLoading: true,
  isPending: true,
  loadingMessage: true,
  errorMessage: true,
  onRetry: true,
  emptyMessage: true,
  renderRowActions: true,
  actionsColumnWidth: true,
  reorder: true,
  persistKey: true,
  onColumnWidthsChange: true,
  virtualized: true,
  onRowAction: true,
};

/** The props of a `Table` that React Aria's table takes, such as selection and labelling. */
export function pickAriaProps<T extends TableRow>(options: TableGridOptions<T>): TableAriaProps {
  const entries = Object.entries(options).filter(([key]) => !(key in ownKeys));
  return Object.fromEntries(entries) as TableAriaProps;
}
