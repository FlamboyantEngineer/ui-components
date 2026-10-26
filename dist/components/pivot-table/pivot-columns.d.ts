import type { UiStrings } from '../../core/strings.js';
import type { PivotKey, PivotLayout, PivotResult, PivotRow, PivotValue } from '../../utils/pivot.js';
import type { TableProps } from '../table/table.js';
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
/** A value's header text: its label, else its aggregation and field, else the field alone. */
export declare function getValueLabel(value: PivotValue, field: PivotTableField, strings: UiStrings): string;
/**
 * The pivot's columns: the row header column, a column per column key and value, and with column
 * fields one row total column per value. With row fields, the summary row holds the column totals.
 * Several values group each column key's value columns under its header; one value groups every
 * column key under the value's header.
 */
export declare function createPivotColumns(options: PivotColumnsOptions): PivotColumns;
export {};
//# sourceMappingURL=pivot-columns.d.ts.map