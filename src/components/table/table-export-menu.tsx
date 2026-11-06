'use client';

import { useUiStrings } from '../../core/provider.js';
import { CSV_BYTE_ORDER_MARK } from '../../utils/csv.js';
import { downloadBlob } from '../../utils/download.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import {
  formatTableCsv,
  listExportRows,
  resolveExportColumns,
  type TableCsvExport,
  type TableExportRows,
  type TableExportScope,
} from './table-export.js';
import { tableHooks as hooks } from './table-hooks.js';
import type { TableColumn, TableRow } from './table-rows.js';
import type { TableGridOptions } from './use-table-grid.js';
import type { TableRowsView } from './use-table-rows.js';
import type { TableSelection } from './use-table-selection.js';

/** The export menu's settings and the rows of each scope it offers. */
export interface TableExportMenuProps<T> {
  csvExport: TableCsvExport<T>;
  scopes: readonly TableExportScope[];
  rows: TableExportRows<T>;
  columns: readonly TableColumn<T>[];
  /** The table holds only part of its rows and the caller gave no `allRows`. */
  isPartial: boolean;
}

/** The default scopes: the page when paginated, every row, and the selection in multiple selection. */
function listDefaultScopes<T extends TableRow>(options: TableGridOptions<T>): TableExportScope[] {
  return [
    ...(options.pagination ? (['page'] as const) : []),
    'rows' as const,
    ...(options.selectionMode === 'multiple' ? (['selected'] as const) : []),
  ];
}

/** The export menu's props, when the table exports. */
export function resolveExportMenu<T extends TableRow>(
  options: TableGridOptions<T>,
  parts: {
    view: TableRowsView<T>;
    selection: TableSelection<T>;
    drawn: readonly TableColumn<T>[];
  },
): TableExportMenuProps<T> | null {
  const { csvExport } = options;
  if (!csvExport) return null;
  const hasPartialRows =
    options.pagination?.rowCount !== undefined || options.onLoadMore !== undefined;
  return {
    csvExport,
    scopes: csvExport.scopes ?? listDefaultScopes(options),
    rows: {
      page: parts.view.nodes,
      presented: parts.view.presentedNodes,
      selected: parts.selection.selectedRows,
      getChildRows: options.getChildRows,
    },
    columns: resolveExportColumns(csvExport.columns, options.columns, parts.drawn),
    isPartial: hasPartialRows && csvExport.allRows === undefined,
  };
}

/**
 * The export menu: one item per scope, which writes its rows as CSV and downloads the file, or
 * hands it to `onExport`. The selected-rows item is disabled while nothing is selected.
 */
export function TableExportMenu<T extends TableRow>(props: TableExportMenuProps<T>) {
  const { csvExport, scopes, rows, columns, isPartial } = props;
  const strings = useUiStrings();
  const labels: Readonly<Record<TableExportScope, string>> = {
    page: strings.exportPage,
    rows: isPartial ? strings.exportLoadedRows : strings.exportAllRows,
    selected: strings.exportSelectedRows,
  };
  const exportScope = (scope: TableExportScope) => {
    const { fileName, delimiter, escapeFormulas, byteOrderMark = true } = csvExport;
    const exported = listExportRows(scope, rows, csvExport.allRows);
    const text = formatTableCsv({ rows: exported, columns, delimiter, escapeFormulas });
    if (csvExport.onExport) {
      csvExport.onExport({ fileName, scope, text });
      return;
    }
    const content = byteOrderMark ? CSV_BYTE_ORDER_MARK + text : text;
    downloadBlob(new Blob([content], { type: 'text/csv;charset=utf-8' }), fileName);
  };
  return (
    <DropdownMenu
      label={strings.exportCsv}
      size="sm"
      className={hooks.slotClass('export-menu')}
      items={scopes.map((scope) => ({ id: scope, label: labels[scope] }))}
      disabledKeys={rows.selected.length === 0 ? ['selected'] : []}
      onAction={(key) => {
        const scope = scopes.find((candidate) => candidate === key);
        if (scope) exportScope(scope);
      }}
    />
  );
}
