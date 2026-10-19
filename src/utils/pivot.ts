// Pivot of plain records (specs/PIVOT-TABLE.md): groups by row and column fields and aggregates
// value fields per group, with row, column and grand totals computed from the records.

/** A record a pivot reads: plain data whose fields are named by key. */
export type PivotRecord = Readonly<Record<string, unknown>>;

/** The value a group's records share in a row or column field; `null` for an empty value. */
export type PivotKey = string | number | boolean | null;

/** A built-in aggregation of a value field. */
export type PivotAggregateName = 'sum' | 'count' | 'min' | 'max' | 'average';

/** A custom aggregation: the group's values of the field (empty ones included) to one number. */
export type PivotAggregateFunction = (values: readonly unknown[]) => number | null;

/** A value field of a pivot and how its values aggregate. */
export interface PivotValue {
  /** The field whose values aggregate. */
  field: string;
  /** How they aggregate. Defaults to `sum`. */
  aggregate?: PivotAggregateName | PivotAggregateFunction | undefined;
  /** The value's header, instead of the aggregation and the field's label. */
  label?: string | undefined;
}

/** Which fields group the rows, which group the columns, and which aggregate in the cells. */
export interface PivotLayout {
  /** Fields that group the rows, outermost first. */
  rows: readonly string[];
  /** Fields that group the columns, outermost first. */
  columns: readonly string[];
  /** The values each cell aggregates, in order. */
  values: readonly PivotValue[];
}

/** Aggregates in layout value order; `null` where a value has nothing to aggregate. */
export type PivotAggregates = readonly (number | null)[];

/** A column of a pivot: one combination of the column fields' keys. */
export interface PivotColumn {
  /** Identifies the column: its path as JSON. */
  key: string;
  /** Its key in each column field, outermost first. */
  path: readonly PivotKey[];
}

/** A row group of a pivot, with its cells, its total and the groups of the next row field. */
export interface PivotRow {
  /** Identifies the group: its path as JSON. */
  key: string;
  /** The row field this group's level groups by. */
  field: string;
  /** The group's key in that field. */
  value: PivotKey;
  /** Its key in each row field down to its own, outermost first. */
  path: readonly PivotKey[];
  /** The aggregates of the group's records in each column, by column key; absent without records. */
  cells: Readonly<Record<string, PivotAggregates>>;
  /** The aggregates of all the group's records. */
  total: PivotAggregates;
  /** The groups of the next row field within this one; none at the last row field. */
  children: readonly PivotRow[];
}

/** The result of a pivot. */
export interface PivotResult {
  rows: readonly PivotRow[];
  columns: readonly PivotColumn[];
  /** The aggregates of every record in each column, by column key. */
  totals: Readonly<Record<string, PivotAggregates>>;
  /** The aggregates of every record. */
  grandTotal: PivotAggregates;
}

interface KeyGroup {
  key: PivotKey;
  records: PivotRecord[];
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

function readKey(record: PivotRecord, field: string): PivotKey {
  const value = record[field];
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  return String(value);
}

/** Orders keys: numbers by value, booleans false first, text naturally, empty keys last. */
function compareKeys(left: PivotKey, right: PivotKey): number {
  if (left === null || right === null) return (left === null ? 1 : 0) - (right === null ? 1 : 0);
  if (typeof left === 'number' && typeof right === 'number') return left - right;
  if (typeof left === 'boolean' && typeof right === 'boolean') return Number(left) - Number(right);
  return collator.compare(String(left), String(right));
}

/** The records grouped by their key in `field`, groups in key order. */
function groupRecords(records: readonly PivotRecord[], field: string): KeyGroup[] {
  const groups = new Map<string, KeyGroup>();
  for (const record of records) {
    const key = readKey(record, field);
    const id = JSON.stringify(key);
    const group = groups.get(id) ?? { key, records: [] };
    group.records.push(record);
    groups.set(id, group);
  }
  return [...groups.values()].sort((left, right) => compareKeys(left.key, right.key));
}

function isPresent(value: unknown): boolean {
  return value !== undefined && value !== null && value !== '';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

const aggregations: Readonly<
  Record<PivotAggregateName, (values: readonly unknown[]) => number | null>
> = {
  count: (values) => values.filter(isPresent).length,
  sum: (values) => {
    const numbers = values.filter(isNumber);
    return numbers.length === 0 ? null : numbers.reduce((total, value) => total + value, 0);
  },
  min: (values) => {
    const numbers = values.filter(isNumber);
    return numbers.length === 0 ? null : Math.min(...numbers);
  },
  max: (values) => {
    const numbers = values.filter(isNumber);
    return numbers.length === 0 ? null : Math.max(...numbers);
  },
  average: (values) => {
    const numbers = values.filter(isNumber);
    if (numbers.length === 0) return null;
    return numbers.reduce((total, value) => total + value, 0) / numbers.length;
  },
};

/**
 * One value's aggregate over records: `count` counts the non-empty values; `sum`, `min`, `max` and
 * `average` read the finite numbers and give `null` without one; a function gets every value.
 */
function aggregateValue(records: readonly PivotRecord[], value: PivotValue): number | null {
  const values = records.map((record) => record[value.field]);
  const { aggregate = 'sum' } = value;
  return typeof aggregate === 'function' ? aggregate(values) : aggregations[aggregate](values);
}

function aggregateAll(records: readonly PivotRecord[], layout: PivotLayout): PivotAggregates {
  return layout.values.map((value) => aggregateValue(records, value));
}

function columnKey(record: PivotRecord, layout: PivotLayout): string {
  return JSON.stringify(layout.columns.map((field) => readKey(record, field)));
}

/** The aggregates of records in each column they fall in, by column key. */
function aggregateColumns(records: readonly PivotRecord[], layout: PivotLayout) {
  const byColumn = new Map<string, PivotRecord[]>();
  for (const record of records) {
    const key = columnKey(record, layout);
    const members = byColumn.get(key) ?? [];
    members.push(record);
    byColumn.set(key, members);
  }
  return Object.fromEntries(
    [...byColumn].map(([key, members]) => [key, aggregateAll(members, layout)]),
  );
}

function buildColumns(
  records: readonly PivotRecord[],
  fields: readonly string[],
  path: readonly PivotKey[],
): PivotColumn[] {
  const field = fields[path.length];
  if (field === undefined) return [{ key: JSON.stringify(path), path }];
  return groupRecords(records, field).flatMap((group) =>
    buildColumns(group.records, fields, [...path, group.key]),
  );
}

function buildRows(
  records: readonly PivotRecord[],
  layout: PivotLayout,
  parent: readonly PivotKey[],
): PivotRow[] {
  const field = layout.rows[parent.length];
  if (field === undefined) return [];
  return groupRecords(records, field).map((group) => {
    const path = [...parent, group.key];
    return {
      key: JSON.stringify(path),
      field,
      value: group.key,
      path,
      cells: aggregateColumns(group.records, layout),
      total: aggregateAll(group.records, layout),
      children: buildRows(group.records, layout, path),
    };
  });
}

/**
 * Pivots records: rows grouped by the layout's row fields (nested, outermost first) and columns by
 * its column fields, every cell and total aggregating the values over the records it covers. Keys
 * order numerically, false before true, text naturally, and empty values last as `null` keys.
 */
export function pivot(records: readonly PivotRecord[], layout: PivotLayout): PivotResult {
  return {
    rows: buildRows(records, layout, []),
    columns: buildColumns(records, layout.columns, []),
    totals: aggregateColumns(records, layout),
    grandTotal: aggregateAll(records, layout),
  };
}
