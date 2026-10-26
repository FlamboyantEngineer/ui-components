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
/**
 * Pivots records: rows grouped by the layout's row fields (nested, outermost first) and columns by
 * its column fields, every cell and total aggregating the values over the records it covers. Keys
 * order numerically, false before true, text naturally, and empty values last as `null` keys.
 */
export declare function pivot(records: readonly PivotRecord[], layout: PivotLayout): PivotResult;
//# sourceMappingURL=pivot.d.ts.map