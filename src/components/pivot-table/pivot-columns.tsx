// The table columns and column groups a pivot result draws as: the row groups' header column, one
// column per column key and value, and the row totals, with column totals in the summary row.

import type { UiStrings } from '../../core/strings.js';
import type {
  PivotAggregates,
  PivotColumn,
  PivotKey,
  PivotLayout,
  PivotResult,
  PivotRow,
  PivotValue,
} from '../../utils/pivot.js';
import type { TableProps } from '../table/table.js';
import { findField } from './pivot-fields.js';
import { pivotTableHooks as hooks } from './pivot-table-hooks.js';

/** A field the pivot table offers, by its id in the records. */
export interface PivotTableField {
  /** The field's key in each record. */
  id: string;
  /** The field's name in headers and the field chooser. */
  label: string;
  /** Writes a key of the field in row and column headers. Defaults to the key as text. */
  formatKey?: ((key: PivotKey) => string) | undefined;
  /** How the field's aggregated values read, except counts. */
  formatOptions?: Intl.NumberFormatOptions | undefined;
  /** The aggregation the field takes when it moves into the values. Defaults to `count`. */
  aggregate?: 'sum' | 'count' | 'min' | 'max' | 'average' | undefined;
}

/** A row the table draws: a row group, or the grand total when no field groups the rows. */
export interface PivotTableRow {
  id: string;
  group: PivotRow | null;
  /** The group's place among its siblings in key order, which the row header column sorts by. */
  order: number;
}

export interface PivotColumnsOptions {
  result: PivotResult;
  layout: PivotLayout;
  fields: readonly PivotTableField[];
  strings: UiStrings;
  locale: string;
}

type PivotTableColumn = TableProps<PivotTableRow>['columns'][number];

type PivotTableColumnGroup = NonNullable<TableProps<PivotTableRow>['columnGroups']>[number];

export interface PivotColumns {
  columns: PivotTableColumn[];
  groups: PivotTableColumnGroup[];
}

interface FooterOptions {
  hasFooter: boolean;
  isTotal: boolean;
}

interface ValueColumnOptions {
  id: string;
  header: string;
  read: (row: PivotTableRow) => number | null;
  total: number | null;
}

/** The text of a key in a field's headers: the field's format, or the key as text. */
function formatKey(field: PivotTableField, key: PivotKey, strings: UiStrings): string {
  if (key === null) return strings.pivotEmptyKey;
  return field.formatKey ? field.formatKey(key) : String(key);
}

function cellsOf(row: PivotTableRow, result: PivotResult) {
  return row.group ? row.group.cells : result.totals;
}

function totalOf(row: PivotTableRow, result: PivotResult): PivotAggregates {
  return row.group ? row.group.total : result.grandTotal;
}

function Value({ value, isTotal }: { value: string; isTotal: boolean }) {
  return <span {...hooks.slot('value', { total: isTotal })}>{value}</span>;
}

/** A column's header text: its key in each column field, outermost first. */
function columnLabel(column: PivotColumn, options: PivotColumnsOptions): string {
  return column.path
    .map((key, index) =>
      formatKey(findField(options.fields, options.layout.columns[index]!), key, options.strings),
    )
    .join(' / ');
}

/** A value's header text: its label, else its aggregation and field, else the field alone. */
export function getValueLabel(
  value: PivotValue,
  field: PivotTableField,
  strings: UiStrings,
): string {
  if (value.label) return value.label;
  const { aggregate = 'sum' } = value;
  if (typeof aggregate === 'function') return field.label;
  return strings.pivotValueLabel(strings.pivotAggregate(aggregate), field.label);
}

function createFormatter(value: PivotValue, field: PivotTableField, locale: string) {
  const format = new Intl.NumberFormat(
    locale,
    value.aggregate === 'count' ? undefined : field.formatOptions,
  );
  return (number: number | null) => (number === null ? '' : format.format(number));
}

function createRowColumn(options: PivotColumnsOptions): PivotTableColumn {
  const { layout, fields, strings } = options;
  const header =
    layout.rows.map((id) => findField(fields, id).label).join(' / ') || strings.pivotRows;
  return {
    id: 'row',
    header,
    isRowHeader: true,
    allowsSorting: true,
    getValue: (row) => row.order,
    renderCell: (row) => (
      <span {...hooks.slot('key', { total: row.group === null })}>
        {row.group
          ? formatKey(findField(fields, row.group.field), row.group.value, strings)
          : strings.pivotTotal}
      </span>
    ),
    renderFooter:
      layout.rows.length > 0
        ? () => <span {...hooks.slot('key', { total: true })}>{strings.pivotTotal}</span>
        : undefined,
  };
}

interface ValueSpec {
  label: string;
  format: (number: number | null) => string;
}

/** A value column: its cells and, with row fields, its total in the summary row. */
function createValueColumn(column: ValueColumnOptions, value: ValueSpec, footer: FooterOptions) {
  const { read } = column;
  return {
    id: column.id,
    header: column.header,
    align: 'end' as const,
    allowsSorting: true,
    getValue: read,
    renderCell: (row: PivotTableRow) => (
      // Without row fields the one row holds the column totals.
      <Value value={value.format(read(row))} isTotal={footer.isTotal || row.group === null} />
    ),
    renderFooter: footer.hasFooter
      ? () => <Value value={value.format(column.total)} isTotal />
      : undefined,
  } satisfies PivotTableColumn;
}

/** One column per column key and value, grouped under the column key with several values. */
function createKeyColumns(
  options: PivotColumnsOptions,
  values: readonly ValueSpec[],
): PivotColumns {
  const { result, layout } = options;
  const isGrouped = values.length > 1;
  const footer = { hasFooter: layout.rows.length > 0, isTotal: false };
  const columns: PivotTableColumn[] = [];
  const groups: PivotTableColumnGroup[] = [];
  result.columns.forEach((column, columnIndex) => {
    const label = layout.columns.length > 0 ? columnLabel(column, options) : '';
    const ids = values.map((value, valueIndex) => {
      const id = `c${columnIndex}v${valueIndex}`;
      const read = (row: PivotTableRow) => cellsOf(row, result)[column.key]?.[valueIndex] ?? null;
      const header = isGrouped || label === '' ? value.label : label;
      const total = result.totals[column.key]?.[valueIndex] ?? null;
      columns.push(createValueColumn({ id, header, read, total }, value, footer));
      return id;
    });
    if (isGrouped && label !== '')
      groups.push({ id: `g${columnIndex}`, header: label, columns: ids });
  });
  const [only] = values;
  if (!isGrouped && only && layout.columns.length > 0 && columns.length > 0) {
    groups.push({ id: 'value', header: only.label, columns: columns.map((column) => column.id) });
  }
  return { columns, groups };
}

/** With column fields, one row total column per value, grouped under the total header. */
function createTotalColumns(
  options: PivotColumnsOptions,
  values: readonly ValueSpec[],
): PivotColumns {
  const { result, layout, strings } = options;
  if (layout.columns.length === 0) return { columns: [], groups: [] };
  const isGrouped = values.length > 1;
  const footer = { hasFooter: layout.rows.length > 0, isTotal: true };
  const columns = values.map((value, valueIndex) =>
    createValueColumn(
      {
        id: `t${valueIndex}`,
        header: isGrouped ? value.label : strings.pivotTotal,
        read: (row) => totalOf(row, result)[valueIndex] ?? null,
        total: result.grandTotal[valueIndex] ?? null,
      },
      value,
      footer,
    ),
  );
  const ids = columns.map((column) => column.id);
  return {
    columns,
    groups: isGrouped ? [{ id: 'total', header: strings.pivotTotal, columns: ids }] : [],
  };
}

/**
 * The pivot's columns: the row header column, a column per column key and value, and with column
 * fields one row total column per value. With row fields, the summary row holds the column totals.
 * Several values group each column key's value columns under its header; one value groups every
 * column key under the value's header.
 */
export function createPivotColumns(options: PivotColumnsOptions): PivotColumns {
  const { layout, fields, strings, locale } = options;
  const values = layout.values.map((value) => {
    const field = findField(fields, value.field);
    return {
      label: getValueLabel(value, field, strings),
      format: createFormatter(value, field, locale),
    };
  });
  const keyed = createKeyColumns(options, values);
  const totals = createTotalColumns(options, values);
  return {
    columns: [createRowColumn(options), ...keyed.columns, ...totals.columns],
    groups: [...keyed.groups, ...totals.groups],
  };
}
